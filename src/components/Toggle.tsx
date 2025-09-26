import React from 'react'

interface ToggleProps {
  id: string
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
  disabled?: boolean
}

const Toggle: React.FC<ToggleProps> = ({
  id,
  checked,
  onChange,
  label,
  disabled = false
}) => {
  return (
    <div className="flex items-center space-x-3">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-labelledby={`${id}-label`}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`
          relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:ring-offset-2 shadow-inner
          ${checked 
            ? 'bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700' 
            : 'bg-neutral-300 hover:bg-neutral-400'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        <span
          className={`
            inline-block h-4 w-4 transform rounded-full bg-white shadow-soft transition-all duration-200 ease-in-out
            ${checked ? 'translate-x-6' : 'translate-x-1'}
          `}
        />
      </button>
      <label
        id={`${id}-label`}
        htmlFor={id}
        className={`text-sm font-medium select-none ${
          disabled ? 'text-neutral-400' : 'text-neutral-700 cursor-pointer hover:text-neutral-800'
        }`}
        onClick={() => !disabled && onChange(!checked)}
      >
        {label}
      </label>
    </div>
  )
}

export default Toggle