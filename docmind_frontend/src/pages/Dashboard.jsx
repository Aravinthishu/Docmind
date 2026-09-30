import { useEffect, useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Plus, Search, Sparkles, Building2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { listOrganizations } from '../api/organizations'
import { parseApiError } from '../utils/errors'
import OrgCard from '../components/OrgCard'
import CreateOrgModal from '../components/CreateOrgModal'
import UserMenu from '../components/ui/UserMenu'
import OrgCardSkeleton from '../components/skeletons/OrgCardSkeleton'

export default function Dashboard() {
  const [orgs, setOrgs] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [search, setSearch] = useState('')

  const fetchOrgs = async () => {
    try {
      const { data } = await listOrganizations()
      setOrgs(data)
    } catch (err) {
      toast.error(parseApiError(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchOrgs() }, [])

  const filtered = useMemo(
    () => orgs.filter((o) => o.name.toLowerCase().includes(search.toLowerCase())),
    [orgs, search]
  )

  return (
    <div className="min-h-screen bg-forest-950 text-white">
      <header className="border-b border-forest-800 px-8 py-4 flex justify-between items-center sticky top-0 bg-forest-950/80 backdrop-blur-md z-40">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gold-500 flex items-center justify-center">
            <Sparkles size={16} className="text-forest-950" />
          </div>
          <span className="font-bold text-white">DocMind</span>
        </div>
        <UserMenu />
      </header>

      <main className="max-w-5xl mx-auto px-8 py-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold">Your Organizations</h1>
            <p className="text-sm text-forest-500 mt-0.5">
              {loading ? 'Loading...' : `${orgs.length} organization${orgs.length !== 1 ? 's' : ''}`}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {orgs.length > 0 && (
              <div className="relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-forest-500" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search..."
                  className="bg-forest-900/60 border border-forest-700 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-forest-500 focus:outline-none focus:ring-2 focus:ring-gold-500 transition w-40 sm:w-52"
                />
              </div>
            )}
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={() => setModalOpen(true)}
              className="flex items-center gap-2 bg-gold-500 hover:bg-gold-400 text-forest-950 font-semibold px-4 py-2 rounded-lg transition shrink-0"
            >
              <Plus size={16} /> New
            </motion.button>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => <OrgCardSkeleton key={i} />)}
          </div>
        ) : orgs.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-24 border border-dashed border-forest-800 rounded-xl"
          >
            <div className="w-14 h-14 rounded-full bg-forest-900 flex items-center justify-center mx-auto mb-4">
              <Building2 size={22} className="text-forest-600" />
            </div>
            <p className="text-white font-medium mb-1">No organizations yet</p>
            <p className="text-sm text-forest-500 mb-5">Create one to start building your AI chatbot</p>
            <button
              onClick={() => setModalOpen(true)}
              className="text-gold-400 hover:underline text-sm font-medium"
            >
              Create your first organization
            </button>
          </motion.div>
        ) : filtered.length === 0 ? (
          <p className="text-center text-forest-500 py-16">No organizations match "{search}"</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((org, i) => (
              <OrgCard key={org.id} org={org} index={i} />
            ))}
          </div>
        )}
      </main>

      <CreateOrgModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={(org) => setOrgs((prev) => [...prev, { ...org, role: 'owner' }])}
      />
    </div>
  )
}