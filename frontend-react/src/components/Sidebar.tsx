import { useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  TrendingUp,
  Users,
  Package,
  Truck,
  BarChart3,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

interface NavItem {
  path: string
  label: string
  icon: LucideIcon
}

const navItems: NavItem[] = [
  { path: '/',         label: 'Overview',         icon: LayoutDashboard },
  { path: '/sales',    label: 'Sales Analytics',  icon: TrendingUp      },
  { path: '/customers',label: 'Customer Insights', icon: Users          },
  { path: '/products', label: 'Products',          icon: Package        },
  { path: '/delivery', label: 'Delivery',          icon: Truck          },
]

export default function Sidebar() {
  const location = useLocation()
  const navigate = useNavigate()

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <BarChart3 size={20} color="white" />
        </div>
        <div className="sidebar-logo-text">
          Smart Analytics
          <span>Olist E-Commerce</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map(({ path, label, icon: Icon }) => (
          <button
            key={path}
            className={`nav-item ${location.pathname === path ? 'active' : ''}`}
            onClick={() => navigate(path)}
            aria-label={`Navigate to ${label}`}
          >
            <Icon size={18} className="nav-item-icon" />
            {label}
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div style={{ fontSize: 11, color: 'var(--text-muted)', paddingLeft: 12 }}>
          Powered by Olist Dataset
        </div>
      </div>
    </aside>
  )
}
