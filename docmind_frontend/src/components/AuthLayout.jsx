import { motion } from 'framer-motion'
import { Sparkles, MessageCircle, Zap, ShieldCheck } from 'lucide-react'

const FEATURES = [
  { icon: MessageCircle, text: 'Answers powered by your own documents, not generic AI guesses' },
  { icon: Zap, text: 'Drop-in widget — one script tag, live in minutes' },
  { icon: ShieldCheck, text: 'Domain-locked API keys keep your bot yours alone' },
]

export default function AuthLayout({ title, subtitle, children }) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-forest-950">
      <div className="hidden lg:flex flex-col justify-between relative overflow-hidden p-12 border-r border-forest-800">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-forest-600/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-gold-500/10 rounded-full blur-3xl" />

        <div className="relative">
          <div className="flex items-center gap-2 mb-16">
            <div className="w-9 h-9 rounded-lg bg-gold-500 flex items-center justify-center">
              <Sparkles size={18} className="text-forest-950" />
            </div>
            <span className="text-xl font-bold text-white">DocMind</span>
          </div>

          <motion.h2
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-3xl font-bold text-white leading-tight mb-4 max-w-md"
          >
            Turn your documents into an AI support agent your customers can talk to.
          </motion.h2>
          <p className="text-forest-500 max-w-sm">Upload docs, customize your widget, embed one script tag — done.</p>
        </div>

        <div className="relative space-y-4">
          {FEATURES.map((f, i) => {
            const Icon = f.icon
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 + i * 0.1 }}
                className="flex items-start gap-3"
              >
                <div className="w-8 h-8 rounded-lg bg-forest-800 flex items-center justify-center shrink-0 mt-0.5">
                  <Icon size={15} className="text-gold-400" />
                </div>
                <p className="text-sm text-forest-400">{f.text}</p>
              </motion.div>
            )
          })}
        </div>
      </div>

      <div className="flex items-center justify-center px-6 py-12 relative">
        <div className="lg:hidden absolute top-8 left-8 flex items-center gap-2">
          <Sparkles className="text-gold-400" size={20} />
          <span className="text-white font-semibold">DocMind</span>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="w-full max-w-sm"
        >
          <h1 className="text-2xl font-bold text-white mb-1">{title}</h1>
          <p className="text-forest-500 text-sm mb-8">{subtitle}</p>
          {children}
        </motion.div>
      </div>
    </div>
  )
}