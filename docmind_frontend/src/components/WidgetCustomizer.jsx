import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { MessageCircle, Send } from 'lucide-react'
import toast from 'react-hot-toast'
import { getWidgetConfig, updateWidgetConfig } from '../api/organizations'
import { parseApiError } from '../utils/errors'

const COLOR_PRESETS = ['#4F46E5', '#22855B', '#DC2626', '#EA580C', '#0891B2', '#7C3AED']

export default function WidgetCustomizer({ orgId }) {
  const [config, setConfig] = useState(null)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getWidgetConfig(orgId)
      .then(({ data }) => setConfig(data))
      .catch((err) => toast.error(parseApiError(err)))
      .finally(() => setLoading(false))
  }, [orgId])

  const update = (field, value) => setConfig((prev) => ({ ...prev, [field]: value }))

  const handleSave = useCallback(async () => {
    setSaving(true)
    try {
      const { data } = await updateWidgetConfig(orgId, {
        bot_name: config.bot_name,
        welcome_message: config.welcome_message,
        primary_color: config.primary_color,
        font_family: config.font_family,
        position: config.position,
      })
      setConfig(data)
      toast.success('Widget settings saved')
    } catch (err) {
      toast.error(parseApiError(err))
    } finally {
      setSaving(false)
    }
  }, [orgId, config])

  if (loading || !config) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-6 h-6 border-2 border-gold-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Form */}
      <div className="space-y-5">
        <div>
          <label className="text-sm text-forest-400 mb-1.5 block">Bot name</label>
          <input
            value={config.bot_name}
            onChange={(e) => update('bot_name', e.target.value)}
            className="w-full bg-forest-800/60 border border-forest-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-gold-500 transition"
          />
        </div>

        <div>
          <label className="text-sm text-forest-400 mb-1.5 block">Welcome message</label>
          <textarea
            value={config.welcome_message}
            onChange={(e) => update('welcome_message', e.target.value)}
            rows={2}
            className="w-full bg-forest-800/60 border border-forest-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-gold-500 transition resize-none"
          />
        </div>

        <div>
          <label className="text-sm text-forest-400 mb-1.5 block">Primary color</label>
          <div className="flex items-center gap-2 flex-wrap">
            {COLOR_PRESETS.map((c) => (
              <button
                key={c}
                onClick={() => update('primary_color', c)}
                style={{ backgroundColor: c }}
                className={`w-8 h-8 rounded-full transition ${
                  config.primary_color === c ? 'ring-2 ring-offset-2 ring-offset-forest-950 ring-gold-400' : ''
                }`}
              />
            ))}
            <input
              type="color"
              value={config.primary_color}
              onChange={(e) => update('primary_color', e.target.value)}
              className="w-8 h-8 rounded-full overflow-hidden border-none cursor-pointer bg-transparent"
            />
          </div>
        </div>

        <div>
          <label className="text-sm text-forest-400 mb-1.5 block">Widget position</label>
          <select
            value={config.position}
            onChange={(e) => update('position', e.target.value)}
            className="w-full bg-forest-800/60 border border-forest-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-gold-500 transition"
          >
            <option value="bottom-right">Bottom Right</option>
            <option value="bottom-left">Bottom Left</option>
          </select>
        </div>

        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleSave}
          disabled={saving}
          className="bg-gold-500 hover:bg-gold-400 text-forest-950 font-semibold px-5 py-2.5 rounded-lg transition disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </motion.button>
      </div>

      {/* Live preview */}
      <div className="bg-forest-900/40 border border-forest-800 rounded-xl p-6 flex items-end justify-center min-h-[420px] relative overflow-hidden">
        <p className="absolute top-4 left-4 text-xs text-forest-600 uppercase tracking-wide">Live Preview</p>

        <motion.div
          layout
          className="w-full max-w-xs bg-forest-900 border border-forest-700 rounded-2xl shadow-2xl overflow-hidden"
        >
          <div
            style={{ backgroundColor: config.primary_color }}
            className="px-4 py-3 flex items-center gap-2"
          >
            <MessageCircle size={18} className="text-white" />
            <span className="text-white font-medium text-sm">{config.bot_name}</span>
          </div>
          <div className="p-4 space-y-3 min-h-[160px]">
            <div className="bg-forest-800 rounded-lg rounded-tl-none px-3 py-2 text-sm text-forest-200 w-fit max-w-[85%]">
              {config.welcome_message}
            </div>
          </div>
          <div className="flex items-center gap-2 p-3 border-t border-forest-800">
            <div className="flex-1 bg-forest-800 rounded-full px-3 py-2 text-xs text-forest-500">
              Type a message...
            </div>
            <div
              style={{ backgroundColor: config.primary_color }}
              className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
            >
              <Send size={14} className="text-white" />
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}