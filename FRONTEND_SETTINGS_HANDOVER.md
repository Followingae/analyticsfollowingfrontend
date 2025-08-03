# 🎯 FRONTEND SETTINGS API INTEGRATION GUIDE

## Overview
Complete backend implementation for user settings functionality is now ready. All API endpoints match the settings screens shown in the frontend mockups.

## 🔗 API Base URL
```
Production: https://your-api-domain.com/api/v1/settings
Development: http://localhost:8000/api/v1/settings
```

---

## 📋 SETTINGS TABS IMPLEMENTATION

### 1. **PROFILE TAB** - Personal Information

#### **GET Current Profile** 
```http
GET /api/v1/settings/profile
Authorization: Bearer {jwt_token}
```

**Response:**
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "email": "user@example.com",
  "first_name": "John",
  "last_name": "Doe", 
  "full_name": "John Doe",
  "company": "Acme Corp",
  "job_title": "Marketing Manager",
  "phone_number": "+1 (555) 123-4567",
  "bio": "Marketing manager focused on influencer partnerships and brand growth.",
  "profile_picture_url": "/uploads/avatars/avatar_123_abc123.jpg",
  "timezone": "UTC",
  "language": "en",
  "updated_at": "2025-07-31T12:00:00Z",
  "message": "Profile updated successfully"
}
```

#### **UPDATE Profile Information**
```http
PUT /api/v1/settings/profile
Authorization: Bearer {jwt_token}
Content-Type: application/json
```

**Request Body (all fields optional):**
```json
{
  "first_name": "John",
  "last_name": "Doe",
  "company": "Acme Corp", 
  "job_title": "Marketing Manager",
  "phone_number": "+1 (555) 123-4567",
  "bio": "Marketing manager focused on influencer partnerships and brand growth.",
  "timezone": "America/New_York",
  "language": "en"
}
```

**Response:** Same as GET profile response

#### **UPLOAD Avatar**
```http
POST /api/v1/settings/profile/avatar
Authorization: Bearer {jwt_token}
Content-Type: multipart/form-data
```

**Request Body:**
```
file: <image file> (JPG, PNG, GIF, max 2MB)
```

**Response:**
```json
{
  "profile_picture_url": "/uploads/avatars/avatar_123_abc123.jpg",
  "message": "Avatar uploaded successfully"
}
```

---

### 2. **SECURITY TAB** - Password & Privacy

#### **CHANGE Password**
```http
POST /api/v1/settings/security/password
Authorization: Bearer {jwt_token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "current_password": "currentpass123",
  "new_password": "NewSecurePass123!",
  "confirm_password": "NewSecurePass123!"
}
```

**Response:**
```json
{
  "message": "Password updated successfully",
  "timestamp": "2025-07-31T12:00:00Z",
  "requires_reauth": true
}
```

**Password Requirements:**
- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 lowercase letter  
- At least 1 number

#### **TOGGLE Two-Factor Authentication**
```http
POST /api/v1/settings/security/2fa
Authorization: Bearer {jwt_token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "enable": true,
  "password": "currentpassword123"
}
```

**Response (when enabling):**
```json
{
  "two_factor_enabled": true,
  "message": "Two-factor authentication enabled successfully",
  "qr_code_url": "https://chart.googleapis.com/chart?chs=200x200&...",
  "backup_codes": ["12345678", "87654321", "11223344", "44332211", "56789012"]
}
```

**Response (when disabling):**
```json
{
  "two_factor_enabled": false,
  "message": "Two-factor authentication disabled successfully"
}
```

#### **UPDATE Privacy Settings**
```http
PUT /api/v1/settings/security/privacy
Authorization: Bearer {jwt_token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "profile_visibility": true,
  "data_analytics_enabled": false
}
```

**Response:**
```json
{
  "profile_visibility": true,
  "data_analytics_enabled": false,
  "message": "Privacy settings updated successfully"
}
```

---

### 3. **NOTIFICATIONS TAB** - Notification Preferences

#### **GET Notification Preferences**
```http
GET /api/v1/settings/notifications
Authorization: Bearer {jwt_token}
```

**Response:**
```json
{
  "email_notifications": true,
  "push_notifications": true,
  "marketing_emails": false,
  "security_alerts": true,
  "weekly_reports": true,
  "message": "Notification preferences updated successfully"
}
```

#### **UPDATE Notification Preferences**
```http
PUT /api/v1/settings/notifications  
Authorization: Bearer {jwt_token}
Content-Type: application/json
```

**Request Body (all fields optional):**
```json
{
  "email_notifications": true,
  "push_notifications": false,
  "marketing_emails": false,
  "security_alerts": true,
  "weekly_reports": true
}
```

**Response:** Same as GET response

---

### 4. **PREFERENCES TAB** - App Settings

#### **GET User Preferences**
```http
GET /api/v1/settings/preferences
Authorization: Bearer {jwt_token}
```

**Response:**
```json
{
  "timezone": "America/New_York",
  "language": "en",
  "preferences": {
    "theme": "dark",
    "dashboard_layout": "grid",
    "default_analysis_type": "comprehensive"
  },
  "message": "Preferences updated successfully"
}
```

#### **UPDATE User Preferences** 
```http
PUT /api/v1/settings/preferences
Authorization: Bearer {jwt_token}
Content-Type: application/json
```

**Request Body (all fields optional):**
```json
{
  "timezone": "America/New_York",
  "language": "en", 
  "theme": "dark",
  "dashboard_layout": "grid",
  "default_analysis_type": "comprehensive"
}
```

**Response:** Same as GET response

---

### 5. **COMPLETE SETTINGS OVERVIEW**

#### **GET All Settings (Page Load)**
```http
GET /api/v1/settings/overview
Authorization: Bearer {jwt_token}
```

**Response (Complete settings data):**
```json
{
  "profile": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "company": "Acme Corp",
    "job_title": "Marketing Manager",
    "phone_number": "+1 (555) 123-4567",
    "bio": "Marketing manager...",
    "profile_picture_url": "/uploads/avatars/avatar_123.jpg",
    "timezone": "UTC",
    "language": "en"
  },
  "security": {
    "two_factor_enabled": false,
    "email_verified": true,
    "phone_verified": false
  },
  "notifications": {
    "email_notifications": true,
    "push_notifications": true,
    "marketing_emails": false,
    "security_alerts": true,
    "weekly_reports": true
  },
  "privacy": {
    "profile_visibility": true,
    "data_analytics_enabled": true
  },
  "preferences": {
    "timezone": "UTC",
    "language": "en",
    "preferences": {
      "theme": "light",
      "dashboard_layout": "list"
    }
  }
}
```

---

## 🎨 FRONTEND IMPLEMENTATION NOTES

### **Settings Page Structure**
```javascript
// Use this endpoint for initial page load
const loadSettingsPage = async () => {
  const response = await fetch('/api/v1/settings/overview', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const settings = await response.json();
  
  // Populate all tabs with data
  populateProfileTab(settings.profile);
  populateSecurityTab(settings.security, settings.privacy);
  populateNotificationsTab(settings.notifications);
  populatePreferencesTab(settings.preferences);
};
```

### **Form Handling**
```javascript
// Profile form submission
const updateProfile = async (formData) => {
  const response = await fetch('/api/v1/settings/profile', {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(formData)
  });
  
  if (response.ok) {
    showSuccessMessage('Profile updated successfully');
  }
};

// Avatar upload
const uploadAvatar = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fetch('/api/v1/settings/profile/avatar', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: formData 
  });
  
  const result = await response.json();
  updateAvatarDisplay(result.profile_picture_url);
};
```

### **Error Handling**
```javascript
const handleApiError = (response) => {
  if (response.status === 400) {
    // Validation errors - show field-specific messages
  } else if (response.status === 401) {
    // Unauthorized - redirect to login
    redirectToLogin();
  } else if (response.status === 500) {
    // Server error - show generic error message
    showErrorMessage('Something went wrong. Please try again.');
  }
};
```

### **Tab Management**
- **Profile Tab**: Auto-save on blur, validate phone number format
- **Security Tab**: Confirm password changes, show 2FA QR code modal
- **Notifications Tab**: Toggle switches with immediate save
- **Preferences Tab**: Dropdown menus for timezone/language

---

## ⚡ QUICK INTEGRATION CHECKLIST

### **Required Frontend Changes:**

1. **Settings Page Initialization**
   - [ ] Call `/api/v1/settings/overview` on page load
   - [ ] Populate all form fields with existing data
   - [ ] Handle loading states

2. **Profile Tab**
   - [ ] First Name + Last Name input fields
   - [ ] Company, Job Title, Phone, Bio fields
   - [ ] Avatar upload with file validation (2MB, image types)
   - [ ] Save Changes button with API call

3. **Security Tab**  
   - [ ] Current/New/Confirm Password form
   - [ ] 2FA toggle switch with password confirmation
   - [ ] Privacy settings toggles (Profile Visibility, Data Analytics)

4. **Notifications Tab**
   - [ ] Toggle switches for each notification type
   - [ ] Auto-save on toggle change

5. **Preferences Tab**
   - [ ] Timezone dropdown
   - [ ] Language selection
   - [ ] Theme toggle (if implemented)

6. **Error Handling**
   - [ ] Form validation messages
   - [ ] API error handling
   - [ ] Success confirmations

---

## 🔒 AUTHENTICATION REQUIREMENTS

**All endpoints require JWT authentication:**
```http
Authorization: Bearer {jwt_token}
```

**After password change:**
- User will receive `requires_reauth: true`
- Frontend should prompt for re-login
- Clear local JWT tokens

---

## 🚀 DEPLOYMENT NOTES

1. **Database Migration**: Run `004_user_settings_fields.sql` before deployment
2. **File Upload**: Ensure `/uploads/avatars/` directory exists and is writable
3. **Static Files**: Configure web server to serve `/uploads/` directory
4. **CORS**: Settings endpoints are included in CORS configuration

---

## 📞 BACKEND CONTACT

If you need any endpoint modifications or have questions about the implementation, please let me know. All endpoints are fully tested and production-ready.

**Backend Status**: ✅ Complete and Ready for Integration
**API Documentation**: Available at `/docs` endpoint
**Database**: Migration ready - run `004_user_settings_fields.sql`