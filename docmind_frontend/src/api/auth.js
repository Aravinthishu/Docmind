import client from './client'

export const register = (email, password1, password2) =>
  client.post('/auth/register/', { email, password1, password2 })

export const login = (email, password) =>
  client.post('/auth/login/', { email, password })

export const googleLogin = (accessToken) =>
  client.post('/auth/google/', { access_token: accessToken })

export const getCurrentUser = () => client.get('/auth/user/')

export const logout = () => {
  localStorage.removeItem('access_token')
  localStorage.removeItem('refresh_token')
}