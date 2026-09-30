import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { getOrganization, updateOrganization, deleteOrganization, getApiKeys } from '../api/organizations'
import { parseApiError } from '../utils/errors'
import DomainManager from './DomainManager'
import ConfirmModal from './ConfirmModal'

export default function OrgSettings({ orgId, role }) {
  const [org, setOrg] = useState(null)
  const [apiKey, setApiKey] = useState(null)
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    Promise.all([getOrganization(orgId), getApiKeys(orgId)]).then(([orgRes, keysRes]) => {
      setOrg(orgRes.data)
      setName(orgRes.data.name)
      setApiKey(keysRes.data[0])
    })
  }, [orgId])

  const handleRename = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const { data } = await updateOrganization(orgId, { name })
      setOrg(data)
      toast.success('Organization renamed')
    } catch (err) {
      toast.error(parseApiError(err))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await deleteOrganization(orgId)
      toast.success('Organization deleted')
      navigate('/dashboard')
    } catch (err) {
      toast.error(parseApiError(err))
      setDeleting(false)
    }
  }

  if (!org || !apiKey) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-6 h-6 border-2 border-gold-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-xl space-y-10">
      <section>
        <h3 className="text-sm font-semibold text-white mb-3">General</h3>
        <form onSubmit={handleRename} className="flex gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="flex-1 bg-forest-800/60 border border-forest-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-gold-500 transition"
          />
          <motion.button
            whileTap={{ scale: 0.97 }}
            type="submit"
            disabled={saving || name === org.name}
            className="bg-gold-500 hover:bg-gold-400 text-forest-950 font-semibold px-4 py-2.5 rounded-lg transition disabled:opacity-40"
          >
            {saving ? 'Saving...' : 'Save'}
          </motion.button>
        </form>
      </section>

      <section>
        <h3 className="text-sm font-semibold text-white mb-3">API Key Security</h3>
        <DomainManager orgId={orgId} apiKey={apiKey} onUpdate={setApiKey} />
      </section>

      {role === 'owner' && (
        <section className="border border-red-900/30 rounded-xl p-5 bg-red-950/10">
          <h3 className="text-sm font-semibold text-red-400 mb-1">Danger Zone</h3>
          <p className="text-xs text-forest-500 mb-4">
            Deleting this organization permanently removes its documents, widget config, and chat history.
          </p>
          <button
            onClick={() => setDeleteOpen(true)}
            className="text-sm bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-900/40 px-4 py-2 rounded-lg transition"
          >
            Delete Organization
          </button>
        </section>
      )}

      <ConfirmModal
        open={deleteOpen}
        title="Delete organization?"
        message={`This will permanently delete "${org.name}" and all its data. This cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteOpen(false)}
        loading={deleting}
      />
    </div>
  )
}