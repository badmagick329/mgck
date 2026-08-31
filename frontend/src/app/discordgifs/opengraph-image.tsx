import { ImageResponse } from 'next/og';

export const alt = 'Discord GIF Maker — Emoji, Sticker, and Avatar';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        alignItems: 'center',
        background: '#080808',
        color: '#f8fafc',
        display: 'flex',
        height: '100%',
        justifyContent: 'center',
        padding: '64px',
        width: '100%',
      }}
    >
      <div
        style={{
          alignItems: 'center',
          border: '4px solid #f97316',
          borderRadius: '28px',
          boxShadow: '0 0 30px rgba(249, 115, 22, 0.75)',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          justifyContent: 'center',
          padding: '60px',
          textAlign: 'center',
          width: '100%',
        }}
      >
        <div style={{ fontSize: 76, fontWeight: 700 }}>Discord GIF Maker</div>
        <div
          style={{
            color: '#fb923c',
            fontSize: 38,
            marginTop: '24px',
          }}
        >
          Emoji · Sticker · Avatar
        </div>
        <div
          style={{
            color: '#cbd5e1',
            fontSize: 28,
            marginTop: '34px',
          }}
        >
          Convert clips into Discord-ready animated files
        </div>
      </div>
    </div>,
    size
  );
}
