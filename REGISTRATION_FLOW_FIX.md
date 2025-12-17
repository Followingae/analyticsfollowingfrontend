# Registration Flow Issues & Fixes

## 🔴 Current Issue
**Error**: "Payment system error: Expired API Key provided: sk_live_*****"

This error indicates the **backend** is using an expired Stripe API key.

## 📋 Analysis

### What's Actually Happening:
1. Frontend correctly calls `/api/v1/billing/v2/pre-registration-checkout` for paid plans
2. Backend receives the request successfully
3. Backend tries to create Stripe checkout session
4. **Stripe rejects the request due to expired API key**

## 🔧 Required Fixes

### Backend Fix (REQUIRED)
The backend needs to update their Stripe API keys:

```env
# For Testing (recommended first)
STRIPE_SECRET_KEY=sk_test_51Sf0ElAubhSg1bPI...
STRIPE_PUBLISHABLE_KEY=pk_test_51Sf0ElAubhSg1bPI...
STRIPE_WEBHOOK_SECRET=whsec_test_...

# For Production
STRIPE_SECRET_KEY=sk_live_[NEW_VALID_KEY]
STRIPE_PUBLISHABLE_KEY=pk_live_[NEW_VALID_KEY]
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Frontend Cleanup (Already Done)
1. ✅ Removed old checkout redirect for online payment users
2. ✅ Multi-step signup correctly uses:
   - `/api/v1/billing/v2/pre-registration-checkout` for paid plans
   - `/api/v1/billing/v2/free-tier-registration` for free tier
   - Standard registration for admin-managed

## 📊 Current Registration Flows

### 1. Paid Plans (Standard/Premium) with Online Payment
```javascript
// Frontend calls pre-registration checkout
POST /api/v1/billing/v2/pre-registration-checkout
{
  email, password, full_name, plan, company,
  success_url: "/welcome?session_id={CHECKOUT_SESSION_ID}",
  cancel_url: "/auth/register?payment=cancelled"
}
→ Redirects to Stripe
→ After payment → /welcome page
→ Polls for account creation
→ Dashboard
```

### 2. Free Tier
```javascript
// Direct registration
POST /api/v1/billing/v2/free-tier-registration
{
  email, password, full_name, company
}
→ Immediate account creation
→ Dashboard
```

### 3. Admin-Managed Billing
```javascript
// Standard registration with pending status
POST /api/v1/auth/register
{
  email, password, full_name,
  billing_type: 'admin_managed'
}
→ Account created (pending)
→ /pending-approval page
```

## 🧪 Testing Steps

### 1. Test Backend Stripe Integration
```bash
# Check if backend has valid Stripe keys
curl -X GET http://localhost:8000/api/v1/billing/products
# Should return product list if Stripe is configured
```

### 2. Test Registration Flow
1. Go to `/auth/register`
2. Select "Standard" plan
3. Choose "Online Payment"
4. Complete registration
5. Should redirect to Stripe (if backend keys are valid)

## 🚨 Common Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| "Expired API Key" | Backend using old/expired Stripe keys | Update backend Stripe keys |
| "404 Not Found" | Using old endpoint | Frontend already fixed to use v2 endpoints |
| "403 Forbidden" | No auth token after registration | Payment-first flow fixes this |
| "Network Error" | Backend not running | Start backend server |

## ✅ What's Already Fixed

1. **Frontend uses correct endpoints**:
   - ✅ `/api/v1/billing/v2/pre-registration-checkout` for paid plans
   - ✅ `/api/v1/billing/v2/free-tier-registration` for free tier
   - ✅ Polling mechanism in `/welcome` page

2. **Removed problematic flows**:
   - ✅ No longer redirects to `/checkout` after registration
   - ✅ No longer calls non-existent `/api/v1/billing/create-checkout-session`

3. **Payment-first approach**:
   - ✅ Paid plans go to Stripe BEFORE account creation
   - ✅ Prevents unpaid accounts

## 📝 Next Steps

1. **Backend team must**:
   - Update Stripe API keys in environment variables
   - Restart backend server
   - Test with Stripe test keys first

2. **Once backend is fixed**:
   - Test full registration flow
   - Verify Stripe checkout works
   - Confirm account creation after payment

## 🔍 Debug Information

If issues persist, check:

```javascript
// In browser console
localStorage.getItem('access_token')  // Should have token after registration
```

```bash
# Backend logs
tail -f backend.log | grep stripe  # Check for Stripe errors
```

The frontend is correctly configured. The backend just needs valid Stripe API keys.