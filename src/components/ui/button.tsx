'use client'

import type { ButtonHTMLAttributes, ReactNode } from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'ghost'
type ButtonSize = 'sm' | 'md' | 'lg'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  readonly variant?: ButtonVariant
  readonly size?: ButtonSize
  readonly children: ReactNode
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: [
    'bg-ink text-cream',
    'shadow-[0_3px_0_0_#1a1a1a]',
    'hover:bg-ink-light',
    'active:translate-y-[2px] active:shadow-[0_1px_0_0_#1a1a1a]',
  ].join(' '),
  secondary: [
    'bg-cream border border-ink text-ink',
    'shadow-[0_3px_0_0_theme(--color-cream-dark)]',
    'hover:bg-cream-dark',
    'active:translate-y-[2px] active:shadow-[0_1px_0_0_theme(--color-cream-dark)]',
  ].join(' '),
  ghost: ['text-ink-light', 'hover:text-ink hover:bg-cream-dark'].join(' '),
}

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-4 py-2 text-xs',
  md: 'px-5 py-2.5 text-sm',
  lg: 'px-6 py-3 text-base',
}

export function Button({
  variant = 'primary',
  size = 'md',
  children,
  className = '',
  ...props
}: ButtonProps) {
  return (
    <button
      className={[
        'inline-flex items-center justify-center',
        'rounded-sm font-bold tracking-wide',
        'transition-all duration-75',
        'disabled:opacity-40 disabled:cursor-not-allowed disabled:translate-y-0',
        variantStyles[variant],
        sizeStyles[size],
        className,
      ].join(' ')}
      {...props}
    >
      {children}
    </button>
  )
}
