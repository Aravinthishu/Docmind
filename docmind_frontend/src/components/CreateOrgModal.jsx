import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import toast from 'react-hot-toast'
import { createOrganization } from '../api/organizations'
import { parseApiError } from '../utils/errors'

export default function CreateOrgModal({ open, onClose, onCreated }) {
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { data } = await createOrganization(name)
      toast.success('Organization created')
      onCreated(data)
      setName('')
      onClose()
    } catch (err) {
      toast.error(parseApiError(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-forest-900 border border-forest-700 rounded-2xl p-6 w-full max-w-sm shadow-2xl"
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-white">New Organization</h2>
              <button onClick={onClose} className="text-forest-500 hover:text-white transition">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                autoFocus
                type="text"
                placeholder="Company name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full bg-forest-800/60 border border-forest-700 rounded-lg px-4 py-2.5 text-white placeholder-forest-500 focus:outline-none focus:ring-2 focus:ring-gold-500 transition"
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gold-500 hover:bg-gold-400 text-forest-950 font-semibold rounded-lg py-2.5 transition disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create Organization'}
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}