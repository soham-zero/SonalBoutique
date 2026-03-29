'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { 
  Receipt, 
  Package, 
  Scissors, 
  Box, 
  Users, 
  CreditCard, 
  UserSquare2, 
  UsersRound, 
  LineChart, 
  LogOut,
  Menu,
  X
} from 'lucide-react'
import clsx from 'clsx'

const NAV_ITEMS = [
  { name: 'Billing', path: '/dashboard/billing', icon: Receipt },
  { name: 'Inventory', path: '/dashboard/inventory', icon: Package },
  { name: 'Job Work', path: '/dashboard/jobwork', icon: Scissors },
  { name: 'Customers', path: '/dashboard/customers', icon: Users },
  { name: 'Expenses', path: '/dashboard/expenses', icon: CreditCard },
  { name: 'Employees', path: '/dashboard/employees', icon: UserSquare2 },
  { name: 'Bishi', path: '/dashboard/bishi', icon: UsersRound },
  { name: 'Analytics', path: '/dashboard/analytics', icon: LineChart },
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
    <div className="flex flex-col h-full bg-boutique-creamDark shadow-soft">
      <div className="p-6">
        <h1 className="font-serif text-2xl tracking-wide text-boutique-charcoal font-bold">
          Sonal Boutique
        </h1>
      </div>
      
      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-3">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.path || pathname.startsWith(`${item.path}/`)
            return (
              <li key={item.path}>
                <Link
                  href={item.path}
                  onClick={() => setIsOpen(false)}
                  className={clsx(
                    "flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors text-sm font-medium",
                    isActive 
                      ? "bg-boutique-roseLight text-boutique-charcoal" 
                      : "text-boutique-charcoalLight hover:bg-white hover:text-boutique-charcoal"
                  )}
                >
                  <item.icon className="w-5 h-5 opacity-80" />
                  {item.name}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      <div className="p-4 border-t border-boutique-border">
        <button 
          onClick={handleLogout}
          className="flex w-full items-center gap-3 px-3 py-2.5 rounded-md text-boutique-charcoalLight transition-colors hover:bg-white hover:text-red-600 text-sm font-medium"
        >
          <LogOut className="w-5 h-5 opacity-80" />
          Sign Out
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile top bar to toggle sidebar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-boutique-creamDark border-b border-boutique-border z-20 flex items-center px-4 shadow-sm">
        <button onClick={() => setIsOpen(true)} className="p-1 -ml-1 text-boutique-charcoal">
          <Menu className="w-6 h-6" />
        </button>
        <span className="font-serif text-xl font-bold ml-4 tracking-wide">Sonal Boutique</span>
      </div>

      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/40 z-30 lg:hidden transition-opacity" 
          onClick={() => setIsOpen(false)} 
        />
      )}

      {/* Sidebar - Desktop fixed, Mobile drawer */}
      <aside 
        className={clsx(
          "fixed inset-y-0 left-0 z-40 w-64 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:flex-shrink-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Mobile close button inside drawer */}
        <button 
          className="lg:hidden absolute top-4 right-4 text-boutique-charcoalLight p-1"
          onClick={() => setIsOpen(false)}
        >
          <X className="w-6 h-6" />
        </button>
        <SidebarContent />
      </aside>
    </>
  )
}
