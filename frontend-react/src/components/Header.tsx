import { RefreshCw } from 'lucide-react'

interface HeaderProps {
  title: string
  subtitle?: string
  onRefresh?: () => void
}

export default function Header({ title, subtitle, onRefresh }: HeaderProps) {
  return (
    <header className="header">
      <div className="header-title">
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      <div className="header-actions">
        {onRefresh && (
          <button className="btn btn-ghost btn-sm" onClick={onRefresh} title="Refresh data">
            <RefreshCw size={14} />
            Refresh
          </button>
        )}
        <div
          style={{
            width: 32, height: 32, borderRadius: '50%',
            background: 'var(--grad-primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, fontWeight: 700, color: 'white',
          }}
        >
          A
        </div>
      </div>
    </header>
  )
}
