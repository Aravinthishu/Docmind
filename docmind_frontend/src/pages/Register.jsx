import { useState, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react'
import toast from 'react-hot-toast'
import { register } from '../api/auth'
import { useAuth } from '../context/AuthContext'
import { useGoogleAuth } from '../hooks/useGoogleAuth'
import { parseApiError } from '../utils/errors'
import AuthLayout from '../components/AuthLayout'
import FormInput from '../components/ui/FormInput'
import GoogleButton from '../components/GoogleButton'
import Divider from '../components/ui/Divider'

export default function Register() {
  const [email, setEmail] = useState('')
  const [password1, setPassword1] = useState('')
  const [password2, setPassword2] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const { loginWithGoogle } = useAuth()
  const navigate = useNavigate()

  const mismatch = password2.length > 0 && password1 !== password2

  const handleGoogleSuccess = useCallback(async (accessToken) => {
    setGoogleLoading(true)
    try {
      await loginWithGoogle(accessToken)
      toast.success('Account ready')
      navigate('/dashboard')
    } catch (err) {
      toast.error(parseApiError(err))
    } finally {
      setGoogleLoading(false)
    }
  }, [loginWithGoogle, navigate])

  const handleGoogleError = useCallback(() => {
    toast.error('Google sign-in failed')
    setGoogleLoading(false)
  }, [])

  const { ready, promptGoogleLogin } = useGoogleAuth(handleGoogleSuccess, handleGoogleError)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (mismatch) {
      toast.error('Passwords do not match')
      return
    }
    setLoading(true)
    try {
      await register(email, password1, password2)
      toast.success('Account created — please sign in')
      navigate('/login')
    } catch (err) {
      toast.error(parseApiError(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout title="Create account" subtitle="Start building your AI chatbot">
      <GoogleButton onClick={promptGoogleLogin} disabled={!ready || googleLoading} />
      <Divider />

      <form onSubmit={handleSubmit} className="space-y-4">
        <FormInput icon={Mail} type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <div className="relative">
          <FormInput
            icon={Lock}
            type={showPassword ? 'text' : 'password'}
            placeholder="Password"
            value={password1}
            onChange={(e) => setPassword1(e.target.value)}
            required
            className="pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword((s) => !s)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-forest-500 hover:text-white transition"
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        <FormInput
          icon={Lock}
          type={showPassword ? 'text' : 'password'}
          placeholder="Confirm password"
          value={password2}
          onChange={(e) => setPassword2(e.target.value)}
          required
          error={mismatch ? 'Passwords do not match' : null}
        />

        <motion.button
          whileTap={{ scale: 0.98 }}
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-gold-500 hover:bg-gold-400 text-forest-950 font-semibold rounded-lg py-2.5 transition disabled:opacity-50"
        >
          {loading ? (
            <span className="w-4 h-4 border-2 border-forest-950/40 border-t-forest-950 rounded-full animate-spin" />
          ) : (
            <>Create account <ArrowRight size={15} /></>
          )}
        </motion.button>
      </form>
      <p className="text-sm text-forest-500 mt-6 text-center">
        Already have an account? <Link to="/login" className="text-gold-400 hover:underline font-medium">Sign in</Link>
      </p>
    </AuthLayout>
  )
}