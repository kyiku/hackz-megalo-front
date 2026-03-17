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
    'bg-pink text-white',
    'shadow-[0_4px_0_0_theme(--color-pink-dark)]',
    'hover:brightness-105',
    'active:translate-y-[2px] active:shadow-[0_2px_0_0_theme(--color-pink-dark)]',
  ].join(' '),
  secondary: [
    'bg-cream border-2 border-ink text-ink',
    'shadow-[0_4px_0_0_theme(--color-ink)]',
    'hover:bg-cream-dark',
    'active:translate-y-[2px] active:shadow-[0_2px_0_0_theme(--color-ink)]',
  ].join(' '),
  ghost: ['text-ink-light', 'hover:text-ink hover:bg-cream-dark'].join(' '),
}

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-4 py-2 text-sm',
  md: 'px-6 py-3 text-base',
  lg: 'px-8 py-4 text-lg',
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
        'rounded-xl font-bold',
        'transition-all duration-100',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:translate-y-0',
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
