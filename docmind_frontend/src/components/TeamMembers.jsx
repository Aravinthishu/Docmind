import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { UserPlus, Mail, Copy, Check, Trash2, LogOut, Clock, X } from 'lucide-react'
import toast from 'react-hot-toast'
import {
  listMembers, updateMemberRole, removeMember,
  listInvitations, createInvitation, revokeInvitation,
} from '../api/team'
import { parseApiError } from '../utils/errors'
import ConfirmModal from './ConfirmModal'
import Skeleton from './ui/Skeleton'

const RANK = { member: 1, admin: 2, owner: 3 }

const ROLE_STYLES = {
  owner: 'bg-gold-500/15 text-gold-400',
  admin: 'bg-forest-600/30 text-forest-400',
  member: 'bg-forest-800 text-forest-400',
}

const inviteLink = (token) => `${window.location.origin}/invite/${token}`

function RoleBadge({ role }) {
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${ROLE_STYLES[role]}`}>
      {role}
    </span>
  )
}

function CopyLinkButton({ token }) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink(token))
      setCopied(true)
      toast.success('Invite link copied')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Could not copy. Select the link and copy it manually.')
    }
  }

  return (
    <button
      onClick={copy}
      className="flex items-center gap-1.5 text-xs bg-forest-800 hover:bg-forest-700 text-forest-200 px-2.5 py-1.5 rounded-lg transition shrink-0"
    >
      {copied ? <Check size={13} className="text-gold-400" /> : <Copy size={13} />}
      {copied ? 'Copied' : 'Copy link'}
    </button>
  )
}

export default function TeamMembers({ orgId, role: myRole }) {
  const navigate = useNavigate()
  const canManage = myRole === 'owner' || myRole === 'admin'

  const [members, setMembers] = useState([])
  const [invites, setInvites] = useState([])
  const [loading, setLoading] = useState(true)

  const [email, setEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('member')
  const [sending, setSending] = useState(false)
  const [justInvited, setJustInvited] = useState(null)

  const [roleBusy, setRoleBusy] = useState(null)
  const [confirm, setConfirm] = useState(null)
  const [removing, setRemoving] = useState(false)

  const fetchAll = useCallback(async () => {
    try {
      const [membersRes, invitesRes] = await Promise.all([
        listMembers(orgId),
        canManage ? listInvitations(orgId) : Promise.resolve({ data: [] }),
      ])
      setMembers(membersRes.data)
      setInvites(invitesRes.data)
    } catch (err) {
      toast.error(parseApiError(err))
    } finally {
      setLoading(false)
    }
  }, [orgId, canManage])

  useEffect(() => { fetchAll() }, [fetchAll])

  const handleInvite = async (e) => {
    e.preventDefault()
    setSending(true)
    try {
      const { data } = await createInvitation(orgId, email.trim(), inviteRole)
      setInvites((prev) => [data, ...prev.filter((i) => i.email !== data.email)])
      setJustInvited(data)
      setEmail('')
      toast.success('Invitation created')
    } catch (err) {
      toast.error(parseApiError(err))
    } finally {
      setSending(false)
    }
  }

  const handleRevoke = async (invite) => {
    try {
      await revokeInvitation(orgId, invite.id)
      setInvites((prev) => prev.filter((i) => i.id !== invite.id))
      if (justInvited?.id === invite.id) setJustInvited(null)
      toast.success('Invitation revoked')
    } catch (err) {
      toast.error(parseApiError(err))
    }
  }

  const handleRoleChange = async (member, role) => {
    setRoleBusy(member.id)
    try {
      const { data } = await updateMemberRole(orgId, member.id, role)
      setMembers((prev) => prev.map((m) => (m.id === member.id ? data : m)))
      toast.success(`${member.email} is now ${role}`)
    } catch (err) {
      toast.error(parseApiError(err))
    } finally {
      setRoleBusy(null)
    }
  }

  const handleConfirmRemove = async () => {
    const { member, leaving } = confirm
    setRemoving(true)
    try {
      await removeMember(orgId, member.id)
      if (leaving) {
        toast.success('You left the organization')
        navigate('/dashboard')
        return
      }
      setMembers((prev) => prev.filter((m) => m.id !== member.id))
      toast.success('Member removed')
      setConfirm(null)
    } catch (err) {
      toast.error(parseApiError(err))
    } finally {
      setRemoving(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-32 rounded-xl" />
        {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {canManage && (
        <section className="bg-forest-900/60 border border-forest-700 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-1">
            <UserPlus size={15} className="text-gold-400" />
            <h3 className="text-sm font-semibold text-white">Invite a teammate</h3>
          </div>
          <p className="text-xs text-forest-500 mb-4">
            You'll get a link that only works for their email address. Links expire after 7 days.
          </p>

          <form onSubmit={handleInvite} className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-forest-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="teammate@company.com"
                className="w-full bg-forest-800/60 border border-forest-700 rounded-lg pl-9 pr-3 py-2.5 text-sm text-white placeholder-forest-500 focus:outline-none focus:ring-2 focus:ring-gold-500 transition"
              />
            </div>
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value)}
              className="bg-forest-800/60 border border-forest-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-gold-500 transition"
            >
              <option value="member">Member</option>
              {myRole === 'owner' && <option value="admin">Admin</option>}
            </select>
            <motion.button
              whileTap={{ scale: 0.97 }}
              type="submit"
              disabled={sending}
              className="bg-gold-500 hover:bg-gold-400 text-forest-950 font-semibold text-sm px-4 py-2.5 rounded-lg transition disabled:opacity-50 shrink-0"
            >
              {sending ? 'Creating...' : 'Create invite'}
            </motion.button>
          </form>

          <AnimatePresence>
            {justInvited && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-4 bg-forest-950/60 border border-gold-500/30 rounded-lg p-3">
                  <p className="text-xs text-forest-400 mb-2">
                    Send this link to <span className="text-white font-medium">{justInvited.email}</span>:
                  </p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-xs text-gold-400 bg-forest-900 rounded px-2.5 py-2 truncate">
                      {inviteLink(justInvited.token)}
                    </code>
                    <CopyLinkButton token={justInvited.token} />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      )}

      <section>
        <h3 className="text-sm font-semibold text-white mb-3">
          Members <span className="text-forest-500 font-normal">({members.length})</span>
        </h3>
        <div className="space-y-2">
          {members.map((m, i) => {
            const isOwnerRow = m.role === 'owner'
            const canChangeRole = myRole === 'owner' && !isOwnerRow && !m.is_you
            const canRemove = m.is_you ? !isOwnerRow : RANK[myRole] > RANK[m.role]
            const fullName = `${m.first_name} ${m.last_name}`.trim()

            return (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="flex items-center justify-between gap-3 bg-forest-900/60 border border-forest-700 rounded-xl px-4 py-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-forest-800 flex items-center justify-center text-gold-400 font-semibold text-sm shrink-0">
                    {m.email.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-white truncate">
                      {fullName || m.email}
                      {m.is_you && <span className="ml-2 text-[11px] text-forest-500">(you)</span>}
                    </p>
                    {fullName && <p className="text-xs text-forest-500 truncate">{m.email}</p>}
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {canChangeRole ? (
                    <select
                      value={m.role}
                      disabled={roleBusy === m.id}
                      onChange={(e) => handleRoleChange(m, e.target.value)}
                      className="bg-forest-800 border border-forest-700 rounded-lg px-2 py-1 text-xs text-white capitalize focus:outline-none focus:ring-2 focus:ring-gold-500 disabled:opacity-50"
                    >
                      <option value="admin">Admin</option>
                      <option value="member">Member</option>
                    </select>
                  ) : (
                    <RoleBadge role={m.role} />
                  )}

                  {canRemove && (
                    <button
                      onClick={() => setConfirm({ member: m, leaving: m.is_you })}
                      title={m.is_you ? 'Leave organization' : 'Remove member'}
                      className="text-forest-600 hover:text-red-400 transition"
                    >
                      {m.is_you ? <LogOut size={16} /> : <Trash2 size={16} />}
                    </button>
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>
      </section>

      {canManage && invites.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold text-white mb-3">
            Pending invitations <span className="text-forest-500 font-normal">({invites.length})</span>
          </h3>
          <div className="space-y-2">
            {invites.map((inv) => (
              <div
                key={inv.id}
                className="flex items-center justify-between gap-3 bg-forest-900/40 border border-dashed border-forest-700 rounded-xl px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="text-sm text-white truncate">{inv.email}</p>
                  <p className="flex items-center gap-1.5 text-xs text-forest-500 mt-0.5">
                    <Clock size={11} />
                    {inv.is_expired ? 'Expired' : `Expires ${new Date(inv.expires_at).toLocaleDateString()}`}
                    <span>·</span>
                    <span className="capitalize">{inv.role}</span>
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {!inv.is_expired && <CopyLinkButton token={inv.token} />}
                  <button
                    onClick={() => handleRevoke(inv)}
                    title="Revoke invitation"
                    className="text-forest-600 hover:text-red-400 transition p-1"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <ConfirmModal
        open={!!confirm}
        title={confirm?.leaving ? 'Leave organization?' : 'Remove member?'}
        message={
          confirm?.leaving
            ? "You'll lose access to this organization until someone invites you again."
            : `${confirm?.member.email} will lose access to this organization immediately.`
        }
        confirmLabel={confirm?.leaving ? 'Leave' : 'Remove'}
        onConfirm={handleConfirmRemove}
        onCancel={() => setConfirm(null)}
        loading={removing}
      />
    </div>
  )
}