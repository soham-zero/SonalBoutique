'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { 
  Receipt, 
  Package, 
  Scissors, 
  Users, 
  CreditCard, 
  UserSquare2, 
  UsersRound, 
  LineChart, 
  LogOut,
  Menu,
  X,
  History
} from 'lucide-react'
import clsx from 'clsx'

const NAV_ITEMS = [
  { name: 'New Bill',     path: '/dashboard/billing',          icon: Receipt,     color: 'text-boutique-indigo',  activeBg: 'bg-boutique-indigoLight'  },
  { name: 'Bill History', path: '/dashboard/billing/history',  icon: History,     color: 'text-boutique-indigo',  activeBg: 'bg-boutique-indigoLight'  },
  { name: 'Inventory',    path: '/dashboard/inventory',        icon: Package,     color: 'text-boutique-emerald', activeBg: 'bg-boutique-emeraldLight' },
  { name: 'Job Work',     path: '/dashboard/jobwork',          icon: Scissors,    color: 'text-boutique-amber',   activeBg: 'bg-boutique-amberLight'   },
  { name: 'Customers',    path: '/dashboard/customers',        icon: Users,       color: 'text-boutique-roseDark',activeBg: 'bg-boutique-roseLight'    },
  { name: 'Expenses',     path: '/dashboard/expenses',         icon: CreditCard,  color: 'text-boutique-ruby',    activeBg: 'bg-boutique-rubyLight'    },
  { name: 'Employees',    path: '/dashboard/employees',        icon: UserSquare2, color: 'text-boutique-teal',    activeBg: 'bg-boutique-tealLight'    },
  { name: 'Bishi',        path: '/dashboard/bishi',            icon: UsersRound,  color: 'text-boutique-teal',    activeBg: 'bg-boutique-tealLight'    },
  { name: 'Analytics',    path: '/dashboard/analytics',        icon: LineChart,   color: 'text-boutique-indigo',  activeBg: 'bg-boutique-indigoLight'  },
]

export function Sidebar() {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-white border-r border-boutique-border shadow-soft">
      {/* Brand */}
      <div className="px-5 py-6 border-b border-boutique-border/60">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-boutique-roseDark flex items-center justify-center shadow-sm">
            <Scissors className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="font-serif text-lg leading-tight tracking-wide text-boutique-charcoal font-bold">
              Sonal Boutique
            </h1>
            <p className="text-[10px] text-boutique-charcoalLight tracking-widest uppercase font-medium">Management</p>
          </div>
        </div>
      </div>
      
      <nav className="flex-1 overflow-y-auto py-4">
        <p className="px-5 mb-2 text-[10px] font-bold uppercase tracking-widest text-boutique-charcoalLight/70">
          Navigation
        </p>
        <ul className="space-y-0.5 px-3">
          {NAV_ITEMS.map((item) => {
            const isActive = 
              item.path === '/dashboard/billing'
                ? pathname === '/dashboard/billing'
                : item.path === '/dashboard/billing/history'
                  ? pathname.startsWith('/dashboard/billing') && pathname !== '/dashboard/billing'
                  : pathname === item.path || pathname.startsWith(`${item.path}/`)
            return (
              <li key={item.path}>
                <Link
                  href={item.path}
                  onClick={() => setIsOpen(false)}
                  className={clsx(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 text-sm font-medium group",
                    isActive 
                      ? `${item.activeBg} ${item.color} font-semibold shadow-sm` 
                      : "text-boutique-charcoalLight hover:bg-boutique-cream hover:text-boutique-charcoal"
                  )}
                >
                  <item.icon className={clsx(
                    "w-4.5 h-4.5 flex-shrink-0 transition-colors",
                    isActive ? item.color : "text-boutique-charcoalLight group-hover:text-boutique-charcoal"
                  )} style={{ width: '1.125rem', height: '1.125rem' }} />
                  <span>{item.name}</span>
                  {isActive && (
                    <span className={clsx("ml-auto w-1.5 h-1.5 rounded-full", item.color.replace('text-', 'bg-'))} />
                  )}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      <div className="p-4 border-t border-boutique-border/60 mx-3 mb-1">
        <button 
          onClick={handleLogout}
          className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-boutique-charcoalLight transition-all hover:bg-boutique-rubyLight hover:text-boutique-ruby text-sm font-medium group"
        >
          <LogOut className="w-4 h-4 group-hover:text-boutique-ruby transition-colors" />
          Sign Out
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-white border-b border-boutique-border z-20 flex items-center px-4 shadow-sm">
        <button onClick={() => setIsOpen(true)} className="p-1 -ml-1 text-boutique-charcoal">
          <Menu className="w-6 h-6" />
        </button>
        <div className="flex items-center gap-2 ml-4">
          <div className="w-6 h-6 rounded bg-boutique-roseDark flex items-center justify-center">
            <Scissors className="w-3 h-3 text-white" />
          </div>
          <span className="font-serif text-lg font-bold tracking-wide">Sonal Boutique</span>
        </div>
      </div>

      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-30 lg:hidden" 
          onClick={() => setIsOpen(false)} 
        />
      )}

      {/* Sidebar */}
      <aside 
        className={clsx(
          "fixed inset-y-0 left-0 z-40 w-64 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:flex-shrink-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <button 
          className="lg:hidden absolute top-4 right-4 text-boutique-charcoalLight p-1 z-10"
          onClick={() => setIsOpen(false)}
        >
          <X className="w-5 h-5" />
        </button>
        <SidebarContent />
      </aside>
    </>
  )
}
