'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
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
    <div className="relative flex min-h-screen items-center justify-center bg-boutique-creamDark px-4">
      {loading && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/60 backdrop-blur-sm transition-all duration-300">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-boutique-rose border-t-transparent"></div>
          <p className="animate-pulse font-serif text-lg font-bold text-boutique-charcoal">Authenticating...</p>
        </div>
      )}

      <div className="z-10 w-full max-w-md space-y-8 rounded-xl border border-boutique-border bg-white p-8 shadow-soft">
        <div className="space-y-2 text-center">
          <h1 className="font-serif text-4xl font-bold tracking-tight text-boutique-charcoal">
            Sonal Boutique
          </h1>
          <p className="text-sm font-medium uppercase tracking-wider text-boutique-charcoalLight">
            Management Portal
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          {error && (
            <div className="animate-in shake-in-1 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-600 shadow-sm">
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
              className="w-full rounded-md border border-boutique-border px-4 py-3 text-gray-900 placeholder-gray-400 shadow-sm transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-boutique-roseLight"
              placeholder="admin@sonalboutique.com"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-boutique-charcoal" htmlFor="password">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                className="w-full rounded-md border border-boutique-border px-4 py-3 pr-12 text-gray-900 placeholder-gray-400 shadow-sm transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-boutique-roseLight"
                placeholder="Enter your password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                disabled={loading}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                aria-pressed={showPassword}
                className="absolute inset-y-0 right-0 flex items-center px-4 text-boutique-charcoalLight transition-colors hover:text-boutique-charcoal focus:outline-none focus:text-boutique-charcoal disabled:cursor-not-allowed disabled:opacity-50"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-boutique-charcoal py-3.5 text-xs font-bold uppercase tracking-widest text-white shadow-md transition-all hover:bg-boutique-charcoalLight hover:shadow-lg active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  )
}
