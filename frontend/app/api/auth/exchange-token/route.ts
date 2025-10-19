import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

/**
 * Exchange Azure AD token for backend JWT token
 * This endpoint is called after successful Azure AD login
 */
export async function POST(request: NextRequest) {
  try {
    // Get NextAuth session token
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    })

    if (!token || !token.email) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Call backend API to exchange/validate the Azure token
    // For now, we'll use email-based authentication
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api'
    
    // Try to get or create backend user based on Azure AD email
    const response = await fetch(`${backendUrl}/auth/azure-login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: token.email,
        name: token.name || token.email,
        azureId: token.sub,
      }),
    })

    if (!response.ok) {
      // If the endpoint doesn't exist yet, return a mock token for development
      console.warn('Backend Azure auth endpoint not available, using development mode')
      
      return NextResponse.json({
        accessToken: 'dev-token-' + token.email,
        user: {
          id: token.sub || 'dev-user-id',
          name: token.name || token.email || 'User',
          email: token.email || '',
          department: '',
          roles: ['Admin'], // Default to Admin for Azure users in dev mode
          assignedServiceIds: [],
        },
      })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Token exchange error:', error)
    return NextResponse.json(
      { error: 'Token exchange failed' },
      { status: 500 }
    )
  }
}

