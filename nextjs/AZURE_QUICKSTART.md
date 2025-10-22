# Azure AD Login - Quick Start Guide

Get Azure AD authentication up and running in 5 minutes!

## Prerequisites

- Azure AD administrator access
- Node.js and pnpm installed
- PortalOps backend running (optional for testing Azure login UI)

## Step 1: Register Azure AD Application (5 minutes)

1. Go to [Azure Portal](https://portal.azure.com) → **Azure Active Directory** → **App registrations**
2. Click **New registration**
   - Name: `PortalOps`
   - Redirect URI: `http://localhost:3000/api/auth/callback/customazure`
3. After creation, note down:
   - **Application (client) ID**
   - **Directory (tenant) ID**
4. Go to **Certificates & secrets** → **New client secret**
   - Copy the **secret value** immediately!
5. Go to **API permissions** → **Grant admin consent**

## Step 2: Configure Environment Variables (1 minute)

Create `.env.local` file in the `nextjs/` directory:

```bash
# Generate a secret first
NEXTAUTH_SECRET=$(openssl rand -base64 32)

# Add these values
NEXTAUTH_URL=http://localhost:3000
NEXT_PUBLIC_NEXTAUTH_URL=http://localhost:3000

# Replace with your Azure AD values
AZURE_AD_CLIENT_ID=your-client-id-here
AZURE_AD_CLIENT_SECRET=your-client-secret-here
AZURE_AD_TENANT_ID=your-tenant-id-here
```

## Step 3: Start the Application (1 minute)

```bash
cd nextjs
pnpm install  # If you haven't already
pnpm dev
```

## Step 4: Test Azure Login (1 minute)

1. Open browser: `http://localhost:3000/signin`
2. Click **"Sign in with Microsoft"** button
3. Login with your Azure AD credentials
4. Success! You're signed in 🎉

## What You Get

✅ **Microsoft Sign-In Button** - Professionally styled with Microsoft logo  
✅ **Seamless Authentication** - OAuth 2.0 / OpenID Connect  
✅ **Session Management** - Automatic token refresh  
✅ **Dual Authentication** - Azure AD + Email/Password both work  
✅ **User Profile** - Name and email from Azure AD  

## Troubleshooting

### "Application not found" error
→ Check `AZURE_AD_CLIENT_ID` matches the Application ID in Azure Portal

### "Invalid redirect URI" error
→ Ensure redirect URI is exactly: `http://localhost:3000/api/auth/callback/customazure`

### "Invalid client secret" error
→ Verify `AZURE_AD_CLIENT_SECRET` is correct (regenerate if needed)

### Button doesn't appear
→ Check that `NEXT_PUBLIC_NEXTAUTH_URL` is set

## Next Steps

- [ ] Read [AZURE_LOGIN_SETUP.md](./AZURE_LOGIN_SETUP.md) for complete configuration
- [ ] Add Azure AD users to Employee Directory for role assignment
- [ ] Configure production Azure AD application
- [ ] Implement backend user sync endpoint

## Production Deployment

When deploying to production:

1. **Update Redirect URI** in Azure AD:
   ```
   https://your-domain.com/api/auth/callback/customazure
   ```

2. **Update Environment Variables**:
   ```bash
   NEXTAUTH_URL=https://your-domain.com
   NEXT_PUBLIC_NEXTAUTH_URL=https://your-domain.com
   # Keep Azure AD credentials same (or create separate prod app)
   ```

3. **Generate New Secret** for production:
   ```bash
   openssl rand -base64 32
   ```

## Security Checklist

- [ ] Never commit `.env.local` to git
- [ ] Use separate Azure AD app for production
- [ ] Rotate client secrets before expiration
- [ ] Enable MFA for Azure AD users
- [ ] Monitor sign-in logs in Azure Portal

## Support

- Full documentation: [AZURE_LOGIN_SETUP.md](./AZURE_LOGIN_SETUP.md)
- NextAuth docs: https://next-auth.js.org/
- Azure AD docs: https://docs.microsoft.com/azure/active-directory/

---

**Implementation completed**: October 2025  
**Based on**: Dynamite frontend Azure authentication pattern

