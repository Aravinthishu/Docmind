export default function Divider({ text = 'or' }) {
  return (
    <div className="flex items-center gap-3 my-5">
      <div className="flex-1 h-px bg-forest-800" />
      <span className="text-xs text-forest-600 uppercase tracking-wide">{text}</span>
      <div className="flex-1 h-px bg-forest-800" />
    </div>
  )
}