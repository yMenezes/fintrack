'use client'

type Props = {
  checked: boolean
  onToggle: () => void
  disabled?: boolean
}

export function PaidCheckbox({ checked, onToggle, disabled }: Props) {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors ${
        checked
          ? 'bg-emerald-500 border-emerald-500 dark:bg-emerald-600'
          : 'border-border hover:border-emerald-400'
      } ${disabled ? 'opacity-60 cursor-default' : ''}`}
    >
      {checked && (
        <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
          <path d="M1 3.5L3.5 6L8 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )}
    </button>
  )
}
