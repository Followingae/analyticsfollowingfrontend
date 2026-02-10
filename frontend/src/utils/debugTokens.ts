/**
 * Debug utility for checking token storage
 * Use this in the browser console to diagnose token issues
 */

export function debugTokens() {
  console.log('=== 🔍 Token Debug Information ===');

  // Check localStorage
  console.log('\n📦 LocalStorage Contents:');
  console.log('- access_token exists:', !!localStorage.getItem('access_token'));
  console.log('- auth_tokens exists:', !!localStorage.getItem('auth_tokens'));
  console.log('- refresh_token exists:', !!localStorage.getItem('refresh_token'));

  // Check access_token
  const accessToken = localStorage.getItem('access_token');
  if (accessToken) {
    console.log('\n🔑 access_token:');
    console.log('  - Length:', accessToken.length);
    console.log('  - Preview:', accessToken.substring(0, 50) + '...');
    console.log('  - Is "null" string:', accessToken === 'null');
    console.log('  - Is "undefined" string:', accessToken === 'undefined');
    console.log('  - Is empty string:', accessToken === '');
    console.log('  - JWT segments:', accessToken.split('.').length);
  } else {
    console.log('\n❌ access_token is not set');
  }

  // Check auth_tokens
  const authTokens = localStorage.getItem('auth_tokens');
  if (authTokens) {
    console.log('\n📋 auth_tokens:');
    console.log('  - Raw value:', authTokens.substring(0, 100) + '...');

    try {
      const parsed = JSON.parse(authTokens);
      console.log('  - Parsed successfully:', true);
      console.log('  - Has access_token:', !!parsed.access_token);
      console.log('  - Has access:', !!parsed.access);
      console.log('  - Has refresh_token:', !!parsed.refresh_token);

      if (parsed.access_token) {
        console.log('  - access_token preview:', parsed.access_token.substring(0, 50) + '...');
        console.log('  - access_token JWT segments:', parsed.access_token.split('.').length);
      }

      if (parsed.access) {
        console.log('  - access preview:', parsed.access.substring(0, 50) + '...');
        console.log('  - access JWT segments:', parsed.access.split('.').length);
      }
    } catch (e) {
      console.log('  - Parse error:', e);
    }
  } else {
    console.log('\n❌ auth_tokens is not set');
  }

  // Check session storage
  console.log('\n💾 SessionStorage:');
  console.log('- access_token exists:', !!sessionStorage.getItem('access_token'));
  console.log('- auth_tokens exists:', !!sessionStorage.getItem('auth_tokens'));

  // Check cookies (if accessible)
  console.log('\n🍪 Cookies:');
  console.log('- All cookies:', document.cookie || 'No cookies accessible');

  // Test API call
  console.log('\n🚀 Testing API call with current token...');
  testApiCall();
}

async function testApiCall() {
  // Try to get token using the same logic as fetchUserCredits
  let token = null;

  const authTokens = localStorage.getItem('auth_tokens');
  if (authTokens && authTokens !== 'null' && authTokens !== 'undefined') {
    try {
      const parsed = JSON.parse(authTokens);
      token = parsed.access_token || parsed.access;
    } catch (e) {
      console.error('Failed to parse auth_tokens:', e);
    }
  }

  if (!token) {
    token = localStorage.getItem('access_token');
  }

  if (!token || token === 'null' || token === 'undefined' || token === '') {
    console.error('❌ No valid token found for API test');
    return;
  }

  console.log('✅ Found token, making test API call...');

  try {
    const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';
    const response = await fetch(`${API_BASE}/api/v1/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('📡 API Response:');
    console.log('  - Status:', response.status);
    console.log('  - Status Text:', response.statusText);

    if (response.ok) {
      const data = await response.json();
      console.log('  - User:', data);
      console.log('  ✅ Token is valid!');
    } else {
      const errorText = await response.text();
      console.log('  - Error:', errorText);
      console.log('  ❌ Token is invalid or expired');
    }
  } catch (error) {
    console.error('  ❌ API call failed:', error);
  }
}

// Export for use in browser console
if (typeof window !== 'undefined') {
  (window as any).debugTokens = debugTokens;
  console.log('💡 Token debug utility loaded. Run debugTokens() in console to check token status.');
}

export default debugTokens;