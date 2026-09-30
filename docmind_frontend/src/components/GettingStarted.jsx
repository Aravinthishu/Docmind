import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle2, Circle, FileText, Palette, Code2, ArrowRight } from 'lucide-react'
import { listDocuments } from '../api/documents'
import { getApiKeys } from '../api/organizations'

export default function GettingStarted({ orgId, onNavigateTab }) {
  const [docCount, setDocCount] = useState(0)
  const [hasDomain, setHasDomain] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([listDocuments(orgId), getApiKeys(orgId)])
      .then(([docsRes, keysRes]) => {
        const completed = docsRes.data.filter((d) => d.status === 'completed')
        setDocCount(completed.length)
        setHasDomain(keysRes.data.some((k) => k.allowed_domains?.length > 0))
      })
      .finally(() => setLoading(false))
  }, [orgId])

  const steps = [
    {
      id: 'documents',
      label: 'Upload company documents',
      desc: 'Add PDFs or text files so your bot can answer from real content.',
      done: docCount > 0,
      icon: FileText,
      tab: 'documents',
    },
    {
      id: 'widget',
      label: 'Customize your widget',
      desc: 'Set bot name, welcome message, and brand color.',
      done: true, // widget_config always exists with defaults — treat as "ready to review"
      icon: Palette,
      tab: 'widget',
    },
    {
      id: 'domain',
      label: 'Restrict your API key to your domain',
      desc: 'Lock the public key to your website in Settings, then embed the script.',
      done: hasDomain,
      icon: Code2,
      tab: 'settings',
    },
  ]

  const completedCount = steps.filter((s) => s.done).length

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-6 h-6 border-2 border-gold-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-forest-900/60 border border-forest-700 rounded-xl p-5">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-sm font-semibold text-white">Setup progress</h3>
          <span className="text-xs text-forest-500">{completedCount} / {steps.length} complete</span>
        </div>
        <div className="h-2 bg-forest-800 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${(completedCount / steps.length) * 100}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="h-full bg-gold-500"
          />
        </div>
      </div>

      <div className="space-y-3">
        {steps.map((step, i) => {
          const Icon = step.icon
          return (
            <motion.button
              key={step.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.07 }}
              onClick={() => onNavigateTab(step.tab)}
              className="w-full flex items-center gap-4 bg-forest-900/60 border border-forest-700 hover:border-gold-500/40 rounded-xl p-4 text-left transition group"
            >
              {step.done ? (
                <CheckCircle2 size={20} className="text-forest-400 shrink-0" />
              ) : (
                <Circle size={20} className="text-forest-600 shrink-0" />
              )}
              <div className="w-9 h-9 rounded-lg bg-forest-800 flex items-center justify-center shrink-0 group-hover:bg-gold-500/10 transition">
                <Icon size={16} className="text-gold-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white">{step.label}</p>
                <p className="text-xs text-forest-500">{step.desc}</p>
              </div>
              <ArrowRight size={16} className="text-forest-600 group-hover:text-gold-400 group-hover:translate-x-0.5 transition shrink-0" />
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}