// Test API connectivity
import { authApi, usersApi, servicesApi } from '../lib/api'

export const testApiConnection = async () => {
  console.log('🔍 Testing API connection...')
  
  try {
    // Test health endpoint
    const healthResponse = await fetch('http://localhost:8000/health')
    if (healthResponse.ok) {
      const healthData = await healthResponse.json()
      console.log('✅ Backend health check:', healthData)
    } else {
      console.error('❌ Backend health check failed:', healthResponse.status)
      return false
    }

    // Test login with admin credentials
    console.log('🔐 Testing login...')
    try {
      const loginResponse = await authApi.login('admin@portalops.com', 'password')
      console.log('✅ Login successful:', loginResponse)
      
      // Test getting user profile
      const profileResponse = await authApi.getProfile()
      console.log('✅ Profile fetch successful:', profileResponse)
      
      // Test getting users
      const usersResponse = await usersApi.getUsers()
      console.log('✅ Users fetch successful:', usersResponse)
      
      // Test getting services
      const servicesResponse = await servicesApi.getServices()
      console.log('✅ Services fetch successful:', servicesResponse)
      
      return true
    } catch (loginError) {
      console.error('❌ API calls failed:', loginError)
      return false
    }
    
  } catch (error) {
    console.error('❌ API connection test failed:', error)
    return false
  }
}

// Run test when this module is imported in development
if (process.env.NODE_ENV === 'development') {
  // Delay to allow backend to start
  setTimeout(() => {
    testApiConnection().then(success => {
      if (success) {
        console.log('🎉 API connection test completed successfully!')
      } else {
        console.log('⚠️ API connection test failed. Check backend status.')
      }
    })
  }, 2000)
}



