import React, { useState } from 'react'
import { Lock, X, AlertTriangle, ShieldCheck } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

interface PasswordModalProps {
  onConfirm: (password: string) => void
  onClose: () => void
  loading?: boolean
  externalError?: string
  title?: string
  subtitle?: string
}

export function PasswordModal({
  onConfirm,
  onClose,
  loading = false,
  externalError = '',
  title = 'Confirm Action',
  subtitle = 'Password required to save changes'
}: PasswordModalProps) {
  const [password, setPassword] = useState('')
  const [localError, setLocalError] = useState('')

  const displayError = externalError || localError

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!password.trim()) {
      setLocalError('Password is required.')
      return
    }
    setLocalError('')
    onConfirm(password)
  }

  return (
    <div
      className="fixed inset-0 bg-black/55 z-50 flex items-center justify-center p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white rounded-2xl shadow-card-hover border border-boutique-border w-full max-w-sm overflow-hidden animate-modal-in">
        <div className="px-5 py-4 bg-amber-50/80 border-b border-amber-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-amber-600" />
            <div>
              <h3 className="font-serif font-bold text-boutique-charcoal leading-tight">{title}</h3>
              <p className="text-[11px] text-amber-800 uppercase tracking-wider font-semibold">{subtitle}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-black/10 transition-colors">
            <X className="w-5 h-5 text-boutique-charcoalLight" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {displayError && (
            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg flex gap-2 items-center border border-red-200">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{displayError}</span>
            </div>
          )}
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={e => { setPassword(e.target.value); setLocalError('') }}
            placeholder="Enter password"
            autoFocus
            required
          />
          <div className="flex gap-2 pt-1">
            <Button type="button" variant="ghost" onClick={onClose} className="flex-1">Cancel</Button>
            <Button type="submit" variant="primary" className="flex-1" disabled={loading}>
              <ShieldCheck className="w-4 h-4 mr-1.5" />
              {loading ? 'Verifying...' : 'Confirm'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
