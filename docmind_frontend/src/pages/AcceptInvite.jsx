import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Building2, ArrowRight, AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { getInvitationPreview, acceptInvitation } from '../api/team'
import { parseApiError } from '../utils/errors'
import AuthLayout from '../components/AuthLayout'
import Skeleton from '../components/ui/Skeleton'

export default function AcceptInvite() {
  const { token } = useParams()
  const navigate = useNavigate()
  const { user, loading: authLoading, logout } = useAuth()

  const [preview, setPreview] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)
  const [accepting, setAccepting] = useState(false)

  useEffect(() => {
    getInvitationPreview(token)
      .then(({ data }) => setPreview(data))
      .catch(() => setError('This invitation link is invalid or has already been used.'))
      .finally(() => setLoading(false))
  }, [token])

  // logged-out visitors come back here automatically after signing in
  useEffect(() => {
    if (!authLoading && !user) {
      sessionStorage.setItem('post_login_redirect', `/invite/${token}`)
    }
  }, [authLoading, user, token])

  const handleAccept = async () => {
    setAccepting(true)
    try {
      const { data } = await acceptInvitation(token)
      toast.success(`You've joined ${preview.organization}`)
      navigate(`/org/${data.organization_id}`)
    } catch (err) {
      toast.error(parseApiError(err))
      setAccepting(false)
    }
  }

  const mismatch =
    user && preview && user.email.toLowerCase() !== preview.email.toLowerCase()

  const renderBody = () => {
    if (loading || authLoading) {
      return (
        <div className="space-y-3">
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-11 rounded-lg" />
        </div>
      )
    }

    if (error) {
      return (
        <div className="space-y-4">
          <p className="text-sm text-red-400">{error}</p>
          <Link to="/login" className="text-sm text-gold-400 hover:underline font-medium">Go to sign in</Link>
        </div>
      )
    }

    if (preview.is_expired) {
      return (
        <p className="text-sm text-forest-400">
          This invitation has expired. Ask {preview.invited_by || 'the organization owner'} to send you a new one.
        </p>
      )
    }

    return (
      <div className="space-y-5">
        <div className="bg-forest-900/60 border border-forest-700 rounded-xl p-4 flex items-center gap-3">
          <div className="w-11 h-11 rounded-lg bg-forest-800 flex items-center justify-center shrink-0">
            <Building2 size={20} className="text-gold-400" />
          </div>
          <div className="min-w-0">
            <p className="text-white font-semibold truncate">{preview.organization}</p>
            <p className="text-xs text-forest-500">
              You're invited as <span className="text-forest-300 capitalize">{preview.role}</span>
              {preview.invited_by && <> by {preview.invited_by}</>}
            </p>
          </div>
        </div>

        {!user && (
          <div className="space-y-3">
            <p className="text-xs text-forest-500">
              Use <span className="text-forest-300">{preview.email}</span> to sign in or create your account.
            </p>
            <Link
              to="/login"
              className="w-full flex items-center justify-center gap-2 bg-gold-500 hover:bg-gold-400 text-forest-950 font-semibold rounded-lg py-2.5 transition"
            >
              Sign in to accept <ArrowRight size={15} />
            </Link>
            <Link
              to="/register"
              className="w-full flex items-center justify-center bg-forest-800 hover:bg-forest-700 text-white font-medium rounded-lg py-2.5 transition"
            >
              Create account
            </Link>
          </div>
        )}

        {user && mismatch && (
          <div className="space-y-3">
            <div className="flex gap-2.5 bg-red-500/10 border border-red-900/40 rounded-lg p-3">
              <AlertTriangle size={16} className="text-red-400 shrink-0 mt-0.5" />
              <p className="text-xs text-forest-300">
                This invitation was sent to <span className="text-white">{preview.email}</span>, but you're signed in as{' '}
                <span className="text-white">{user.email}</span>.
              </p>
            </div>
            <button
              onClick={logout}
              className="w-full bg-forest-800 hover:bg-forest-700 text-white font-medium rounded-lg py-2.5 transition"
            >
              Sign out and switch account
            </button>
          </div>
        )}

        {user && !mismatch && (
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={handleAccept}
            disabled={accepting}
            className="w-full flex items-center justify-center gap-2 bg-gold-500 hover:bg-gold-400 text-forest-950 font-semibold rounded-lg py-2.5 transition disabled:opacity-50"
          >
            {accepting ? (
              <span className="w-4 h-4 border-2 border-forest-950/40 border-t-forest-950 rounded-full animate-spin" />
            ) : (
              <>Accept invitation <ArrowRight size={15} /></>
            )}
          </motion.button>
        )}
      </div>
    )
  }

  return (
    <AuthLayout title="You're invited" subtitle="Join a workspace on DocMind">
      {renderBody()}
    </AuthLayout>
  )
}