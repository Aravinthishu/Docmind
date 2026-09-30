import { motion } from 'framer-motion'
import { Building2, ChevronRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function OrgCard({ org, index }) {
  const navigate = useNavigate()

  return (
    <motion.button
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.06, ease: 'easeOut' }}
      whileHover={{ y: -3 }}
      onClick={() => navigate(`/org/${org.id}`)}
      className="text-left bg-forest-900/60 border border-forest-700 rounded-xl p-5 hover:border-gold-500/50 transition group w-full"
    >
      <div className="flex items-start justify-between">
        <div className="w-10 h-10 rounded-lg bg-forest-800 flex items-center justify-center mb-3 group-hover:bg-gold-500/10 transition">
          <Building2 size={18} className="text-gold-400" />
        </div>
        <ChevronRight size={18} className="text-forest-600 group-hover:text-gold-400 group-hover:translate-x-0.5 transition" />
      </div>
      <h3 className="text-white font-semibold">{org.name}</h3>
      <p className="text-xs text-forest-500 mt-1 capitalize">{org.role}</p>
    </motion.button>
  )
}