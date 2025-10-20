# Azure AD Login Setup Guide

This document provides step-by-step instructions for setting up Azure AD authentication in PortalOps.

## Overview

The PortalOps application now supports two authentication methods:
1. **Email/Password Authentication** - Traditional username/password login using the PortalOps backend API
2. **Azure AD Authentication** - Single Sign-On (SSO) using Microsoft Azure Active Directory

## Architecture

The Azure AD integration is built using:
- **NextAuth.js** - Authentication library for Next.js applications
- **OAuth 2.0** - Industry-standard protocol for authorization
- **OpenID Connect** - Identity layer on top of OAuth 2.0

## Prerequisites

Before setting up Azure AD authentication, you need:
1. An Azure Active Directory tenant
2. Administrator access to register applications in Azure AD
3. Access to configure environment variables in your deployment

## Azure AD Configuration

### Step 1: Register a New Application

1. Navigate to the [Azure Portal](https://portal.azure.com)
2. Go to **Azure Active Directory** > **App registrations**
3. Click **New registration**
4. Configure the application:
   - **Name**: `PortalOps` (or your preferred name)
   - **Supported account types**: Select based on your requirements
     - Single tenant: Only your organization
     - Multi-tenant: Any Azure AD directory
   - **Redirect URI**: 
     - Platform: Web
     - URI: `http://localhost:3000/api/auth/callback/customazure` (for development)
     - For production: `https://your-domain.com/api/auth/callback/customazure`

### Step 2: Configure Authentication

1. After registration, go to **Authentication** in the left menu
2. Under **Implicit grant and hybrid flows**, enable:
   - ✅ ID tokens (used for implicit and hybrid flows)
3. Under **Advanced settings**:
   - Allow public client flows: **No**
4. Click **Save**

### Step 3: Create Client Secret

1. Go to **Certificates & secrets** in the left menu
2. Click **New client secret**
3. Add a description (e.g., "PortalOps Production")
4. Select an expiration period
5. Click **Add**
6. **Important**: Copy the secret value immediately - it won't be shown again!

### Step 4: Configure API Permissions

1. Go to **API permissions** in the left menu
2. Ensure the following permissions are present:
   - `openid` (OpenID Connect)
   - `profile` (View users' basic profile)
   - `email` (View users' email address)
   - `offline_access` (Maintain access to data)
3. If not present, click **Add a permission** > **Microsoft Graph** > **Delegated permissions**
4. Click **Grant admin consent** for your organization

### Step 5: Collect Required Information

From the Azure Portal, collect the following values:

1. **Application (client) ID**: Found on the Overview page
2. **Directory (tenant) ID**: Found on the Overview page
3. **Client Secret**: The value you copied in Step 3

## Environment Variables Configuration

Add the following environment variables to your deployment:

### For Development (.env.local)

```bash
# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret-here

# Azure AD Configuration
AZURE_AD_CLIENT_ID=your-application-client-id
AZURE_AD_CLIENT_SECRET=your-client-secret-value
AZURE_AD_TENANT_ID=your-directory-tenant-id

# Public Environment Variables (accessible in browser)
NEXT_PUBLIC_NEXTAUTH_URL=http://localhost:3000
```

### For Production (.env.production)

```bash
# NextAuth Configuration
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=your-production-nextauth-secret

# Azure AD Configuration
AZURE_AD_CLIENT_ID=your-application-client-id
AZURE_AD_CLIENT_SECRET=your-client-secret-value
AZURE_AD_TENANT_ID=your-directory-tenant-id

# Public Environment Variables
NEXT_PUBLIC_NEXTAUTH_URL=https://your-domain.com
```

### Generating NEXTAUTH_SECRET

You can generate a secure secret using:

```bash
# Using OpenSSL
openssl rand -base64 32

# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

## File Structure

The Azure AD authentication implementation consists of:

```
nextjs/
├── app/
│   ├── api/
│   │   └── auth/
│   │       └── [...nextauth]/
│   │           ├── route.ts              # NextAuth API route
│   │           ├── auth-options.ts       # NextAuth configuration
│   │           └── providers/
│   │               └── azure.ts          # Azure AD provider config
│   └── (auth)/
│       └── signin/
│           └── page.tsx                  # Updated sign-in page
├── components/
│   └── auth/
│       └── azure-signin-button.tsx       # Azure sign-in button component
└── providers/
    └── auth-provider.tsx                 # Updated auth provider (supports both auth methods)
```

## Usage

### Sign In with Azure AD

1. Navigate to the sign-in page
2. Click the **"Sign in with Microsoft"** button
3. You'll be redirected to Microsoft's login page
4. Enter your Azure AD credentials
5. Grant consent if prompted (first-time only)
6. You'll be redirected back to PortalOps and automatically signed in

### Sign Out

The logout functionality works for both authentication methods:
- Click your profile menu in the top-right corner
- Select "Logout"

## User Flow

### First-Time Azure AD Users

When a user signs in with Azure AD for the first time:
1. NextAuth authenticates with Azure AD
2. User profile information (name, email) is retrieved
3. A session is created in NextAuth
4. The user is granted default "User" role
5. **Note**: To assign roles and services, an admin must add the user in the User Directory

### Returning Users

For returning Azure AD users:
1. NextAuth validates the existing session
2. User information is loaded from the session
3. User accesses the application with their assigned roles and services

## Integration with PortalOps Backend

### Current Implementation

The current implementation creates a user session based on Azure AD profile:
- Email from Azure AD
- Name from Azure AD
- Default "User" role

### Recommended Backend Enhancement

To fully integrate Azure AD users with your backend, consider:

1. **Create a backend endpoint** to sync Azure AD users:
   ```
   POST /api/users/sync-azure
   Body: { email, name, azureId }
   ```

2. **Update auth-options.ts** to call this endpoint in the JWT callback:
   ```typescript
   // In the jwt callback
   const response = await fetch(`${API_URL}/api/users/sync-azure`, {
     method: 'POST',
     headers: {
       'Content-Type': 'application/json',
       'Authorization': `Bearer ${token.idToken}`
     },
     body: JSON.stringify({
       email: token.email,
       name: user.name,
       azureId: user.id
     })
   });
   ```

3. **Backend logic** should:
   - Check if user exists by email or azureId
   - Create user if not exists (with default role)
   - Return user's roles and assignedServiceIds
   - Cache this in the JWT token

## Security Considerations

1. **Never commit secrets** - Use environment variables, never hardcode credentials
2. **Use HTTPS in production** - Required for OAuth 2.0
3. **Rotate client secrets** - Set reminders to rotate before expiration
4. **Validate redirect URIs** - Ensure only authorized URIs are configured in Azure AD
5. **Monitor sign-ins** - Use Azure AD sign-in logs to monitor authentication activity
6. **Implement RBAC** - Use roles to control access to features and data

## Troubleshooting

### Common Issues

**Issue**: "Invalid redirect URI" error
- **Solution**: Verify the redirect URI in Azure AD matches exactly: `{NEXTAUTH_URL}/api/auth/callback/customazure`

**Issue**: "AADSTS700016: Application with identifier 'X' was not found"
- **Solution**: Check that AZURE_AD_CLIENT_ID matches the Application ID in Azure AD

**Issue**: "Invalid client secret" error
- **Solution**: Verify AZURE_AD_CLIENT_SECRET is correct. If expired, generate a new one.

**Issue**: Session not persisting
- **Solution**: Check that NEXTAUTH_SECRET is set and consistent across deployments

**Issue**: Users can't access protected pages after Azure AD login
- **Solution**: Ensure the user is added to the User Directory with appropriate roles

### Debug Mode

To enable debug logging, set in your environment:
```bash
NODE_ENV=development
```

NextAuth will output detailed logs to the console.

## Testing

### Local Testing

1. Start the development server:
   ```bash
   cd nextjs
   pnpm dev
   ```

2. Navigate to `http://localhost:3000/signin`
3. Click "Sign in with Microsoft"
4. Test with an Azure AD account

### Production Testing

Before deploying to production:
1. ✅ Update redirect URI in Azure AD to production URL
2. ✅ Set production environment variables
3. ✅ Test with multiple user accounts
4. ✅ Verify role-based access control
5. ✅ Test logout functionality
6. ✅ Verify session persistence across page refreshes

## Additional Resources

- [NextAuth.js Documentation](https://next-auth.js.org/)
- [Azure AD OAuth 2.0 Documentation](https://docs.microsoft.com/en-us/azure/active-directory/develop/v2-oauth2-auth-code-flow)
- [Microsoft Identity Platform](https://docs.microsoft.com/en-us/azure/active-directory/develop/)

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review NextAuth.js documentation
3. Check Azure AD application logs in the Azure Portal
4. Contact your system administrator

---

**Last Updated**: October 2025  
**Version**: 2.0.0

