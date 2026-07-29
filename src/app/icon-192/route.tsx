import { ImageResponse } from 'next/og'

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
          gap: 16,
          background: '#EFF6FF',
        }}
      >
        <div style={{ width: 28, height: 60, background: '#BFDBFE', borderRadius: 8 }} />
        <div style={{ width: 28, height: 110, background: '#60A5FA', borderRadius: 8 }} />
        <div style={{ width: 28, height: 160, background: '#1D4ED8', borderRadius: 8 }} />
      </div>
    ),
    { width: 192, height: 192 },
  )
}
