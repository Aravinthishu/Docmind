const STYLES = {
  pending: 'bg-forest-700 text-forest-300',
  processing: 'bg-gold-500/20 text-gold-400 animate-pulse',
  completed: 'bg-forest-600/30 text-forest-400',
  failed: 'bg-red-500/20 text-red-400',
}

export default function StatusBadge({ status }) {
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${STYLES[status] || STYLES.pending}`}>
      {status}
    </span>
  )
}