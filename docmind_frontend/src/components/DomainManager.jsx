import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Plus, Globe } from 'lucide-react'
import toast from 'react-hot-toast'
import { updateApiKey } from '../api/organizations'
import { parseApiError } from '../utils/errors'

export default function DomainManager({ orgId, apiKey, onUpdate }) {
  const [input, setInput] = useState('')
  const [saving, setSaving] = useState(false)

  const cleanDomain = (raw) =>
    raw.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '')

  const addDomain = async (e) => {
    e.preventDefault()
    const domain = cleanDomain(input)
    if (!domain) return
    if (apiKey.allowed_domains.includes(domain)) {
      toast.error('Domain already added')
      return
    }
    setSaving(true)
    try {
      const { data } = await updateApiKey(orgId, apiKey.id, {
        allowed_domains: [...apiKey.allowed_domains, domain],
      })
      onUpdate(data)
      setInput('')
      toast.success('Domain added')
    } catch (err) {
      toast.error(parseApiError(err))
    } finally {
      setSaving(false)
    }
  }

  const removeDomain = async (domain) => {
    try {
      const { data } = await updateApiKey(orgId, apiKey.id, {
        allowed_domains: apiKey.allowed_domains.filter((d) => d !== domain),
      })
      onUpdate(data)
      toast.success('Domain removed')
    } catch (err) {
      toast.error(parseApiError(err))
    }
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <Globe size={15} className="text-forest-500" />
        <label className="text-sm text-forest-400">Allowed domains</label>
      </div>
      <p className="text-xs text-forest-600 mb-3">
        Only these domains can use this key in the embedded widget. Leave empty to allow any domain (testing only).
      </p>

      <form onSubmit={addDomain} className="flex gap-2 mb-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="example.com"
          className="flex-1 bg-forest-800/60 border border-forest-700 rounded-lg px-3 py-2 text-sm text-white placeholder-forest-500 focus:outline-none focus:ring-2 focus:ring-gold-500 transition"
        />
        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-1 bg-forest-700 hover:bg-forest-600 text-white text-sm px-3 py-2 rounded-lg transition disabled:opacity-50"
        >
          <Plus size={14} /> Add
        </button>
      </form>

      <div className="flex flex-wrap gap-2">
        <AnimatePresence>
          {apiKey.allowed_domains.length === 0 ? (
            <p className="text-xs text-forest-600 italic">No domains restricted yet</p>
          ) : (
            apiKey.allowed_domains.map((domain) => (
              <motion.span
                key={domain}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex items-center gap-1.5 bg-forest-800 border border-forest-700 text-forest-200 text-xs px-2.5 py-1.5 rounded-full"
              >
                {domain}
                <button onClick={() => removeDomain(domain)} className="text-forest-500 hover:text-red-400 transition">
                  <X size={12} />
                </button>
              </motion.span>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}