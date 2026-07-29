import { ImageResponse } from 'next/og'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
          gap: 14,
          background: '#EFF6FF',
        }}
      >
        <div style={{ width: 26, height: 55, background: '#BFDBFE', borderRadius: 7 }} />
        <div style={{ width: 26, height: 100, background: '#60A5FA', borderRadius: 7 }} />
        <div style={{ width: 26, height: 145, background: '#1D4ED8', borderRadius: 7 }} />
      </div>
    ),
    { ...size },
  )
}
