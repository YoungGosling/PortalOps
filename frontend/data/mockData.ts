import { WebService, User, WorkflowTask, UserAccess } from '@/types'

// Mock Web Services
export const mockServices: WebService[] = [
  {
    id: '1',
    name: 'Google Workspace',
    vendor: 'Google',
    url: 'https://workspace.google.com',
    description: 'Email, calendar, drive, and productivity tools',
    products: [
      { 
        id: '1-1', 
        name: 'Gmail', 
        description: 'Email service', 
        serviceId: '1', 
        isActive: true,
        billingInfo: {
          id: 'b1-1',
          productId: '1-1',
          billAmount: 120,
          cardholderName: 'Company Finance',
          expirationDate: '2025-12-31',
          paymentMethod: 'Credit Card',
          isComplete: true,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        }
      },
      { 
        id: '1-2', 
        name: 'Google Drive', 
        description: 'Cloud storage', 
        serviceId: '1', 
        isActive: true,
        billingInfo: {
          id: 'b1-2',
          productId: '1-2',
          billAmount: undefined, // Incomplete
          cardholderName: undefined,
          expirationDate: undefined,
          paymentMethod: undefined,
          isComplete: false,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        }
      },
      { 
        id: '1-3', 
        name: 'Google Calendar', 
        description: 'Calendar service', 
        serviceId: '1', 
        isActive: true,
        billingInfo: {
          id: 'b1-3',
          productId: '1-3',
          billAmount: 80,
          cardholderName: 'Company Finance',
          expirationDate: undefined, // Incomplete
          paymentMethod: 'Credit Card',
          isComplete: false,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        }
      },
      { 
        id: '1-4', 
        name: 'Google Meet', 
        description: 'Video conferencing', 
        serviceId: '1', 
        isActive: true 
        // No billing info - incomplete
      },
    ],
    paymentInfo: {
      id: 'p1',
      serviceId: '1',
      cardholder: 'Company Finance',
      renewalFrequency: 'annually',
      nextRenewalDate: '2024-11-15',
      amount: 1200,
      currency: 'USD',
      isActive: true,
    },
    administrators: ['1', '2'],
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    name: 'Microsoft 365',
    vendor: 'Microsoft',
    url: 'https://office.com',
    description: 'Office suite and productivity tools',
    products: [
      { 
        id: '2-1', 
        name: 'Outlook', 
        description: 'Email and calendar', 
        serviceId: '2', 
        isActive: true,
        billingInfo: {
          id: 'b2-1',
          productId: '2-1',
          billAmount: 150,
          cardholderName: 'Company Finance',
          expirationDate: '2025-06-30',
          paymentMethod: 'Credit Card',
          isComplete: true,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        }
      },
      { 
        id: '2-2', 
        name: 'OneDrive', 
        description: 'Cloud storage', 
        serviceId: '2', 
        isActive: true 
        // No billing info - incomplete
      },
      { 
        id: '2-3', 
        name: 'Teams', 
        description: 'Collaboration platform', 
        serviceId: '2', 
        isActive: true,
        billingInfo: {
          id: 'b2-3',
          productId: '2-3',
          billAmount: 200,
          cardholderName: undefined, // Incomplete
          expirationDate: '2025-03-31',
          paymentMethod: 'Credit Card',
          isComplete: false,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        }
      },
      { 
        id: '2-4', 
        name: 'SharePoint', 
        description: 'Document management', 
        serviceId: '2', 
        isActive: true 
        // No billing info - incomplete
      },
    ],
    paymentInfo: {
      id: 'p2',
      serviceId: '2',
      cardholder: 'Company Finance',
      renewalFrequency: 'annually',
      nextRenewalDate: '2024-11-20',
      amount: 2400,
      currency: 'USD',
      isActive: true,
    },
    administrators: ['1', '3'],
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '3',
    name: 'Slack',
    vendor: 'Slack Technologies',
    url: 'https://slack.com',
    description: 'Team communication and collaboration',
    products: [
      { id: '3-1', name: 'Slack Workspace', description: 'Team messaging', serviceId: '3', isActive: true },
      { id: '3-2', name: 'Slack Connect', description: 'External collaboration', serviceId: '3', isActive: true },
    ],
    paymentInfo: {
      id: 'p3',
      serviceId: '3',
      cardholder: 'Company Finance',
      renewalFrequency: 'monthly',
      nextRenewalDate: '2024-11-25',
      amount: 800,
      currency: 'USD',
      isActive: true,
    },
    administrators: ['1'],
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '4',
    name: 'Jira',
    vendor: 'Atlassian',
    url: 'https://atlassian.com/software/jira',
    description: 'Project management and issue tracking',
    products: [
      { id: '4-1', name: 'Jira Software', description: 'Agile project management', serviceId: '4', isActive: true },
      { id: '4-2', name: 'Jira Service Management', description: 'IT service management', serviceId: '4', isActive: true },
    ],
    paymentInfo: {
      id: 'p4',
      serviceId: '4',
      cardholder: 'Company Finance',
      renewalFrequency: 'annually',
      nextRenewalDate: '2025-01-15',
      amount: 1800,
      currency: 'USD',
      isActive: true,
    },
    administrators: ['1'],
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
]

// Mock Users (extended from AuthContext)
export const mockUsers: User[] = [
  {
    id: '1',
    email: 'admin@portalops.com',
    firstName: 'John',
    lastName: 'Admin',
    title: 'System Administrator',
    department: 'IT',
    roles: ['Admin'],
    canLogin: true,
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    email: 'service.admin@portalops.com',
    firstName: 'Sarah',
    lastName: 'Johnson',
    title: 'Service Administrator',
    department: 'IT Operations',
    roles: ['ServiceAdministrator'],
    canLogin: true,
    servicePermissions: [
      {
        id: 'sp1',
        userId: '2',
        serviceId: '1', // Google Workspace
        assignedBy: '1',
        assignedAt: '2024-01-01T00:00:00Z',
        isActive: true,
      },
      {
        id: 'sp2',
        userId: '2',
        serviceId: '2', // Microsoft 365
        assignedBy: '1',
        assignedAt: '2024-01-01T00:00:00Z',
        isActive: true,
      },
    ],
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '3',
    email: 'product.admin@portalops.com',
    firstName: 'Michael',
    lastName: 'Chen',
    title: 'Product Administrator',
    department: 'Engineering',
    roles: ['ProductAdministrator'],
    canLogin: true,
    productPermissions: [
      {
        id: 'pp1',
        userId: '3',
        serviceId: '1', // Google Workspace
        productId: '1-1', // Gmail
        assignedBy: '2',
        assignedAt: '2024-01-01T00:00:00Z',
        isActive: true,
      },
      {
        id: 'pp2',
        userId: '3',
        serviceId: '1', // Google Workspace
        productId: '1-2', // Google Drive
        assignedBy: '2',
        assignedAt: '2024-01-01T00:00:00Z',
        isActive: true,
      },
    ],
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '4',
    email: 'emily.davis@portalops.com',
    firstName: 'Emily',
    lastName: 'Davis',
    title: 'Software Engineer',
    department: 'Engineering',
    roles: ['User'],
    canLogin: false, // Users cannot login according to new PRD
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '5',
    email: 'jane.smith@portalops.com',
    firstName: 'Jane',
    lastName: 'Smith',
    title: 'Product Manager',
    department: 'Product',
    roles: ['User'],
    canLogin: false, // Users cannot login according to new PRD
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '6',
    email: 'david.wilson@portalops.com',
    firstName: 'David',
    lastName: 'Wilson',
    title: 'Marketing Specialist',
    department: 'Marketing',
    roles: ['User'],
    canLogin: false,
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
]

// Mock User Access
export const mockUserAccess: UserAccess[] = [
  {
    id: '1',
    userId: '4',
    serviceId: '1',
    productId: '1-1',
    accessLevel: 'write',
    assignedBy: '2',
    assignedAt: '2024-01-01T00:00:00Z',
    isActive: true,
  },
  {
    id: '2',
    userId: '4',
    serviceId: '1',
    productId: '1-2',
    accessLevel: 'write',
    assignedBy: '2',
    assignedAt: '2024-01-01T00:00:00Z',
    isActive: true,
  },
  {
    id: '3',
    userId: '5',
    serviceId: '2',
    productId: '2-1',
    accessLevel: 'read',
    assignedBy: '1',
    assignedAt: '2024-01-01T00:00:00Z',
    isActive: true,
  },
]

// Mock Workflow Tasks
export const mockTasks: WorkflowTask[] = [
  {
    id: '1',
    type: 'onboarding',
    title: 'Setup Google Workspace for Emily Davis',
    description: 'Create Gmail account and assign Google Drive access for new employee Emily Davis',
    assignedTo: '1',
    targetUserId: '4',
    serviceId: '1',
    productId: '1-1',
    status: 'completed',
    priority: 'high',
    dueDate: '2024-10-20',
    completedAt: '2024-10-18T10:30:00Z',
    completedBy: '1',
    comments: [
      {
        id: 'c1',
        taskId: '1',
        userId: '1',
        content: 'Account created successfully. Welcome email sent.',
        createdAt: '2024-10-18T10:30:00Z',
      }
    ],
    createdAt: '2024-10-15T00:00:00Z',
    updatedAt: '2024-10-18T10:30:00Z',
  },
  {
    id: '2',
    type: 'onboarding',
    title: 'Setup Slack access for Jane Smith',
    description: 'Add Jane Smith to company Slack workspace and relevant channels',
    assignedTo: '1',
    targetUserId: '5',
    serviceId: '3',
    productId: '3-1',
    status: 'pending',
    priority: 'medium',
    dueDate: '2024-10-25',
    comments: [],
    createdAt: '2024-10-20T00:00:00Z',
    updatedAt: '2024-10-20T00:00:00Z',
  },
  {
    id: '3',
    type: 'offboarding',
    title: 'Remove access for former employee',
    description: 'Revoke all Microsoft 365 access for departed employee',
    assignedTo: '1',
    targetUserId: '6',
    serviceId: '2',
    status: 'in_progress',
    priority: 'high',
    dueDate: '2024-10-16',
    comments: [
      {
        id: 'c2',
        taskId: '3',
        userId: '1',
        content: 'Started account deactivation process',
        createdAt: '2024-10-16T09:00:00Z',
      }
    ],
    createdAt: '2024-10-15T00:00:00Z',
    updatedAt: '2024-10-16T09:00:00Z',
  },
]

