import { useState, useEffect } from 'react'
import { Copy, Check } from 'lucide-react'
import toast from 'react-hot-toast'
import { getApiKeys } from '../api/organizations'
import { parseApiError } from '../utils/errors'

export default function EmbedSnippet({ orgId }) {
  const [publicKey, setPublicKey] = useState(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    getApiKeys(orgId)
      .then(({ data }) => setPublicKey(data[0]?.public_key))
      .catch((err) => toast.error(parseApiError(err)))
  }, [orgId])

  const snippet = `<script
  src="https://yourapp.com/widget.js"
  data-key="${publicKey || 'pk_xxxxxxxxxxxx'}"
  async
></script>`

  const handleCopy = () => {
    navigator.clipboard.writeText(snippet)
    setCopied(true)
    toast.success('Copied to clipboard')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-forest-400">
        Paste this snippet before the closing <code className="text-gold-400">&lt;/body&gt;</code> tag on your website.
      </p>
      <div className="relative bg-forest-900 border border-forest-700 rounded-lg p-4">
        <button
          onClick={handleCopy}
          className="absolute top-3 right-3 text-forest-500 hover:text-gold-400 transition"
        >
          {copied ? <Check size={16} className="text-forest-400" /> : <Copy size={16} />}
        </button>
        <pre className="text-xs text-forest-300 overflow-x-auto pr-8">{snippet}</pre>
      </div>
    </div>
  )
}