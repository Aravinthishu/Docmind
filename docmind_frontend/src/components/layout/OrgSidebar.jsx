import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, LayoutDashboard, BarChart3, MessagesSquare, Palette, FileText, Code2, Users, Settings } from 'lucide-react'

const NAV = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'conversations', label: 'Conversations', icon: MessagesSquare },
  { id: 'widget', label: 'Widget Theme', icon: Palette },
  { id: 'documents', label: 'Documents', icon: FileText },
  { id: 'embed', label: 'Embed Code', icon: Code2 },
  { id: 'team', label: 'Team', icon: Users },
  { id: 'settings', label: 'Settings', icon: Settings },
]

export default function OrgSidebar({ orgName, role, active, onSelect }) {
  const navigate = useNavigate()
  const items = NAV.filter((item) => !(item.id === 'settings' && role === 'member'))

  return (
    <aside className="w-60 shrink-0 border-r border-forest-800 bg-forest-950 flex flex-col h-screen sticky top-0">
      <div className="px-5 py-5 border-b border-forest-800">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-1.5 text-xs text-forest-500 hover:text-white transition mb-3"
        >
          <ArrowLeft size={13} /> All organizations
        </button>
        <p className="text-white font-semibold truncate">{orgName || 'Loading...'}</p>
        {role && <p className="text-[11px] text-forest-500 capitalize mt-0.5">{role}</p>}
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {items.map((item) => {
          const Icon = item.icon
          const isActive = active === item.id
          return (
            <button
              key={item.id}
              onClick={() => onSelect(item.id)}
              className={`relative w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                isActive ? 'text-forest-950' : 'text-forest-400 hover:text-white hover:bg-forest-900'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="org-nav-active"
                  className="absolute inset-0 bg-gold-500 rounded-lg"
                  transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                />
              )}
              <Icon size={16} className="relative z-10" />
              <span className="relative z-10">{item.label}</span>
            </button>
          )
        })}
      </nav>

      <div className="px-5 py-4 border-t border-forest-800">
        <p className="text-[11px] text-forest-600">DocMind Dashboard</p>
      </div>
    </aside>
  )
}