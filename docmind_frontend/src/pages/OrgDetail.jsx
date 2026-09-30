import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { LayoutDashboard, BarChart3, MessagesSquare, Palette, FileText, Code2, Users, Settings } from 'lucide-react'
import { getOrganization } from '../api/organizations'
import OrgSidebar from '../components/layout/OrgSidebar'
import WidgetCustomizer from '../components/WidgetCustomizer'
import DocumentUpload from '../components/DocumentUpload'
import EmbedSnippet from '../components/EmbedSnippet'
import GettingStarted from '../components/GettingStarted'
import OrgSettings from '../components/OrgSettings'
import UsageAnalytics from '../components/UsageAnalytics'
import Conversations from '../components/Conversations'
import TeamMembers from '../components/TeamMembers'

const MOBILE_TABS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'conversations', label: 'Chats', icon: MessagesSquare },
  { id: 'widget', label: 'Widget', icon: Palette },
  { id: 'documents', label: 'Docs', icon: FileText },
  { id: 'embed', label: 'Embed', icon: Code2 },
  { id: 'team', label: 'Team', icon: Users },
  { id: 'settings', label: 'Settings', icon: Settings },
]

export default function OrgDetail() {
  const { id } = useParams()
  const [tab, setTab] = useState('overview')
  const [org, setOrg] = useState(null)

  useEffect(() => {
    getOrganization(id).then(({ data }) => setOrg(data)).catch(() => {})
  }, [id])

  const role = org?.role
  const mobileTabs = MOBILE_TABS.filter((t) => !(t.id === 'settings' && role === 'member'))
  // if a tab isn't available for this role, fall back to overview
  const activeTab = mobileTabs.some((t) => t.id === tab) ? tab : 'overview'

  return (
    <div className="flex bg-forest-950 min-h-screen">
      <div className="hidden lg:block">
        <OrgSidebar orgName={org?.name} role={role} active={activeTab} onSelect={setTab} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="lg:hidden border-b border-forest-800 px-4 py-3 sticky top-0 bg-forest-950/90 backdrop-blur-md z-40">
          <p className="text-white font-semibold text-sm mb-3 truncate">{org?.name || 'Loading...'}</p>
          <div className="flex gap-1 overflow-x-auto no-scrollbar">
            {mobileTabs.map((t) => {
              const Icon = t.icon
              const active = activeTab === t.id
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition ${
                    active ? 'bg-gold-500 text-forest-950' : 'text-forest-400 bg-forest-900'
                  }`}
                >
                  <Icon size={13} /> {t.label}
                </button>
              )
            })}
          </div>
        </div>

        <main className="max-w-4xl mx-auto px-6 lg:px-10 py-8">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
          >
            {activeTab === 'overview' && <GettingStarted orgId={id} onNavigateTab={setTab} />}
            {activeTab === 'analytics' && <UsageAnalytics orgId={id} />}
            {activeTab === 'conversations' && <Conversations orgId={id} />}
            {activeTab === 'widget' && <WidgetCustomizer orgId={id} />}
            {activeTab === 'documents' && <DocumentUpload orgId={id} />}
            {activeTab === 'embed' && <EmbedSnippet orgId={id} />}
            {activeTab === 'team' && role && <TeamMembers orgId={id} role={role} />}
            {activeTab === 'settings' && <OrgSettings orgId={id} role={role} />}
          </motion.div>
        </main>
      </div>
    </div>
  )
}