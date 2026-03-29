'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to login')
      }

      router.push('/dashboard/billing')
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-boutique-creamDark px-4 relative">
      {loading && (
        <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-50 flex flex-col items-center justify-center transition-all duration-300">
          <div className="w-12 h-12 border-4 border-boutique-rose border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="font-serif text-lg font-bold text-boutique-charcoal animate-pulse">Authenticating...</p>
        </div>
      )}

      <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-soft border border-boutique-border space-y-8 z-10">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-serif font-bold text-boutique-charcoal tracking-tight">
            Sonal Boutique
          </h1>
          <p className="text-sm font-medium text-boutique-charcoalLight uppercase tracking-wider">
            Management Portal
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          {error && (
            <div className="p-4 bg-red-50 text-red-600 text-sm rounded-md border border-red-200 shadow-sm animate-in shake-in-1">
              {error}
            </div>
          )}
          
          <div className="space-y-2">
            <label className="text-sm font-bold text-boutique-charcoal" htmlFor="email">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              className="w-full px-4 py-3 border border-boutique-border rounded-md text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-boutique-roseLight focus:border-transparent transition-all shadow-sm"
              placeholder="admin@sonalboutique.com"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-boutique-charcoal" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              className="w-full px-4 py-3 border border-boutique-border rounded-md text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-boutique-roseLight focus:border-transparent transition-all shadow-sm"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-boutique-charcoal text-white py-3.5 rounded-md hover:bg-boutique-charcoalLight transition-all font-bold uppercase tracking-widest text-xs disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg active:scale-[0.98]"
          >
            {loading ? 'Authenticating...' : 'Sign In Now'}
          </button>
        </form>
      </div>
    </div>
  )
}