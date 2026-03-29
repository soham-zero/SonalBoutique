'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export default function AddEmployeePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [name, setName] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      })

      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error || 'Failed to add employee')
      }

      router.push('/dashboard/employees')
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <PageHeader 
        title="Add Employee" 
        description="Register a new employee for job work assignment tracking." 
      />

      <div className="bg-white rounded-xl shadow-soft border border-boutique-border p-6 md:p-8">
        <form onSubmit={handleSubmit} className="space-y-5">
           {error && (
            <div className="p-4 bg-red-50 text-red-600 rounded-md border border-red-200 text-sm">
              {error}
            </div>
           )}

           <Input 
             label="Full Name" 
             placeholder="Sonal Sharma"
             value={name}
             onChange={(e) => setName(e.target.value)}
             required
           />

           <div className="pt-4 flex justify-end gap-3 border-t border-boutique-border mt-6">
              <Button type="button" variant="ghost" onClick={() => router.back()}>Cancel</Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Adding...' : 'Add Employee'}
              </Button>
           </div>
        </form>
      </div>
    </div>
  )
}
