# Azure AD Login Setup Guide for PortalOps

This guide explains how to configure Azure AD authentication for the PortalOps frontend application.

## Overview

The PortalOps frontend now supports both:
1. **Email/Password authentication** (existing functionality)
2. **Azure AD (Microsoft) authentication** (new feature)

## Architecture

The Azure login implementation uses:
- **NextAuth.js v4** - Authentication library for Next.js
- **Custom Azure OAuth Provider** - Custom configuration for Azure AD
- **JWT token validation** - Secure token management with expiration checks
- **Middleware protection** - Route-level authentication guards

## File Structure

```
frontend/
├── app/
│   ├── api/
│   │   └── auth/
│   │       └── [...nextauth]/
│   │           ├── route.ts                 # NextAuth API handler
│   │           ├── auth-option.ts           # NextAuth configuration
│   │           └── provider/
│   │               └── azure.ts             # Azure AD OAuth provider
│   ├── auth/
│   │   └── error/
│   │       └── page.tsx                     # Authentication error page
│   └── (auth)/
│       └── signin/
│           └── page.tsx                     # Updated sign-in page with Azure button
├── components/
│   └── auth/
│       └── AzureSignInButton.tsx           # Azure sign-in button component
├── middleware.ts                           # Updated with NextAuth JWT validation
└── env.example                             # Environment variables template
```

## Setup Instructions

### Step 1: Register Application in Azure AD

1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to **Azure Active Directory** > **App registrations**
3. Click **New registration**
4. Fill in the application details:
   - **Name**: PortalOps Frontend
   - **Supported account types**: Choose based on your requirements
     - Single tenant (recommended for enterprise apps)
     - Multi-tenant (if supporting multiple organizations)
   - **Redirect URI**: 
     - Platform: Web
     - URL: `http://localhost:3000/api/auth/callback/customazure` (development)
     - URL: `https://your-domain.com/api/auth/callback/customazure` (production)

5. Click **Register**

### Step 2: Configure Application Settings

1. After registration, note down:
   - **Application (client) ID** - This is your `AZURE_AD_CLIENT_ID`
   - **Directory (tenant) ID** - This is your `AZURE_AD_TENANT_ID`

2. Go to **Certificates & secrets**
   - Click **New client secret**
   - Add a description (e.g., "PortalOps Frontend Secret")
   - Choose expiration period
   - Click **Add**
   - **IMPORTANT**: Copy the secret **value** immediately - This is your `AZURE_AD_CLIENT_SECRET`
   - The secret value won't be shown again!

3. Go to **API permissions**
   - Ensure the following permissions are granted:
     - `openid` (default)
     - `profile` (default)
     - `email` (default)
     - `offline_access` (for refresh tokens)
   - Click **Grant admin consent** if required by your organization

4. Go to **Authentication**
   - Under **Implicit grant and hybrid flows**, enable:
     - ✅ ID tokens (used for implicit and hybrid flows)
   - Under **Advanced settings**:
     - Allow public client flows: No (recommended)

### Step 3: Configure Environment Variables

1. Copy `env.example` to `.env.local`:
   ```bash
   cp env.example .env.local
   ```

2. Edit `.env.local` and fill in your Azure AD values:
   ```env
   # NextAuth Configuration
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your-secret-key-here-generate-with-openssl-rand-base64-32
   
   # Azure AD Configuration
   AZURE_AD_CLIENT_ID=your-client-id-from-step-2
   AZURE_AD_CLIENT_SECRET=your-client-secret-from-step-2
   AZURE_AD_TENANT_ID=your-tenant-id-from-step-2
   
   # Backend API Configuration
   NEXT_PUBLIC_API_URL=http://localhost:8000
   ```

3. Generate a secure `NEXTAUTH_SECRET`:
   ```bash
   openssl rand -base64 32
   ```

### Step 4: Update Redirect URIs for Production

When deploying to production, add your production callback URL:

1. Go to Azure Portal > Your App Registration > Authentication
2. Add Redirect URI: `https://your-production-domain.com/api/auth/callback/customazure`
3. Update `NEXTAUTH_URL` in production environment variables

## User Flow

### Sign-In Process

1. User visits `/signin` page
2. User clicks "Sign in with Microsoft" button
3. User is redirected to Microsoft login page
4. User authenticates with Microsoft account
5. Microsoft redirects back to PortalOps with authentication tokens
6. NextAuth processes the callback and creates a session
7. User is redirected to the dashboard

### Token Management

- **Session Strategy**: JWT (JSON Web Tokens)
- **Session Duration**: 30 days
- **Token Validation**: Middleware checks token expiration on every request
- **Automatic Logout**: Expired or invalid tokens trigger automatic logout

## Security Features

### Middleware Protection

The `middleware.ts` file implements:
- ✅ JWT token validation
- ✅ Token expiration checks
- ✅ Automatic session cleanup for expired tokens
- ✅ Route protection for authenticated pages
- ✅ Redirect logic for authenticated/unauthenticated users

### OAuth Security

- ✅ PKCE (Proof Key for Code Exchange) enabled
- ✅ State parameter validation
- ✅ Nonce validation
- ✅ HTTPS required for production
- ✅ HttpOnly cookies for session tokens

## Troubleshooting

### Common Issues

#### 1. "Configuration" Error
- **Cause**: Missing or incorrect Azure AD configuration
- **Solution**: Verify `AZURE_AD_CLIENT_ID`, `AZURE_AD_CLIENT_SECRET`, and `AZURE_AD_TENANT_ID` in `.env.local`

#### 2. "AccessDenied" Error
- **Cause**: User doesn't have permission or app requires admin consent
- **Solution**: 
  - Check API permissions in Azure Portal
  - Request admin consent from your Azure AD administrator

#### 3. Redirect URI Mismatch
- **Cause**: Callback URL doesn't match registered redirect URI
- **Solution**: Ensure redirect URI in Azure Portal matches exactly: `http://localhost:3000/api/auth/callback/customazure`

#### 4. Token Expired Immediately
- **Cause**: System time mismatch or timezone issues
- **Solution**: Sync your server's system time

### Debug Mode

Enable debug logging by setting in `.env.local`:
```env
NODE_ENV=development
```

This will enable NextAuth debug logs in the console.

## Testing

### Local Testing

1. Start the development server:
   ```bash
   pnpm dev
   ```

2. Navigate to `http://localhost:3000/signin`
3. Click "Sign in with Microsoft"
4. Authenticate with your Microsoft account
5. Verify successful redirect to dashboard

### Testing with Different Accounts

- Test with different user roles in your Azure AD
- Verify proper permissions and access control
- Test token expiration by manipulating JWT

## Integration with Backend

The Azure login flow provides these tokens:
- **ID Token**: User identity information
- **Access Token**: Can be used for API authentication

To integrate with your backend:

1. Access tokens in API routes:
   ```typescript
   import { getServerSession } from "next-auth/next"
   import { authOptions } from "@/app/api/auth/[...nextauth]/auth-option"
   
   export async function GET(request: Request) {
     const session = await getServerSession(authOptions)
     const idToken = session?.tokens.id_token
     const accessToken = session?.tokens.access_token
     
     // Use tokens to authenticate with backend
   }
   ```

2. In client components:
   ```typescript
   import { useSession } from "next-auth/react"
   
   function MyComponent() {
     const { data: session } = useSession()
     const idToken = session?.tokens.id_token
     
     // Use token in API calls
   }
   ```

## Backwards Compatibility

The implementation maintains backwards compatibility with the existing email/password authentication:

- ✅ Email/password login still works
- ✅ Existing auth provider context preserved
- ✅ Legacy `auth_token` cookie support in middleware
- ✅ Both authentication methods can coexist

## Production Deployment

### Environment Variables

Ensure these variables are set in your production environment:

```env
NEXTAUTH_URL=https://your-production-domain.com
NEXTAUTH_SECRET=<secure-random-string>
AZURE_AD_CLIENT_ID=<your-client-id>
AZURE_AD_CLIENT_SECRET=<your-client-secret>
AZURE_AD_TENANT_ID=<your-tenant-id>
NEXT_PUBLIC_API_URL=https://api.your-domain.com
```

### Security Checklist

- [ ] Use HTTPS in production
- [ ] Rotate client secrets regularly
- [ ] Set appropriate session timeout
- [ ] Enable audit logging
- [ ] Monitor failed authentication attempts
- [ ] Implement rate limiting
- [ ] Review Azure AD conditional access policies

## References

- [NextAuth.js Documentation](https://next-auth.js.org/)
- [Azure AD OAuth 2.0 Documentation](https://docs.microsoft.com/en-us/azure/active-directory/develop/v2-oauth2-auth-code-flow)
- [Next.js Middleware Documentation](https://nextjs.org/docs/advanced-features/middleware)

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review NextAuth.js documentation
3. Check Azure AD application configuration
4. Review browser console for error messages
5. Check Next.js server logs

---

**Last Updated**: 2025-10-17

