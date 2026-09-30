import { createContext, useContext, useState, useEffect } from 'react'
import { getCurrentUser, login as loginApi, googleLogin, logout as logoutApi } from '../api/auth'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (!token) {
      setLoading(false)
      return
    }
    getCurrentUser()
      .then((res) => setUser(res.data))
      .catch(() => logoutApi())
      .finally(() => setLoading(false))
  }, [])

  const login = async (email, password) => {
    const { data } = await loginApi(email, password)
    localStorage.setItem('access_token', data.access)
    localStorage.setItem('refresh_token', data.refresh)
    setUser(data.user)
  }

  const loginWithGoogle = async (googleAccessToken) => {
    const { data } = await googleLogin(googleAccessToken)
    localStorage.setItem('access_token', data.access)
    localStorage.setItem('refresh_token', data.refresh)
    setUser(data.user)
  }

  const logout = () => {
    logoutApi()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)