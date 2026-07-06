import React from 'react'

interface PageHeaderProps {
  title: string
  titleBadge?: React.ReactNode
  description?: string
  action?: React.ReactNode
}

export function PageHeader({ title, titleBadge, description, action }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
      <div>
        <h1 className="text-3xl font-serif font-bold text-boutique-charcoal flex items-center gap-3">
          {title}
          {titleBadge}
        </h1>
        {description && (
          <p className="text-sm text-boutique-charcoalLight mt-1">{description}</p>
        )}
      </div>
      {action && (
        <div className="flex-shrink-0">
          {action}
        </div>
      )}
    </div>
  )
}

