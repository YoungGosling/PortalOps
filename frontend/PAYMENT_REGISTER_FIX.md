# Payment Register "Failed to fetch" Error - Fix Summary

## Problem
The Payment Register page was showing a "Failed to fetch" error when trying to load data from the backend API.

## Root Causes

### 1. DNS Resolution Issue
The main issue was that `localhost` was not resolving properly on this system, causing "Relay failed to localhost:8000" errors. The backend was listening on `0.0.0.0:8000` but the frontend was trying to connect via `localhost`.

### 2. Missing API Method
The `uploadBillAttachment` method was being called in the PaymentRegister component but didn't exist in the API client.

### 3. Type Definition Mismatch
The type definition used `billAttachmentPath` but the component expected `billAttachment`.

## Changes Made

### 1. Updated Environment Configuration
**File: `/frontend/.env`**
```diff
- NEXT_PUBLIC_API_URL=http://localhost:8000/api
+ NEXT_PUBLIC_API_URL=http://127.0.0.1:8000/api
```

**File: `/frontend/env.example`**
```diff
- NEXT_PUBLIC_API_URL=http://localhost:8000
+ NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
```

### 2. Updated API Client Fallback URLs
**File: `/frontend/lib/api.ts`**
- Changed all `localhost:8000` references to `127.0.0.1:8000`
- Added missing `uploadBillAttachment` method to `paymentApi`

```typescript
// Upload bill attachment separately
uploadBillAttachment: async (productId: string, file: File) => {
  const formData = new FormData()
  formData.append('billAttachment', file)
  
  const token = apiClient.getToken()
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api'}/payment-register/${productId}/attachment`, {
    method: 'POST',
    headers: {
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    },
    body: formData
  })
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Failed to upload bill attachment' }))
    throw new Error(errorData.message || 'Failed to upload bill attachment')
  }
  
  return response.json()
}
```

### 3. Updated Type Definition
**File: `/frontend/types/index.ts`**
```typescript
export interface PaymentRegisterItem {
  // ... other fields ...
  billAttachment?: string // File upload path, mandatory (also accepts billAttachmentPath from backend)
  billAttachmentPath?: string // Alias for backward compatibility
  // ... other fields ...
}
```

## Required Action

**⚠️ IMPORTANT: Restart the Frontend Development Server**

The frontend needs to be restarted to pick up the new `NEXT_PUBLIC_API_URL` environment variable:

```bash
# Stop the current dev server (Ctrl+C in the terminal)
# Then restart:
cd /home/evanzhang/EnterpriseProjects/PortalOps/frontend
pnpm dev
```

## Verification

After restarting the frontend:

1. Navigate to the Payment Register page
2. The page should now load without the "Failed to fetch" error
3. You should see payment register data (if any exists) or an empty state

## Backend API Verification

The backend API is working correctly:
```bash
$ curl -X GET "http://127.0.0.1:8000/api/payment-register" -H "Accept: application/json"
# Response: {"error":"http_error","message":"Not authenticated"}
# (This is expected - it means the API is responding correctly and requires authentication)
```

## Technical Details

### Why localhost Failed
The error "Relay failed to localhost:8000" indicates that the system's DNS resolver or network configuration couldn't resolve `localhost` to `127.0.0.1`. Using the IP address directly bypasses this issue.

### API Endpoint Structure
- Backend listens on: `0.0.0.0:8000`
- API prefix: `/api`
- Payment Register endpoint: `/api/payment-register`
- Full URL: `http://127.0.0.1:8000/api/payment-register`

### CORS Configuration
The backend has CORS enabled for all origins:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## Related Files
- `/frontend/lib/api.ts` - API client configuration
- `/frontend/types/index.ts` - Type definitions
- `/frontend/components/payment/PaymentRegister.tsx` - Payment Register component
- `/frontend/.env` - Environment variables
- `/server/app/api/api_v1/endpoints/payment_register.py` - Backend endpoint

## Future Considerations

1. **Production Configuration**: In production, use proper domain names instead of IP addresses
2. **CORS Security**: Restrict CORS origins in production to specific domains
3. **Environment Variables**: Consider using different API URLs for development, staging, and production
4. **Error Handling**: Add better error messages for network issues to help diagnose similar problems

## Date
October 18, 2025

