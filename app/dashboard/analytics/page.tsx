'use client'

import { PageHeader } from '@/components/ui/PageHeader'
import { LineChart } from 'lucide-react'

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <PageHeader 
        title="Analytics & Reports" 
        description="Comprehensive insights into your boutique performance."
      />

      <div className="bg-white rounded-xl shadow-soft border border-boutique-border p-12 flex flex-col items-center justify-center min-h-[400px] text-center">
        <div className="w-20 h-20 bg-boutique-creamDark rounded-full flex items-center justify-center mb-6">
          <LineChart className="w-10 h-10 text-boutique-charcoalLight animate-pulse" />
        </div>
        <h2 className="text-3xl font-serif font-bold text-boutique-charcoal mb-4">Coming Soon</h2>
        <p className="text-boutique-charcoalLight max-w-md mx-auto leading-relaxed">
          We are currently working on building a powerful analytics dashboard to help you track your sales, expenses, and growth trends with precision.
        </p>
        
        <div className="mt-8 flex gap-3">
          <div className="w-2 h-2 rounded-full bg-boutique-rose animate-bounce" style={{ animationDelay: '0s' }}></div>
          <div className="w-2 h-2 rounded-full bg-boutique-rose animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          <div className="w-2 h-2 rounded-full bg-boutique-rose animate-bounce" style={{ animationDelay: '0.4s' }}></div>
        </div>
      </div>
    </div>
  )
}
