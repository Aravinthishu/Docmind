import { useState, useRef, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Upload, FileText, Trash2, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { listDocuments, uploadDocument, deleteDocument } from '../api/documents'
import { parseApiError } from '../utils/errors'
import StatusBadge from './StatusBadge'
import DocumentRowSkeleton from './skeletons/DocumentRowSkeleton'

export default function DocumentUpload({ orgId }) {
  const [docs, setDocs] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef(null)

  const fetchDocs = useCallback(async () => {
    try {
      const { data } = await listDocuments(orgId)
      setDocs(data)
    } catch (err) {
      toast.error(parseApiError(err))
    } finally {
      setLoading(false)
    }
  }, [orgId])

  useEffect(() => {
    fetchDocs()
  }, [fetchDocs])

  useEffect(() => {
    const hasPending = docs.some((d) => d.status === 'pending' || d.status === 'processing')
    if (!hasPending) return
    const interval = setInterval(fetchDocs, 3000)
    return () => clearInterval(interval)
  }, [docs, fetchDocs])

  const handleFile = async (file) => {
    if (!file) return
    const validTypes = ['.pdf', '.txt']
    const ext = '.' + file.name.split('.').pop().toLowerCase()
    if (!validTypes.includes(ext)) {
      toast.error('Only PDF or TXT files are supported')
      return
    }

    setUploading(true)
    setProgress(0)
    try {
      const { data } = await uploadDocument(orgId, file, setProgress)
      setDocs((prev) => [data, ...prev])
      toast.success('Document uploaded — processing started')
    } catch (err) {
      toast.error(parseApiError(err))
    } finally {
      setUploading(false)
      setProgress(0)
    }
  }

  const handleDelete = async (docId) => {
    try {
      await deleteDocument(orgId, docId)
      setDocs((prev) => prev.filter((d) => d.id !== docId))
      toast.success('Document removed')
    } catch (err) {
      toast.error(parseApiError(err))
    }
  }

  return (
    <div className="space-y-5">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragOver(false)
          handleFile(e.dataTransfer.files[0])
        }}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition ${
          dragOver ? 'border-gold-500 bg-gold-500/5' : 'border-forest-700 hover:border-forest-600'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.txt"
          hidden
          onChange={(e) => handleFile(e.target.files[0])}
        />
        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="animate-spin text-gold-400" size={24} />
            <p className="text-sm text-forest-400">Uploading {progress}%</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Upload className="text-forest-500" size={24} />
            <p className="text-sm text-forest-400">
              Drop a PDF or TXT file here, or <span className="text-gold-400">browse</span>
            </p>
          </div>
        )}
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => <DocumentRowSkeleton key={i} />)}
        </div>
      ) : docs.length === 0 ? (
        <p className="text-sm text-forest-500 text-center py-6">No documents uploaded yet.</p>
      ) : (
        <div className="space-y-2">
          {docs.map((doc, i) => (
            <motion.div
              key={doc.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="flex items-center justify-between bg-forest-900/60 border border-forest-700 rounded-lg px-4 py-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                <FileText size={18} className="text-forest-500 shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm text-white truncate">{doc.original_filename}</p>
                  {doc.status === 'completed' && (
                    <p className="text-xs text-forest-500">{doc.chunk_count} chunks indexed</p>
                  )}
                  {doc.status === 'failed' && (
                    <p className="text-xs text-red-400 truncate">{doc.error_message}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <StatusBadge status={doc.status} />
                <button
                  onClick={() => handleDelete(doc.id)}
                  className="text-forest-600 hover:text-red-400 transition"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}