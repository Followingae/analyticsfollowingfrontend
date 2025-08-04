/**
 * ProtectedRoute - Optimized Route Protection Component
 * 
 * Provides instant route protection using cached authentication state
 * Eliminates loading delays and unnecessary API calls during navigation
 * 
 * Features:
 * - Instant authentication checks (no API calls)
 * - Cached user state for immediate routing decisions
 * - Flexible redirect handling
 * - Loading state management
 * - Role-based access control
 */

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/**
 * Main ProtectedRoute Component
 * Uses cached auth state for instant routing decisions
 */
export function ProtectedRoute({ 
  children, 
  redirectTo = '/login',
  requiredRole = null,
  fallback = null,
  showLoadingSpinner = true 
}) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  // Show loading state during initial bootstrap only
  if (isLoading) {
    if (fallback) {
      return fallback;
    }
    
    if (showLoadingSpinner) {
      return (
        <div className="protected-route-loading">
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Checking authentication...</p>
          </div>
        </div>
      );
    }
    
    return null;
  }

  // Instant authentication check (cached data)
  if (!isAuthenticated) {
    console.log('🚫 ProtectedRoute: User not authenticated, redirecting to:', redirectTo);
    
    // Store attempted location for redirect after login
    return (
      <Navigate 
        to={redirectTo} 
        state={{ from: location.pathname }} 
        replace 
      />
    );
  }

  // Role-based access control (if required)
  if (requiredRole && user) {
    const userRole = user.role;
    const hasRequiredRole = checkUserRole(userRole, requiredRole);
    
    if (!hasRequiredRole) {
      console.log('🚫 ProtectedRoute: Insufficient permissions', { 
        userRole, 
        requiredRole 
      });
      
      return (
        <Navigate 
          to="/unauthorized" 
          state={{ requiredRole, userRole, from: location.pathname }} 
          replace 
        />
      );
    }
  }

  // User is authenticated and authorized - render protected content
  console.log('✅ ProtectedRoute: Access granted for', location.pathname);
  return children;
}

/**
 * Role-based access checking
 */
function checkUserRole(userRole, requiredRole) {
  if (!requiredRole) return true;
  
  // Define role hierarchy
  const roleHierarchy = {
    'admin': 3,
    'premium': 2, 
    'free': 1
  };
  
  const userLevel = roleHierarchy[userRole] || 0;
  const requiredLevel = roleHierarchy[requiredRole] || 0;
  
  return userLevel >= requiredLevel;
}

/**
 * HOC for protecting components with cached auth
 */
export function withAuthProtection(Component, options = {}) {
  const {
    redirectTo = '/login',
    requiredRole = null,
    displayName = 'ProtectedComponent'
  } = options;
  
  function ProtectedComponent(props) {
    return (
      <ProtectedRoute 
        redirectTo={redirectTo}
        requiredRole={requiredRole}
      >
        <Component {...props} />
      </ProtectedRoute>
    );
  }
  
  ProtectedComponent.displayName = displayName;
  return ProtectedComponent;
}

/**
 * Public Route - Redirects authenticated users away from auth pages
 */
export function PublicRoute({ 
  children, 
  redirectTo = '/dashboard',
  allowAuthenticated = false 
}) {
  const { isAuthenticated, isLoading } = useAuth();
  
  // Show loading during bootstrap
  if (isLoading) {
    return (
      <div className="public-route-loading">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }
  
  // Redirect authenticated users away from public pages (like login)
  if (isAuthenticated && !allowAuthenticated) {
    console.log('🔄 PublicRoute: Authenticated user accessing public route, redirecting to:', redirectTo);
    return <Navigate to={redirectTo} replace />;
  }
  
  return children;
}

/**
 * Conditional Route - Shows different content based on auth status
 */
export function ConditionalRoute({ 
  authenticatedComponent: AuthenticatedComponent,
  unauthenticatedComponent: UnauthenticatedComponent,
  loadingComponent: LoadingComponent = null
}) {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    if (LoadingComponent) {
      return <LoadingComponent />;
    }
    
    return (
      <div className="conditional-route-loading">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }
  
  return isAuthenticated ? <AuthenticatedComponent /> : <UnauthenticatedComponent />;
}

/**
 * Role Gate - Shows content only for specific roles
 */
export function RoleGate({ 
  children, 
  requiredRole, 
  fallback = null,
  showUnauthorized = true 
}) {
  const { user, isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return fallback || (
      <div className="role-gate-loading">
        <div className="loading-spinner">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return fallback || (showUnauthorized ? (
      <div className="role-gate-unauthorized">
        <p>Please log in to access this content.</p>
      </div>
    ) : null);
  }
  
  const hasRequiredRole = checkUserRole(user?.role, requiredRole);
  
  if (!hasRequiredRole) {
    return fallback || (showUnauthorized ? (
      <div className="role-gate-insufficient">
        <p>You don't have permission to access this content.</p>
        <p>Required role: {requiredRole}, Your role: {user?.role}</p>
      </div>
    ) : null);
  }
  
  return children;
}

/**
 * Auth Boundary - Error boundary for auth-related errors
 */
export class AuthBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  
  static getDerivedStateFromError(error) {
    // Check if error is auth-related
    const isAuthError = error.message?.includes('Authentication') || 
                       error.message?.includes('Unauthorized') ||
                       error.name === 'AuthenticationError';
    
    if (isAuthError) {
      return { hasError: true, error };
    }
    
    // Let other errors bubble up
    throw error;
  }
  
  componentDidCatch(error, errorInfo) {
    console.error('🚨 AuthBoundary: Caught authentication error:', error, errorInfo);
    
    // Optional: Send error to monitoring service
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }
  
  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      return (
        <div className="auth-boundary-error">
          <h2>Authentication Error</h2>
          <p>There was a problem with authentication. Please try logging in again.</p>
          <button onClick={() => window.location.href = '/login'}>
            Go to Login
          </button>
        </div>
      );
    }
    
    return this.props.children;
  }
}

/**
 * CSS for loading spinners (can be moved to separate CSS file)
 */
const styles = `
.protected-route-loading,
.public-route-loading,
.conditional-route-loading,
.role-gate-loading {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
  flex-direction: column;
}

.loading-spinner {
  text-align: center;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.role-gate-unauthorized,
.role-gate-insufficient,
.auth-boundary-error {
  padding: 20px;
  text-align: center;
  border: 1px solid #ddd;
  border-radius: 8px;
  margin: 20px;
  background-color: #f9f9f9;
}

.auth-boundary-error button {
  margin-top: 15px;
  padding: 10px 20px;
  background-color: #3498db;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.auth-boundary-error button:hover {
  background-color: #2980b9;
}
`;

// Inject styles (or move to separate CSS file)
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}

export default ProtectedRoute;