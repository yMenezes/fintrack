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
          gap: 42,
          background: '#EFF6FF',
        }}
      >
        <div style={{ width: 74, height: 160, background: '#BFDBFE', borderRadius: 20 }} />
        <div style={{ width: 74, height: 290, background: '#60A5FA', borderRadius: 20 }} />
        <div style={{ width: 74, height: 425, background: '#1D4ED8', borderRadius: 20 }} />
      </div>
    ),
    { width: 512, height: 512 },
  )
}
