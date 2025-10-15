import React from 'react'
import { 
  Building, 
  Users, 
  CheckCircle, 
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Clock,
  Shield
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card'
import { useAuth } from '../../contexts/AuthContext'

interface StatCardProps {
  title: string
  value: string | number
  description?: string
  icon: React.ComponentType<{ className?: string }>
  trend?: {
    value: number
    isPositive: boolean
  }
  color?: 'blue' | 'green' | 'yellow' | 'red'
}

function StatCard({ title, value, description, icon: Icon, trend, color = 'blue' }: StatCardProps) {
  const colorClasses = {
    blue: 'text-blue-600 bg-blue-100 dark:bg-blue-900/20',
    green: 'text-green-600 bg-green-100 dark:bg-green-900/20',
    yellow: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20',
    red: 'text-red-600 bg-red-100 dark:bg-red-900/20',
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className={`p-2 rounded-md ${colorClasses[color]}`}>
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
        {trend && (
          <div className="flex items-center mt-2">
            {trend.isPositive ? (
              <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
            ) : (
              <TrendingDown className="h-3 w-3 text-red-600 mr-1" />
            )}
            <span className={`text-xs ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {trend.value}%
            </span>
            <span className="text-xs text-muted-foreground ml-1">from last month</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

interface ActivityItem {
  id: string
  type: 'user_created' | 'service_added' | 'task_completed' | 'payment_renewed'
  description: string
  timestamp: string
  user?: string
}

function RecentActivity() {
  const activities: ActivityItem[] = [
    {
      id: '1',
      type: 'user_created',
      description: 'New user Emily Davis was added to the system',
      timestamp: '2 hours ago',
      user: 'Sarah Johnson'
    },
    {
      id: '2',
      type: 'task_completed',
      description: 'Onboarding task for Google Workspace completed',
      timestamp: '4 hours ago',
      user: 'John Admin'
    },
    {
      id: '3',
      type: 'service_added',
      description: 'New service Slack was added to inventory',
      timestamp: '1 day ago',
      user: 'John Admin'
    },
    {
      id: '4',
      type: 'payment_renewed',
      description: 'Microsoft 365 subscription renewed successfully',
      timestamp: '2 days ago',
      user: 'Michael Chen'
    },
  ]

  const getActivityIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'user_created':
        return <Users className="h-4 w-4 text-blue-600" />
      case 'service_added':
        return <Building className="h-4 w-4 text-green-600" />
      case 'task_completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'payment_renewed':
        return <Shield className="h-4 w-4 text-purple-600" />
      default:
        return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>Latest system activities and updates</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-start space-x-3">
              <div className="flex-shrink-0 mt-0.5">
                {getActivityIcon(activity.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground">{activity.description}</p>
                <div className="flex items-center mt-1 text-xs text-muted-foreground">
                  <span>{activity.timestamp}</span>
                  {activity.user && (
                    <>
                      <span className="mx-1">•</span>
                      <span>by {activity.user}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function UpcomingRenewals() {
  const renewals = [
    {
      id: '1',
      service: 'Google Workspace',
      dueDate: '2024-11-15',
      amount: '$1,200',
      status: 'due_soon'
    },
    {
      id: '2',
      service: 'Microsoft 365',
      dueDate: '2024-11-20',
      amount: '$2,400',
      status: 'upcoming'
    },
    {
      id: '3',
      service: 'Slack Pro',
      dueDate: '2024-11-25',
      amount: '$800',
      status: 'upcoming'
    },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upcoming Renewals</CardTitle>
        <CardDescription>Services requiring payment renewal</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {renewals.map((renewal) => (
            <div key={renewal.id} className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <div className="font-medium text-sm">{renewal.service}</div>
                <div className="text-xs text-muted-foreground">
                  Due: {new Date(renewal.dueDate).toLocaleDateString()}
                </div>
              </div>
              <div className="text-right">
                <div className="font-medium text-sm">{renewal.amount}</div>
                <div className={`text-xs px-2 py-1 rounded ${
                  renewal.status === 'due_soon' 
                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                    : 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
                }`}>
                  {renewal.status === 'due_soon' ? 'Due Soon' : 'Upcoming'}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export function Dashboard() {
  const { user, hasAnyRole } = useAuth()

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome back, {user?.firstName}!
        </h1>
        <p className="text-muted-foreground">
          Here's what's happening with your enterprise services today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Active Services"
          value={12}
          description="Currently managed services"
          icon={Building}
          trend={{ value: 8.2, isPositive: true }}
          color="blue"
        />
        <StatCard
          title="Total Users"
          value={248}
          description="Active user accounts"
          icon={Users}
          trend={{ value: 12.5, isPositive: true }}
          color="green"
        />
        <StatCard
          title="Pending Tasks"
          value={7}
          description="Workflow tasks requiring attention"
          icon={Clock}
          trend={{ value: 3.1, isPositive: false }}
          color="yellow"
        />
        <StatCard
          title="Upcoming Renewals"
          value={3}
          description="Services due for renewal"
          icon={AlertTriangle}
          color="red"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        <RecentActivity />
        <UpcomingRenewals />
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks and shortcuts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <button className="p-4 border rounded-lg hover:bg-accent transition-colors text-left">
              <Users className="h-6 w-6 text-blue-600 mb-2" />
              <div className="font-medium">Add New User</div>
              <div className="text-sm text-muted-foreground">Create a new user account</div>
            </button>
            
            {hasAnyRole(['hr', 'admin']) && (
              <button className="p-4 border rounded-lg hover:bg-accent transition-colors text-left">
                <Building className="h-6 w-6 text-green-600 mb-2" />
                <div className="font-medium">Add Service</div>
                <div className="text-sm text-muted-foreground">Register a new web service</div>
              </button>
            )}
            
            <button className="p-4 border rounded-lg hover:bg-accent transition-colors text-left">
              <CheckCircle className="h-6 w-6 text-purple-600 mb-2" />
              <div className="font-medium">View Inbox</div>
              <div className="text-sm text-muted-foreground">Check pending workflow tasks</div>
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
