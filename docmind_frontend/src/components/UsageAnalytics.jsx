import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { MessageSquare, TrendingUp, Gauge } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { getUsageStats } from '../api/usage'
import StatCardSkeleton from './skeletons/StatCardSkeleton'
import Skeleton from './ui/Skeleton'

function StatCard({ icon: Icon, label, value, sub, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      className="bg-forest-900/60 border border-forest-700 rounded-xl p-5"
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-lg bg-forest-800 flex items-center justify-center">
          <Icon size={15} className="text-gold-400" />
        </div>
        <span className="text-xs text-forest-500">{label}</span>
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
      {sub && <p className="text-xs text-forest-500 mt-1">{sub}</p>}
    </motion.div>
  )
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-forest-900 border border-forest-700 rounded-lg px-3 py-2 text-xs shadow-xl">
      <p className="text-forest-400 mb-0.5">{label}</p>
      <p className="text-gold-400 font-semibold">{payload[0].value} queries</p>
    </div>
  )
}

export default function UsageAnalytics({ orgId }) {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getUsageStats(orgId)
      .then(({ data }) => setStats(data))
      .finally(() => setLoading(false))
  }, [orgId])

  if (loading || !stats) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => <StatCardSkeleton key={i} />)}
        </div>
        <Skeleton className="h-16 w-full rounded-xl" />
        <Skeleton className="h-56 w-full rounded-xl" />
      </div>
    )
  }

  const usagePercent = Math.min(100, Math.round((stats.month_to_date / stats.monthly_limit) * 100))
  const chartData = stats.daily.map((d) => ({
    date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    count: d.count,
  }))

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icon={MessageSquare} label="This month" value={stats.month_to_date} sub={`of ${stats.monthly_limit} limit`} index={0} />
        <StatCard icon={TrendingUp} label="All time" value={stats.total_all_time} sub="total conversations" index={1} />
        <StatCard icon={Gauge} label="Plan usage" value={`${usagePercent}%`} sub="of monthly quota" index={2} />
      </div>

      <div className="bg-forest-900/60 border border-forest-700 rounded-xl p-5">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-sm font-semibold text-white">Monthly quota</h3>
          <span className="text-xs text-forest-500">{stats.month_to_date} / {stats.monthly_limit}</span>
        </div>
        <div className="h-2.5 bg-forest-800 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${usagePercent}%` }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className={`h-full rounded-full ${usagePercent >= 90 ? 'bg-red-500' : 'bg-gold-500'}`}
          />
        </div>
        {usagePercent >= 90 && (
          <p className="text-xs text-red-400 mt-2">Approaching monthly limit — consider upgrading soon.</p>
        )}
      </div>

      <div className="bg-forest-900/60 border border-forest-700 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-white mb-4">Queries — last 30 days</h3>
        {chartData.length === 0 ? (
          <p className="text-sm text-forest-500 text-center py-10">No conversations yet this period.</p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#145238" vertical={false} />
              <XAxis dataKey="date" stroke="#5c8a75" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="#5c8a75" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(250, 204, 21, 0.05)' }} />
              <Bar dataKey="count" fill="#facc15" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}