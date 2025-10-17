# PortalOps Frontend - Next.js 15

Enterprise service and product management platform built with Next.js 15, TypeScript, and Tailwind CSS.

## 🚀 Tech Stack

- **Framework**: Next.js 15.5.6 (App Router)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4
- **UI Components**: Radix UI + shadcn/ui
- **Theme**: next-themes (light/dark/system)
- **Icons**: Lucide React
- **Notifications**: Sonner
- **State Management**: React Context API
- **Date Handling**: Day.js

## 📁 Project Structure

```
frontend/
├── app/
│   ├── (auth)/              # Public auth pages
│   │   └── signin/
│   ├── (internal)/          # Protected user pages
│   │   ├── layout.tsx       # Main app layout
│   │   ├── dashboard/
│   │   ├── inbox/
│   │   ├── services/
│   │   ├── products/
│   │   ├── users/
│   │   └── payment-register/
│   ├── (admin)/             # Admin-only pages
│   │   ├── layout.tsx
│   │   └── admin/
│   ├── layout.tsx           # Root layout
│   └── globals.css
├── components/
│   ├── ui/                  # shadcn/ui components
│   ├── auth/                # Authentication components
│   └── layout/              # Layout components (Header, Sidebar)
├── providers/               # React context providers
│   ├── auth-provider.tsx
│   ├── theme-provider.tsx
│   └── payment-summary-provider.tsx
├── lib/                     # Utility functions
│   ├── utils.ts
│   ├── api.ts
│   └── billingUtils.ts
├── hooks/                   # Custom React hooks
├── types/                   # TypeScript type definitions
└── middleware.ts            # Route protection

```

## 🏁 Getting Started

### Prerequisites

- Node.js 20+ (recommended)
- pnpm (or npm/yarn)

### Installation

```bash
# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your configuration
```

### Environment Variables

Create a `.env.local` file (see `env.example` for template):

```env
# NextAuth Configuration (for Azure AD login)
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-generate-with-openssl

# Azure AD Configuration (optional - for Azure login)
AZURE_AD_CLIENT_ID=your-azure-ad-client-id
AZURE_AD_CLIENT_SECRET=your-azure-ad-client-secret
AZURE_AD_TENANT_ID=your-azure-ad-tenant-id

# Backend API
NEXT_PUBLIC_API_URL=http://localhost:8000
```

> 💡 **Note**: Azure AD configuration is optional. The app works with email/password login without it.

### Development

```bash
# Start development server
pnpm dev

# Access the application
# http://localhost:3000
```

### Build & Production

```bash
# Build for production
pnpm build

# Start production server
pnpm start

# Run linter
pnpm lint
```

## 🔐 Authentication

The application supports **multiple authentication methods**:

### 🔷 Azure AD (Microsoft) Login
- **Enterprise Single Sign-On** via Azure Active Directory
- **OAuth 2.0** with PKCE security
- **Automatic user provisioning** from Azure AD
- **30-day session duration**

📘 **Setup Guide**: See [AZURE_LOGIN_SETUP.md](./AZURE_LOGIN_SETUP.md)  
⚡ **Quick Start**: See [AZURE_QUICK_START.md](./AZURE_QUICK_START.md)

### 📧 Email/Password Login
- **Traditional authentication** with email and password
- **JWT token-based** sessions
- **Backward compatible** with existing system

### Key Features

- **Role-based Access Control** (Admin, ServiceAdministrator, ProductAdministrator, User)
- **Route Protection** via Next.js middleware with JWT validation
- **Automatic Token Expiration** handling
- **Dual Authentication Support** - Both methods work seamlessly together

### Demo Credentials (Email/Password)

```
Email: admin@portalops.com
Password: password
```

## 🎨 Design System

### Theme

The application supports three theme modes:
- Light
- Dark  
- System (automatically follows OS preference)

Theme can be changed from the user dropdown menu in the header.

### Color Palette

```css
/* Primary Brand Color */
--primary: HSL(221, 83%, 53%)  /* Professional Blue */

/* Status Colors */
--destructive: HSL(0, 84%, 60%)     /* Red - Errors */
--success: HSL(142, 76%, 36%)       /* Green - Success */
--warning: HSL(48, 96%, 53%)        /* Yellow - Warnings */

/* UI Colors */
--background: White / HSL(222.2, 84%, 4.9%)  /* Light/Dark */
--foreground: HSL(222.2, 84%, 4.9%) / White
--accent: HSL(210, 40%, 96.1%)      /* Hover states */
--muted: HSL(215.4, 16.3%, 46.9%)   /* Secondary text */
```

### Components

All UI components are built with:
- **Radix UI** primitives for accessibility
- **Tailwind CSS** for styling
- **Class Variance Authority** for component variants

Available components:
- Button, Card, Input, Label, Tabs
- Dropdown Menu, Avatar, Badge
- Dialog, Select, Tooltip
- Separator, Collapsible, Scroll Area

## 📱 Features

### User Interface

- **Responsive Design**: Mobile-first approach
- **Dark Mode**: Full support with smooth transitions
- **Collapsible Sidebar**: Save screen space
- **Role-based Navigation**: Menu items based on user permissions
- **Toast Notifications**: Using Sonner for user feedback

### Authentication & Authorization

- **Sign In / Sign Up**: Tabbed authentication interface
- **Session Management**: Persistent authentication with cookies
- **Route Protection**: Middleware-based authentication
- **Role-based Access**: Different views for different user roles

### Pages

#### User Pages
- **Dashboard**: Overview and quick access
- **Inbox**: Messages and notifications
- **Service Inventory**: Service management (Admin, ServiceAdmin)
- **Product Inventory**: Product management (Admin, ServiceAdmin)
- **User Directory**: User management (Admin, ServiceAdmin, ProductAdmin)
- **Payment Register**: Payment tracking (Admin only)

#### Admin Pages
- **System Dashboard**: System-wide statistics
- **Security & Compliance**: Security settings
- **Permission Management**: User permission management
- **Master Files**: File management
- **System Configuration**: System settings

## 🛠️ Development Guidelines

### Adding New Pages

```typescript
// app/(internal)/new-page/page.tsx
export default function NewPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Page Title</h1>
      {/* Your content */}
    </div>
  )
}
```

### Adding New Components

```bash
# Use shadcn/ui CLI to add components
npx shadcn@latest add [component-name]
```

### Code Style

- Use TypeScript for all new files
- Follow the existing component structure
- Use Tailwind CSS utilities for styling
- Mark client components with `'use client'`
- Use Server Components by default

## 🔒 Route Protection

Routes are protected using Next.js middleware:

```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value
  
  if (isProtectedRoute && !token) {
    return NextResponse.redirect('/signin')
  }
  
  // ... additional logic
}
```

## 📦 Key Dependencies

```json
{
  "next": "15.5.6",
  "react": "19.1.0",
  "typescript": "^5",
  "tailwindcss": "^4",
  "@radix-ui/react-*": "latest",
  "next-auth": "^4.24.11",
  "next-themes": "^0.4.6",
  "lucide-react": "^0.545.0",
  "sonner": "^2.0.1",
  "jwt-decode": "^4.0.0",
  "react-icons": "^5.5.0"
}
```

## 🐛 Troubleshooting

### Port Already in Use

```bash
# Kill process on port 3000
npx kill-port 3000

# Or use a different port
pnpm dev -- -p 3001
```

### Build Errors

```bash
# Clear cache and rebuild
rm -rf .next
pnpm build
```

### Type Errors

```bash
# Check TypeScript errors
pnpm tsc --noEmit
```

### Azure AD Login Issues

See the comprehensive troubleshooting guide in [AZURE_LOGIN_SETUP.md](./AZURE_LOGIN_SETUP.md#troubleshooting)

## 📄 License

This project is proprietary software for enterprise use.

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## 📞 Support

For issues or questions, please contact the development team.

---

**Built with ❤️ using Next.js and TypeScript**
