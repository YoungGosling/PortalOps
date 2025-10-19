# PortalOps - Next.js Frontend

A centralized, secure SaaS platform for managing company web services, products, and user access built with Next.js 15.

## 📋 Project Overview

PortalOps is an enterprise service management platform that provides:

- **Service & Product Management**: Centralized inventory for all company services and products
- **Payment Tracking**: Complete billing information management with file attachments
- **User Administration**: Role-based access control with Admin and ServiceAdmin roles
- **Workflow Automation**: Onboarding and offboarding workflows triggered by HR systems
- **Master Files**: Central repository for all bill attachments

## 🚀 Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4.0
- **UI Components**: Radix UI + shadcn/ui
- **State Management**: React Context API
- **Theme**: next-themes (Light/Dark mode)
- **Notifications**: Sonner
- **Icons**: Lucide React
- **Date Handling**: Day.js

## 📁 Project Structure

```
nextjs/
├── app/
│   ├── (auth)/              # Authentication pages
│   │   └── signin/          # Login & signup
│   ├── (internal)/          # Main application pages
│   │   ├── layout.tsx       # Shared layout with Header & Sidebar
│   │   ├── page.tsx         # Dashboard
│   │   ├── services/        # Service Inventory (cards view)
│   │   ├── products/        # Product Inventory (table view)
│   │   ├── payments/        # Payment Register (inline edit)
│   │   ├── users/           # User Directory (Admin only)
│   │   └── inbox/           # Workflow tasks (Admin only)
│   ├── (admin)/             # Admin-only pages
│   │   └── admin/
│   │       ├── dashboard/   # System Dashboard
│   │       ├── security/    # Security & Compliance
│   │       ├── permissions/ # User Administration
│   │       ├── files/       # Master Files
│   │       └── config/      # System Configuration
│   ├── layout.tsx           # Root layout
│   └── globals.css          # Global styles
├── components/
│   ├── ui/                  # Reusable UI components (shadcn/ui)
│   └── layout/              # Layout components (Header, Sidebar)
├── lib/
│   ├── utils.ts             # Utility functions
│   ├── api.ts               # API client
│   └── billingUtils.ts      # Payment-related utilities
├── providers/
│   ├── auth-provider.tsx    # Authentication context
│   ├── theme-provider.tsx   # Theme management
│   └── payment-summary-provider.tsx  # Payment summary context
├── types/
│   └── index.ts             # TypeScript type definitions
├── middleware.ts            # Route protection
├── tailwind.config.ts       # Tailwind configuration
├── next.config.ts           # Next.js configuration
├── tsconfig.json            # TypeScript configuration
└── package.json             # Dependencies
```

## 🎨 Key Features

### 1. Two-Role Permission System

- **Admin**: Full access to all features
- **ServiceAdmin**: Limited access to assigned services and products

### 2. Unified Add/Edit Panel

- Consistent UI/UX across all modules
- Single component for create and update operations

### 3. Real-Time Data Synchronization

- Automatic data refresh after CUD operations
- Always displays the most current information

### 4. Service Inventory (Card View)

- Visual card layout for services
- Product count display
- Associate/disassociate products
- Non-destructive service deletion

### 5. Product Inventory (Table View)

- List view with service associations
- Filter by service
- Automatic payment record creation on product add

### 6. Payment Register (Inline Editing)

- No modal dialogs - edit directly on the page
- Color-coded completion status (red/green indicators)
- Required fields: Amount, Cardholder, Expiry, Method, Attachment
- Badge counter in navigation for incomplete records

### 7. User Directory (Admin Only)

- Full user CRUD operations
- Role assignment
- Service/Product access management
- Filter users by product

### 8. Inbox (Admin Only)

- Onboarding workflow with pre-filled fields
- Offboarding workflow with read-only user info
- Incomplete tasks sorted to top

### 9. Master Files (Admin Only)

- Central repository of all bill attachments
- Download functionality

## 🛠️ Installation & Setup

### Prerequisites

- Node.js 18+ 
- pnpm (recommended) or npm

### Environment Variables

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-change-this-in-production

# Optional: Azure AD Configuration
AZURE_AD_CLIENT_ID=your-azure-client-id
AZURE_AD_CLIENT_SECRET=your-azure-client-secret
AZURE_AD_TENANT_ID=your-azure-tenant-id
```

### Install Dependencies

```bash
pnpm install
# or
npm install
```

### Run Development Server

```bash
pnpm dev
# or
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
pnpm build
pnpm start
# or
npm run build
npm start
```

## 📚 API Integration

The frontend connects to the backend API at the URL specified in `NEXT_PUBLIC_API_BASE_URL`.

### Key Endpoints

- `POST /api/auth/login` - User authentication
- `GET /api/auth/me` - Get current user profile
- `GET /api/services` - List services
- `GET /api/products` - List products
- `GET /api/payment-register` - List payment records
- `GET /api/users` - List users (Admin only)
- `GET /api/inbox/tasks` - List workflow tasks (Admin only)
- `GET /api/master-files/attachments` - List attachments (Admin only)

See [API Specification v2.0](../doc/design/server/v2/API_Specification_v2.md) for full details.

## 🎭 Design System

### Color Palette

- **Primary**: HSL(221, 83%, 53%) - Professional blue
- **Secondary**: HSL(210, 40%, 96.1%) - Light gray
- **Destructive**: HSL(0, 84.2%, 60.2%) - Red for errors
- **Muted**: HSL(215.4, 16.3%, 46.9%) - Muted text

### Components

All UI components follow the shadcn/ui design system with Tailwind CSS styling.

### Theme Support

- Light mode
- Dark mode  
- System preference detection

## 🔐 Authentication & Authorization

### Route Protection

Middleware (`middleware.ts`) handles:
- Redirecting unauthenticated users to `/signin`
- Preventing authenticated users from accessing auth pages

### Role-Based Access

Components use the `useAuth()` hook to:
- Check user roles: `isAdmin()`, `isServiceAdmin()`
- Display/hide features based on permissions
- Protect admin-only pages

## 📦 State Management

### Global State

- **AuthProvider**: User authentication state
- **ThemeProvider**: Dark/light mode
- **PaymentSummaryProvider**: Incomplete payment count

### Local State

- Component-level state with `useState`
- Form state management

## 🔄 Data Flow

1. **Authentication**: Login → Store token → Fetch user profile
2. **Page Load**: Fetch data from API → Display in UI
3. **CRUD Operations**: User action → API call → Refetch data → Update UI
4. **Real-time Updates**: Payment summary refreshes on mount and after updates

## 🎯 Routing Strategy

### Route Groups

- `(auth)`: Public authentication pages
- `(internal)`: Protected main application pages
- `(admin)`: Admin-only pages

### Navigation

- File-based routing with Next.js App Router
- Automatic code splitting per route
- Optimized navigation with `next/link`

## 🧪 Development

### Code Style

- TypeScript strict mode enabled
- ESLint for code quality
- Consistent naming conventions

### Components

- Server Components by default
- Client Components marked with `'use client'`
- Reusable UI components in `components/ui/`

### Performance

- Automatic image optimization
- Route-level code splitting
- React Server Components for faster loads

## 📖 Documentation

- [PRD v2.0](../doc/design/PortalOps.md) - Product Requirements
- [API Spec v2.0](../doc/design/server/v2/API_Specification_v2.md) - API Documentation
- [Process Log](../process.md) - Development progress

## 🚧 Future Enhancements

- Advanced search and filtering
- Bulk operations
- Export functionality
- Audit logs
- Email notifications
- Real-time collaboration features

## 📄 License

Proprietary - Internal Enterprise Use Only

## 👥 Contributors

Enterprise Development Team

---

**Version**: 2.0  
**Last Updated**: 2025-10-17

