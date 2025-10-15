import React, { useState } from 'react'
import { 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  User, 
  Calendar,
  MessageSquare,
  Search,
  UserPlus,
  UserMinus
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { mockTasks, mockUsers, mockServices } from '../../data/mockData'
import { WorkflowTask, TaskStatus } from '../../types'
import { formatDateTime } from '../../lib/utils'

interface TaskCardProps {
  task: WorkflowTask
  onStatusChange: (taskId: string, status: TaskStatus) => void
  onAddComment: (taskId: string, comment: string) => void
}

function TaskCard({ task, onStatusChange, onAddComment }: TaskCardProps) {
  const [showComments, setShowComments] = useState(false)
  const [newComment, setNewComment] = useState('')

  const user = mockUsers.find(u => u.id === task.targetUserId)
  const service = mockServices.find(s => s.id === task.serviceId)
  const assignee = mockUsers.find(u => u.id === task.assignedTo)

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
      case 'escalated':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
      case 'cancelled':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-600'
      case 'medium':
        return 'text-yellow-600'
      case 'low':
        return 'text-green-600'
      default:
        return 'text-gray-600'
    }
  }

  const getTaskIcon = (type: string) => {
    return type === 'onboarding' ? (
      <UserPlus className="h-4 w-4 text-green-600" />
    ) : (
      <UserMinus className="h-4 w-4 text-red-600" />
    )
  }

  const handleSubmitComment = () => {
    if (newComment.trim()) {
      onAddComment(task.id, newComment.trim())
      setNewComment('')
    }
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            {getTaskIcon(task.type)}
            <div className="flex-1">
              <CardTitle className="text-lg">{task.title}</CardTitle>
              <CardDescription className="mt-1">
                {task.description}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
              {task.status.replace('_', ' ')}
            </span>
            <AlertTriangle className={`h-4 w-4 ${getPriorityColor(task.priority)}`} />
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <User className="h-4 w-4 text-gray-500" />
            <span>
              {task.type === 'onboarding' ? 'New User: ' : 'User: '}
              {user ? `${user.firstName} ${user.lastName}` : 'Unknown User'}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <span>
              Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date'}
            </span>
          </div>
        </div>

        <div className="text-sm">
          <div className="font-medium text-gray-700 dark:text-gray-300">Service Details:</div>
          <div className="text-gray-600 dark:text-gray-400">
            {service?.name} - {service?.vendor}
          </div>
        </div>

        <div className="text-sm">
          <div className="font-medium text-gray-700 dark:text-gray-300">Assigned to:</div>
          <div className="text-gray-600 dark:text-gray-400">
            {assignee ? `${assignee.firstName} ${assignee.lastName}` : 'Unassigned'}
          </div>
        </div>

        {task.status !== 'completed' && task.status !== 'cancelled' && (
          <div className="flex space-x-2 pt-2 border-t">
            {task.status === 'pending' && (
              <Button
                size="sm"
                onClick={() => onStatusChange(task.id, 'in_progress')}
              >
                Start Task
              </Button>
            )}
            {task.status === 'in_progress' && (
              <Button
                size="sm"
                onClick={() => onStatusChange(task.id, 'completed')}
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Complete
              </Button>
            )}
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowComments(!showComments)}
            >
              <MessageSquare className="h-4 w-4 mr-1" />
              Comments ({task.comments.length})
            </Button>
          </div>
        )}

        {task.completedAt && (
          <div className="text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 p-2 rounded">
            Completed on {formatDateTime(task.completedAt)}
            {task.completedBy && (
              <span> by {mockUsers.find(u => u.id === task.completedBy)?.firstName}</span>
            )}
          </div>
        )}

        {showComments && (
          <div className="space-y-3 pt-3 border-t">
            <div className="space-y-2">
              {task.comments.map((comment) => {
                const commentUser = mockUsers.find(u => u.id === comment.userId)
                return (
                  <div key={comment.id} className="bg-gray-50 dark:bg-gray-800 p-3 rounded">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">
                        {commentUser ? `${commentUser.firstName} ${commentUser.lastName}` : 'Unknown User'}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatDateTime(comment.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300">{comment.content}</p>
                  </div>
                )
              })}
            </div>
            
            <div className="flex space-x-2">
              <Input
                placeholder="Add a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="flex-1"
                onKeyPress={(e) => e.key === 'Enter' && handleSubmitComment()}
              />
              <Button size="sm" onClick={handleSubmitComment}>
                Add
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function Inbox() {
  const [tasks, setTasks] = useState<WorkflowTask[]>(mockTasks)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all')

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const handleStatusChange = (taskId: string, newStatus: TaskStatus) => {
    setTasks(tasks.map(task => 
      task.id === taskId 
        ? { 
            ...task, 
            status: newStatus,
            completedAt: newStatus === 'completed' ? new Date().toISOString() : task.completedAt,
            completedBy: newStatus === 'completed' ? '1' : task.completedBy, // Current user
            updatedAt: new Date().toISOString()
          }
        : task
    ))
  }

  const handleAddComment = (taskId: string, content: string) => {
    setTasks(tasks.map(task => 
      task.id === taskId 
        ? {
            ...task,
            comments: [
              ...task.comments,
              {
                id: `c${Date.now()}`,
                taskId,
                userId: '1', // Current user
                content,
                createdAt: new Date().toISOString()
              }
            ],
            updatedAt: new Date().toISOString()
          }
        : task
    ))
  }

  const getStatusCounts = () => {
    return {
      pending: tasks.filter(t => t.status === 'pending').length,
      in_progress: tasks.filter(t => t.status === 'in_progress').length,
      completed: tasks.filter(t => t.status === 'completed').length,
      escalated: tasks.filter(t => t.status === 'escalated').length,
    }
  }

  const statusCounts = getStatusCounts()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Inbox</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage onboarding and offboarding workflow tasks
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              <div>
                <div className="text-2xl font-bold">{statusCounts.pending}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Pending</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-blue-600" />
              <div>
                <div className="text-2xl font-bold">{statusCounts.in_progress}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">In Progress</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <div className="text-2xl font-bold">{statusCounts.completed}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Completed</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <div>
                <div className="text-2xl font-bold">{statusCounts.escalated}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Escalated</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search tasks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as TaskStatus | 'all')}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-sm"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="escalated">Escalated</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Tasks List */}
      <div className="space-y-4">
        {filteredTasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onStatusChange={handleStatusChange}
            onAddComment={handleAddComment}
          />
        ))}
      </div>

      {filteredTasks.length === 0 && (
        <div className="text-center py-12">
          <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            No tasks found
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {searchTerm || statusFilter !== 'all' 
              ? 'Try adjusting your search or filter criteria.' 
              : 'All caught up! No pending workflow tasks.'}
          </p>
        </div>
      )}
    </div>
  )
}
