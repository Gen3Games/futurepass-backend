import { cn } from '@futureverse/component-library'
import React from 'react'

type RoundedButtonProps = {
  id?: string
  children: React.ReactNode
  variant?: 'contained' | 'outlined' | 'no-border'
  disabled?: boolean
  className?: string
  onClick?: () => void
}

const RoundedButton: React.FC<RoundedButtonProps> = ({
  id = 'rounded-button',
  onClick,
  children,
  variant = 'contained',
  disabled = false,
  className = 'rounded-button',
}) => {
  return (
    <button
      id={id}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        className,
        `py-[7px] px-[20px] rounded-full font-ObjektivMk1Medium text-fontSmall font-bold transition-colors duration-300 ease-in-out`,
        {
          'enabled:bg-white enabled:text-black enabled:hover:bg-black enabled:hover:text-white disabled:border-transparent disabled:text-colorQuaternary border border-white ':
            variant === 'contained',
        },
        {
          'enabled:text-white enabled:hover:bg-white enabled:hover:text-black border border-white':
            variant === 'outlined',
        },
        {
          ' enabled:text-white  enabled:hover:text-colorPrimary border border-none enabled:hover:bg-colorTertiary':
            variant === 'no-border',
        }
      )}
    >
      {children}
    </button>
  )
}

export default RoundedButton
