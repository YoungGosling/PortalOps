# PortalOps Frontend Demo

A comprehensive React-based frontend demo for PortalOps - a centralized, secure SaaS platform for managing company webservices, granular user access, payment monitoring, and automating HR-triggered onboarding/offboarding workflows.

## 🚀 Features

### ✅ Completed Features

- **Authentication System**
  - Sign in/Sign up forms with role-based access
  - Mock authentication with different user roles (Admin, HR, Finance, User)
  - Theme switching (Light/Dark/System)
  - Secure session management

- **Responsive Layout**
  - Modern enterprise header with navigation
  - Collapsible sidebar with role-based menu items
  - Mobile-responsive design
  - Consistent UI components

- **Dashboard**
  - Overview cards with key metrics
  - Recent activity feed
  - Upcoming renewals tracking
  - Quick action buttons
  - Role-based content visibility

- **Service Inventory**
  - Complete CRUD interface for web services
  - Service cards with detailed information
  - Product/module management
  - Payment information tracking
  - Search and filtering capabilities

- **User Directory**
  - User management with role assignments
  - User cards with contact information
  - Role-based filtering and search
  - Department and status tracking

- **Inbox/Workflow System**
  - Onboarding and offboarding task management
  - Task status tracking (Pending, In Progress, Completed, Escalated)
  - Comment system for task collaboration
  - Priority and due date management
  - Real-time status updates

### 🔄 Placeholder Features (UI Only)

- Payment Registry
- Reports & Audit Trails
- Admin Configuration Pages
- Security & Compliance Settings

## 🛠 Technology Stack

- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **Lucide React** for icons
- **Context API** for state management
- **Mock Data** for demonstration

## 🎯 Demo Credentials

Use these credentials to test different user roles:

- **Admin**: `admin@portalops.com` / `password`
- **HR Manager**: `hr@portalops.com` / `password`
- **Finance**: `finance@portalops.com` / `password`
- **User**: `user@portalops.com` / `password`

## 🏃‍♂️ Getting Started

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Start Development Server**
   ```bash
   npm start
   ```

3. **Open Browser**
   Navigate to `http://localhost:3000`

## 📱 Role-Based Access

The application implements role-based access control:

### Admin Role
- Full access to all modules
- System administration features
- User management capabilities
- Security and compliance settings

### HR Role
- Service inventory management
- User directory access
- Workflow task management
- Reports access

### Finance Role
- Payment registry access
- Service cost tracking
- Financial reports
- Renewal management

### User Role
- Dashboard access
- Personal inbox
- Limited service visibility

## 🎨 Design System

The application follows enterprise design principles:

- **Colors**: Professional blue primary with semantic colors
- **Typography**: Clean, readable fonts with proper hierarchy
- **Components**: Consistent, reusable UI components
- **Spacing**: Systematic spacing using Tailwind's scale
- **Accessibility**: WCAG compliant color contrasts and keyboard navigation

## 📊 Mock Data

The demo includes realistic mock data for:

- **4 Web Services** (Google Workspace, Microsoft 365, Slack, Jira)
- **5 Users** with different roles and departments
- **3 Workflow Tasks** in various states
- **Payment Information** with renewal tracking
- **User Access Assignments** across services

## 🔮 Future Enhancements

- Real API integration
- Advanced filtering and sorting
- Bulk operations
- Email notifications
- Advanced reporting
- Audit trail visualization
- Integration with HR systems
- Mobile app companion

## 📁 Project Structure

```
src/
├── components/
│   ├── auth/           # Authentication components
│   ├── dashboard/      # Dashboard and overview
│   ├── inbox/          # Workflow task management
│   ├── layout/         # Header, sidebar, layout
│   ├── services/       # Service inventory
│   ├── ui/             # Reusable UI components
│   └── users/          # User directory
├── contexts/           # React contexts (Auth, Theme)
├── data/              # Mock data
├── lib/               # Utility functions
├── types/             # TypeScript type definitions
└── App.tsx            # Main application component
```

## 🎯 Key Features Demonstrated

1. **Enterprise Authentication** - Role-based access with secure session management
2. **Responsive Design** - Works seamlessly across desktop, tablet, and mobile
3. **Modern UI/UX** - Clean, professional interface following enterprise standards
4. **Workflow Management** - Complete task lifecycle from creation to completion
5. **Service Management** - Comprehensive service and product tracking
6. **User Administration** - Role-based user management with detailed profiles
7. **Dashboard Analytics** - Key metrics and activity tracking
8. **Theme Support** - Light/dark mode with system preference detection

This demo showcases a production-ready frontend for an enterprise service management platform, demonstrating modern React development practices and enterprise-grade UI/UX design.