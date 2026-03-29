'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { Plus, Trash2 } from 'lucide-react'

type Employee = { id: number; name: string }

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)

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

  const handleDelete = async (id: number) => {
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

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <PageHeader 
        title="Employees" 
        description="Manage the boutique staff handling job work stages."
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
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center text-boutique-charcoalLight">Loading employees...</div>
          ) : employees.length === 0 ? (
            <div className="p-8 text-center text-boutique-charcoalLight">No employees configured.</div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-boutique-creamDark/50 text-boutique-charcoal font-medium border-b border-boutique-border">
                <tr>
                  <th className="px-6 py-4">ID</th>
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-boutique-border">
                {employees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-boutique-cream transition-colors">
                    <td className="px-6 py-4 text-boutique-charcoalLight font-mono">#{emp.id}</td>
                    <td className="px-6 py-4 font-medium text-boutique-charcoal">{emp.name}</td>
                    <td className="px-6 py-4 text-center">
                      <Button variant="danger" size="sm" onClick={() => handleDelete(emp.id)}>
                        <Trash2 className="w-4 h-4 mr-1" />
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
