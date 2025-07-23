import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface ContentWrapperProps {
  children: ReactNode
  className?: string
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
  maxWidth?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl' | '6xl' | 'full'
}

const paddingClasses = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
  xl: 'p-12'
}

const maxWidthClasses = {
  none: '',
  sm: 'max-w-sm',
  md: 'max-w-md', 
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '4xl': 'max-w-4xl',
  '6xl': 'max-w-6xl',
  full: 'max-w-full'
}

export function ContentWrapper({ 
  children, 
  className, 
  padding = 'md',
  maxWidth = '6xl'
}: ContentWrapperProps) {
  return (
    <div className={cn(
      'mx-auto w-full',
      paddingClasses[padding],
      maxWidthClasses[maxWidth],
      className
    )}>
      {children}
    </div>
  )
}

interface SectionProps {
  children: ReactNode
  title?: string
  subtitle?: string
  className?: string
  headerActions?: ReactNode
}

export function Section({ children, title, subtitle, className, headerActions }: SectionProps) {
  return (
    <section className={cn('space-y-6', className)}>
      {(title || subtitle || headerActions) && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            {title && (
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {subtitle}
              </p>
            )}
          </div>
          {headerActions && (
            <div className="flex-shrink-0">
              {headerActions}
            </div>
          )}
        </div>
      )}
      {children}
    </section>
  )
}
