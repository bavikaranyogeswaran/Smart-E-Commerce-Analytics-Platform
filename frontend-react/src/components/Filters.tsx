import type { ReactNode, ChangeEvent } from 'react'
import type { Granularity } from '../types/api'

const BR_STATES = [
  'SP','RJ','MG','RS','PR','SC','BA','GO','ES','DF','PE',
  'CE','MA','MT','MS','PA','AM','RO','PI','AL','PB','SE',
  'TO','RN','AC','AP','RR',
]

export interface FilterState {
  start_date?: string
  end_date?: string
  state?: string
  granularity?: Granularity
  category?: string
}

interface FiltersProps {
  filters: FilterState
  onChange: (updated: FilterState) => void
  children?: ReactNode
}

export default function Filters({ filters, onChange, children }: FiltersProps) {
  const handle = (key: keyof FilterState) => (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    onChange({ ...filters, [key]: e.target.value })

  return (
    <div className="filters-bar">
      <div className="filter-group">
        <label className="filter-label" htmlFor="filter-start">From</label>
        <input id="filter-start" className="filter-input" type="date"
          value={filters.start_date ?? ''} onChange={handle('start_date')} />
      </div>

      <div className="filter-group">
        <label className="filter-label" htmlFor="filter-end">To</label>
        <input id="filter-end" className="filter-input" type="date"
          value={filters.end_date ?? ''} onChange={handle('end_date')} />
      </div>

      {'state' in filters && (
        <div className="filter-group">
          <label className="filter-label" htmlFor="filter-state">State</label>
          <select id="filter-state" className="filter-select"
            value={filters.state ?? ''} onChange={handle('state')}>
            <option value="">All States</option>
            {BR_STATES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      )}

      {'granularity' in filters && (
        <div className="filter-group">
          <label className="filter-label" htmlFor="filter-gran">Granularity</label>
          <select id="filter-gran" className="filter-select"
            value={filters.granularity ?? 'monthly'} onChange={handle('granularity')}>
            <option value="daily">Daily</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </select>
        </div>
      )}

      {'category' in filters && (
        <div className="filter-group">
          <label className="filter-label" htmlFor="filter-cat">Category</label>
          <input id="filter-cat" className="filter-input" type="text"
            placeholder="Search category…" value={filters.category ?? ''}
            onChange={handle('category')} />
        </div>
      )}

      {children && <div style={{ marginLeft: 'auto' }}>{children}</div>}
    </div>
  )
}
