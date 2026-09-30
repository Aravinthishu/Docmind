import { useEffect, useMemo, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Search, ThumbsUp, ThumbsDown, MessageSquare, ArrowLeft, RefreshCw, FileText, Inbox, Smile, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { listConversations, getConversation } from '../api/conversations'
import { parseApiError } from '../utils/errors'
import Skeleton from './ui/Skeleton'

function timeAgo(iso) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'review', label: 'Needs review' },
]

export default function Conversations({ orgId }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [selected, setSelected] = useState(null)
  const [thread, setThread] = useState([])
  const [threadLoading, setThreadLoading] = useState(false)

  const fetchList = useCallback(async (silent = false) => {
    if (silent) setRefreshing(true)
    try {
      const { data } = await listConversations(orgId)
      setData(data)
    } catch (err) {
      toast.error(parseApiError(err))
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [orgId])

  useEffect(() => { fetchList() }, [fetchList])

  const openSession = async (sessionId) => {
    setSelected(sessionId)
    setThreadLoading(true)
    try {
      const { data } = await getConversation(orgId, sessionId)
      setThread(data.messages)
    } catch (err) {
      toast.error(parseApiError(err))
    } finally {
      setThreadLoading(false)
    }
  }

  const sessions = data?.sessions || []
  const filtered = useMemo(() => {
    return sessions.filter((s) => {
      if (filter === 'review' && s.thumbs_down === 0) return false
      if (search && !s.preview.toLowerCase().includes(search.toLowerCase())) return false
      return true
    })
  }, [sessions, filter, search])

  const up = data?.summary.thumbs_up || 0
  const down = data?.summary.thumbs_down || 0
  const helpfulRate = up + down > 0 ? Math.round((up / (up + down)) * 100) : null

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
        </div>
        <Skeleton className="h-[520px] rounded-xl" />
      </div>
    )
  }

  const stats = [
    { icon: MessageSquare, label: 'Conversations', value: sessions.length },
    { icon: Smile, label: 'Rated helpful', value: helpfulRate === null ? '—' : `${helpfulRate}%` },
    { icon: AlertCircle, label: 'Marked unhelpful', value: down },
  ]

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-4">
        {stats.map((s, i) => {
          const Icon = s.icon
          return (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-forest-900/60 border border-forest-700 rounded-xl p-4"
            >
              <div className="flex items-center gap-1.5 text-xs text-forest-500 mb-1.5">
                <Icon size={13} className="text-gold-400" /> {s.label}
              </div>
              <p className="text-xl font-bold text-white">{s.value}</p>
            </motion.div>
          )
        })}
      </div>

      {sessions.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-forest-800 rounded-xl">
          <div className="w-14 h-14 rounded-full bg-forest-900 flex items-center justify-center mx-auto mb-4">
            <Inbox size={22} className="text-forest-600" />
          </div>
          <p className="text-white font-medium mb-1">No conversations yet</p>
          <p className="text-sm text-forest-500">Chats from your embedded widget will show up here.</p>
        </div>
      ) : (
        <div className="grid lg:grid-cols-[320px_1fr] border border-forest-700 rounded-xl overflow-hidden bg-forest-900/40 h-[560px]">
          {/* List */}
          <div className={`${selected ? 'hidden lg:flex' : 'flex'} flex-col border-r border-forest-800 min-h-0`}>
            <div className="p-3 border-b border-forest-800 space-y-2.5">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-forest-500" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search questions..."
                    className="w-full bg-forest-800/60 border border-forest-700 rounded-lg pl-9 pr-3 py-1.5 text-sm text-white placeholder-forest-500 focus:outline-none focus:ring-2 focus:ring-gold-500 transition"
                  />
                </div>
                <button
                  onClick={() => fetchList(true)}
                  title="Refresh"
                  className="p-2 rounded-lg text-forest-500 hover:text-white hover:bg-forest-800 transition"
                >
                  <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
                </button>
              </div>
              <div className="flex gap-1.5">
                {FILTERS.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setFilter(f.id)}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium transition ${
                      filter === f.id ? 'bg-gold-500 text-forest-950' : 'bg-forest-800 text-forest-400 hover:text-white'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {filtered.length === 0 ? (
                <p className="text-sm text-forest-500 text-center py-10 px-4">
                  {filter === 'review' ? 'No unhelpful answers. Nice.' : 'No matches.'}
                </p>
              ) : (
                filtered.map((s) => (
                  <button
                    key={s.session_id}
                    onClick={() => openSession(s.session_id)}
                    className={`w-full text-left px-4 py-3 border-b border-forest-800 transition ${
                      selected === s.session_id ? 'bg-forest-800/70' : 'hover:bg-forest-900'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm text-white truncate">{s.preview || 'Untitled chat'}</p>
                      <span className="text-[11px] text-forest-600 shrink-0">{timeAgo(s.last_activity)}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-forest-500">
                      <span className="flex items-center gap-1"><MessageSquare size={11} /> {s.message_count}</span>
                      {s.thumbs_up > 0 && (
                        <span className="flex items-center gap-1 text-forest-400"><ThumbsUp size={11} /> {s.thumbs_up}</span>
                      )}
                      {s.thumbs_down > 0 && (
                        <span className="flex items-center gap-1 text-red-400"><ThumbsDown size={11} /> {s.thumbs_down}</span>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Transcript */}
          <div className={`${selected ? 'flex' : 'hidden lg:flex'} flex-col min-h-0`}>
            {!selected ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
                <MessageSquare size={24} className="text-forest-700 mb-3" />
                <p className="text-sm text-forest-500">Select a conversation to read the transcript</p>
              </div>
            ) : (
              <>
                <div className="px-5 py-3 border-b border-forest-800 flex items-center gap-3">
                  <button
                    onClick={() => setSelected(null)}
                    className="lg:hidden text-forest-500 hover:text-white transition"
                  >
                    <ArrowLeft size={16} />
                  </button>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white">Conversation</p>
                    <p className="text-[11px] text-forest-600 truncate">{selected}</p>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-5 space-y-4">
                  {threadLoading ? (
                    <>
                      <Skeleton className="h-9 w-2/5 ml-auto rounded-2xl" />
                      <Skeleton className="h-16 w-3/5 rounded-2xl" />
                      <Skeleton className="h-9 w-1/3 ml-auto rounded-2xl" />
                    </>
                  ) : (
                    thread.map((m, i) => (
                      <motion.div
                        key={m.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: Math.min(i * 0.04, 0.3) }}
                        className="space-y-2"
                      >
                        <div className="flex justify-end">
                          <div className="max-w-[80%] bg-gold-500 text-forest-950 text-sm font-medium px-3.5 py-2 rounded-2xl rounded-br-sm">
                            {m.question}
                          </div>
                        </div>
                        <div className="flex flex-col items-start gap-1.5">
                          <div className="max-w-[80%] bg-forest-800 text-forest-100 text-sm px-3.5 py-2 rounded-2xl rounded-bl-sm whitespace-pre-wrap">
                            {m.answer}
                          </div>
                          <div className="flex flex-wrap items-center gap-2 pl-1">
                            {m.sources.map((src) => (
                              <span key={src} className="flex items-center gap-1 text-[11px] text-forest-400 bg-forest-900 border border-forest-700 rounded-full px-2 py-0.5">
                                <FileText size={10} /> {src}
                              </span>
                            ))}
                            {m.feedback === 1 && <ThumbsUp size={12} className="text-gold-400" />}
                            {m.feedback === -1 && <ThumbsDown size={12} className="text-red-400" />}
                            <span className="text-[11px] text-forest-600">{timeAgo(m.created_at)}</span>
                          </div>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}