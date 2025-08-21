# Credits System - Frontend Integration Guide

## What We Built

We've implemented a comprehensive credits-based monetization system for the Instagram analytics platform. This system controls access to premium features and tracks user consumption across the platform.

## Core Features Available

### 1. User Credit Wallets
- Every user gets a credit wallet with monthly allowances
- Wallets have current balance and monthly reset cycles  
- Support for different subscription packages with varying credit amounts
- Automatic wallet creation for new users

### 2. Credit-Gated Actions
- Premium Instagram analysis features now require credits
- Profile unlocking, detailed analytics, and AI insights are credit-protected
- Free monthly allowances for certain actions (configurable per action type)
- Graceful handling when users run out of credits

### 3. Transaction Tracking
- Complete history of all credit spending
- Detailed transaction records with timestamps and descriptions
- Monthly usage summaries and analytics
- Search and filtering capabilities for transaction history

### 4. Flexible Pricing System
- Configurable pricing rules for different platform actions
- Bulk pricing discounts for higher quantities
- Free allowances that reset monthly
- Dynamic pricing calculations based on usage

### 5. Ready for Payment Integration
- Infrastructure prepared for Stripe payment processing
- Credit purchase estimation endpoints
- Top-up history tracking (ready when payments are integrated)

## API Endpoints You Can Use

### Credit Balance & Wallet Management
```
GET /api/v1/api/credits/balance
GET /api/v1/api/credits/wallet/summary  
GET /api/v1/api/credits/dashboard
POST /api/v1/api/credits/wallet/create
```

### Transaction History & Analytics
```
GET /api/v1/api/credits/transactions
GET /api/v1/api/credits/transactions/search
GET /api/v1/api/credits/usage/monthly
GET /api/v1/api/credits/analytics/spending
```

### Action Permissions & Pricing
```
GET /api/v1/api/credits/can-perform/{action_type}
GET /api/v1/api/credits/pricing
GET /api/v1/api/credits/pricing/{action_type}
POST /api/v1/api/credits/pricing/calculate
```

### Allowances & System Info
```
GET /api/v1/api/credits/allowances
GET /api/v1/api/credits/system/stats
```

### Future Payment Integration
```
POST /api/v1/api/credits/top-up/estimate
GET /api/v1/api/credits/top-up/history
```

## Protected Instagram Features

These existing endpoints now require credits:

- **Profile Analysis** - `/api/v1/profile/{username}` (25 credits)
- **Detailed Analytics** - `/api/v1/profile/{username}/analytics` (15 credits) 
- **AI Insights** - `/api/v1/profile/{username}/ai-insights` (20 credits)
- **Profile Posts** - `/api/v1/profile/{username}/posts` (10 credits)

## How Credit Gates Work

1. **Before Access**: System checks if user has enough credits or free allowances
2. **Success Response**: Credits are deducted ONLY after successful data retrieval
3. **Error Handling**: If the request fails, no credits are charged
4. **Free Allowances**: Users get monthly free uses that reset automatically

## Error Responses You'll Handle

### Insufficient Credits (402 Payment Required)
```json
{
  "detail": "Insufficient credits. Required: 25, Available: 10. Need 15 more credits.",
  "headers": {
    "X-Credits-Required": "25",
    "X-Credits-Available": "10", 
    "X-Credits-Needed": "15"
  }
}
```

### Wallet Locked (402 Payment Required)
```json
{
  "detail": "Your credit wallet is locked. Please renew your subscription to continue."
}
```

### No Wallet Found (402 Payment Required)
```json
{
  "detail": "Credit wallet not found. Please contact support."
}
```

## Dashboard Data Structure

The credit dashboard endpoint provides everything needed for a comprehensive user interface:

```json
{
  "wallet": {
    "current_balance": 150,
    "monthly_allowance": 100,
    "package_name": "Professional",
    "billing_cycle_start": "2025-01-01",
    "wallet_status": "active"
  },
  "recent_transactions": [
    {
      "amount": 25,
      "action_type": "influencer_unlock",
      "created_at": "2025-01-21T10:30:00",
      "description": "Credits spent for influencer_unlock"
    }
  ],
  "monthly_usage": {
    "total_spent": 75,
    "actions_performed": 8,
    "top_actions": ["influencer_unlock", "detailed_analytics"],
    "free_allowances_used": 3
  },
  "pricing_rules": [
    {
      "action_type": "influencer_unlock", 
      "credits_per_action": 25,
      "free_allowance_per_month": 2
    }
  ],
  "unlocked_influencers_count": 12
}
```

## Monthly Usage Analytics

Track user behavior with detailed analytics:

```json
{
  "period": "2025-01",
  "total_credits_spent": 175,
  "total_actions": 15,
  "free_allowances_used": 5,
  "action_breakdown": {
    "influencer_unlock": {"count": 7, "credits": 175},
    "detailed_analytics": {"count": 5, "credits": 75}, 
    "ai_insights": {"count": 3, "credits": 60}
  },
  "daily_usage": [
    {"date": "2025-01-20", "credits": 25, "actions": 1}
  ]
}
```

## Free Allowances System

Users get monthly free allowances that automatically reset:

```json
{
  "influencer_unlock": {
    "monthly_allowance": 2,
    "used_this_month": 1,
    "remaining": 1,
    "next_reset": "2025-02-01"
  },
  "detailed_analytics": {
    "monthly_allowance": 5,
    "used_this_month": 3,
    "remaining": 2, 
    "next_reset": "2025-02-01"
  }
}
```

## User Experience Flow

1. **Check Permission**: Before showing premium features, check `/can-perform/{action_type}`
2. **Show Credit Cost**: Display required credits and available balance
3. **Handle Insufficient Credits**: Redirect to top-up page or show upgrade options
4. **Track Success**: After successful premium feature use, credits are automatically deducted
5. **Update Balance**: Refresh credit balance in UI after any credit-consuming action

## Implementation Notes

- All endpoints require user authentication
- Credit deduction happens automatically AFTER successful feature usage
- Free monthly allowances reset on the 1st of each month
- The system is designed to handle high-traffic concurrent operations
- All credit operations are atomic and transaction-safe
- Comprehensive audit trails are maintained for every credit operation

## Future Payment Integration

The system is ready for Stripe integration with:
- Credit purchase estimation
- Payment processing placeholders  
- Top-up history tracking
- Flexible pricing configuration

When payments are integrated, users will be able to purchase additional credits beyond their monthly allowances.

---

*This credits system provides a complete foundation for monetizing the Instagram analytics platform while maintaining excellent user experience and comprehensive tracking capabilities.*