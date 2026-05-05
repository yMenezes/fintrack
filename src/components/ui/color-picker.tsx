'use client'

import { useState } from 'react'
import { Label } from '@/components/ui/label'

const PRESET_COLORS = [
  { label: 'Roxo',   value: '#820ad1' },
  { label: 'Índigo', value: '#4338ca' },
  { label: 'Azul',   value: '#003d82' },
  { label: 'Ciano',  value: '#0891b2' },
  { label: 'Verde',  value: '#0f6e56' },
  { label: 'Lima',   value: '#3b6d11' },
  { label: 'Âmbar',  value: '#854f0b' },
  { label: 'Coral',  value: '#993c1d' },
  { label: 'Rosa',   value: '#993556' },
  { label: 'Cinza',  value: '#444441' },
]

type Props = {
  value:    string
  onChange: (color: string) => void
  label?:   string
}

export function ColorPicker({ value, onChange, label = 'Cor' }: Props) {
  const [localColor, setLocalColor] = useState(value)

  function handlePresetClick(color: string) {
    setLocalColor(color)
    onChange(color)
  }

  // Check if localColor is a custom color (not in presets)
  const isCustom = !PRESET_COLORS.some(c => c.value.toLowerCase() === localColor.toLowerCase())

  return (
    <div className="flex flex-col gap-1.5">
      <Label>{label}</Label>

      <div className="flex flex-wrap gap-2">
        {PRESET_COLORS.map(c => (
          <button
            key={c.value}
            type="button"
            onClick={() => handlePresetClick(c.value)}
            className="h-7 w-7 rounded-full transition-transform hover:scale-110"
            style={{
              background:    c.value,
              outline:       value === c.value ? `2px solid ${c.value}` : 'none',
              outlineOffset: '2px',
            }}
            title={c.label}
          />
        ))}

        <div className="w-px self-stretch bg-border" />

        <div className="relative h-7 w-7">
          <input
            type="color"
            value={localColor}
            onChange={e => setLocalColor(e.target.value)}
            onBlur={e => onChange(e.target.value)}
            className="absolute inset-0 opacity-0 cursor-pointer"
            title="Cor personalizada"
          />
          <button
            type="button"
            className="absolute inset-0 rounded-full border border-border transition-transform hover:scale-110"
            style={{
              background: isCustom 
                ? localColor
                : 'conic-gradient(from 0deg, red, yellow, lime, cyan, blue, magenta, red)',
              outline: value === localColor ? `2px solid ${localColor}` : 'none',
              outlineOffset: '2px',
            }}
            title="Cor personalizada"
            onClick={e => {
              e.preventDefault()
              e.currentTarget.parentElement?.querySelector('input[type="color"]')?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
            }}
          />
        </div>
      </div>

      {/* <div className="flex items-center gap-2 mt-0.5">
        <div className="h-4 w-4 rounded-full border border-border" style={{ background: localColor }} />
        <span className="text-xs text-muted-foreground font-mono">{localColor}</span>
      </div> */}
    </div>
  )
}