import React from 'react'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success' | 'warning' | 'info'
  size?: 'sm' | 'md' | 'lg'
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-lg text-sm font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-boutique-roseDark disabled:pointer-events-none disabled:opacity-50 select-none",
          {
            // Primary — rich rose-charcoal
            'bg-boutique-charcoal text-white hover:bg-boutique-roseDark shadow-sm hover:shadow-md active:scale-[0.98]': variant === 'primary',
            // Secondary — light rose tint
            'bg-boutique-roseLight text-boutique-charcoal hover:bg-boutique-roseDark hover:text-white shadow-sm': variant === 'secondary',
            // Outline — bordered, no fill
            'border-2 border-boutique-border bg-white/60 hover:bg-boutique-creamDark hover:border-boutique-rose text-boutique-charcoal': variant === 'outline',
            // Ghost
            'hover:bg-boutique-creamDark text-boutique-charcoalLight hover:text-boutique-charcoal': variant === 'ghost',
            // Danger — red
            'bg-boutique-ruby text-white hover:bg-red-700 shadow-sm active:scale-[0.98]': variant === 'danger',
            // Success — emerald (for add/restock actions)
            'bg-boutique-emerald text-white hover:bg-emerald-600 shadow-sm active:scale-[0.98]': variant === 'success',
            // Warning — amber (for pending/caution actions)
            'bg-boutique-amber text-white hover:bg-amber-600 shadow-sm active:scale-[0.98]': variant === 'warning',
            // Info — teal (for view/navigate actions)
            'bg-boutique-teal text-white hover:bg-teal-700 shadow-sm active:scale-[0.98]': variant === 'info',
            // Sizes
            'h-7 px-3 text-xs rounded-md': size === 'sm',
            'h-10 px-4 py-2': size === 'md',
            'h-12 px-8 text-base': size === 'lg',
          },
          className
        )}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'
