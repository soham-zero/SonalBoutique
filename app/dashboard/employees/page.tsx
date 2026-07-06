'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Plus, Trash2, Search, Eye } from 'lucide-react'

type Employee = { id: string; name: string }

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [offset, setOffset] = useState(0)
  const LIMIT = 10

  const fetchEmployees = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/employees')
      if (res.ok) {
        const data = await res.json()
        setEmployees(data.employees || [])
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEmployees()
  }, [])

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this employee?")) return
    
    try {
      const res = await fetch(`/api/employees/${id}`, { method: 'DELETE' })
      const data = await res.json()
      
      if (!res.ok) {
         throw new Error(data.error || 'Failed to delete')
      }
      
      fetchEmployees()
    } catch (e: any) {
      alert(e.message)
    }
  }

  const filteredEmployees = employees.filter(e => 
    e.name.toLowerCase().startsWith(search.toLowerCase())
  )

  const visibleEmployees = filteredEmployees.slice(0, offset + LIMIT)
  const hasMore = filteredEmployees.length > visibleEmployees.length

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <PageHeader 
        title="Employees &amp; Staff" 
        description="Manage tailoring personnel, check stages completed, and track logs."
        action={
          <Link href="/dashboard/employees/add">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Employee
            </Button>
          </Link>
        }
      />

      <div className="bg-white rounded-xl shadow-soft border border-boutique-border overflow-hidden">
        <div className="p-4 border-b border-boutique-border flex items-center justify-between gap-4">
          <div className="w-full max-w-md relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-boutique-charcoalLight" />
            <Input 
              placeholder="Search employee by name..."
              className="pl-9"
              value={search}
              onChange={e => {
                setSearch(e.target.value)
                setOffset(0)
              }}
            />
          </div>
          <span className="text-xs text-boutique-charcoalLight font-medium">
             Total: {filteredEmployees.length} employee{filteredEmployees.length !== 1 ? 's' : ''}
          </span>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center text-boutique-charcoalLight animate-pulse-soft">Loading employees...</div>
          ) : visibleEmployees.length === 0 ? (
            <div className="p-8 text-center text-boutique-charcoalLight">No employees found.</div>
          ) : (
            <>
            <table className="w-full text-left text-sm">
              <thead className="bg-boutique-creamDark/50 text-boutique-charcoal font-medium border-b border-boutique-border">
                <tr>
                  <th className="px-6 py-4 text-xs uppercase tracking-wider text-boutique-charcoalLight font-semibold">Name</th>
                  <th className="px-6 py-4 text-xs uppercase tracking-wider text-boutique-charcoalLight font-semibold text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-boutique-border">
                {visibleEmployees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-boutique-cream/30 transition-colors">
                    <td className="px-6 py-4 font-medium text-boutique-charcoal">
                       <Link href={`/dashboard/employees/${emp.id}`} className="hover:underline text-boutique-indigo font-semibold">
                         {emp.name}
                       </Link>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Link href={`/dashboard/employees/${emp.id}`}>
                          <Button variant="ghost" size="sm" className="text-boutique-charcoalLight hover:text-boutique-indigo gap-1">
                            <Eye className="w-4 h-4" />
                            View Contributions
                          </Button>
                        </Link>
                        <Button variant="danger" size="sm" onClick={() => handleDelete(emp.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {hasMore && (
              <div className="p-4 text-center border-t border-boutique-border bg-gray-50/50">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setOffset(prev => prev + LIMIT)}
                  className="min-w-[120px]"
                >
                  Load More
                </Button>
              </div>
            )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
