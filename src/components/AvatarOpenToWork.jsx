import { Avatar } from '@mantine/core'

export default function AvatarOpenToWork({ src, size = 96, openToWork }) {
  const pad = openToWork ? 6 : 0
  return (
    <div
      style={{
        position: 'relative',
        display: 'inline-block',
        width: size + pad * 2,
        height: size + pad * 2,
      }}
    >
      <svg
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          overflow: 'visible',
        }}
        viewBox={`0 0 ${size + pad * 2} ${size + pad * 2}`}
      >
        <defs>
          <linearGradient id="otw-gradient" x1="20%" y1="100%" x2="80%" y2="0%">
            <stop offset="0%" stopColor="#bef264" />
            <stop offset="40%" stopColor="#4ade80" />
            <stop offset="100%" stopColor="#16a34a" />
          </linearGradient>
        </defs>

        {/* Arco fino — parte superior */}
        <circle
          cx={size / 2 + pad}
          cy={size / 2 + pad}
          r={size / 2 + pad - 2}
          fill="none"
          stroke="url(#otw-gradient)"
          strokeWidth={3}
          strokeLinecap="round"
          strokeDasharray="270 90"
          strokeDashoffset="30"
        />
        {/* Arco gordo — parte inferior */}
        <circle
          cx={size / 2 + pad}
          cy={size / 2 + pad}
          r={size / 2 + pad - 2}
          fill="none"
          stroke="url(#otw-gradient)"
          strokeWidth={6}
          strokeLinecap="round"
          strokeDasharray="130 260"
          strokeDashoffset="-195"
        />
      </svg>

      <Avatar
        size={size}
        src={src}
        radius="xl"
        style={{ position: 'absolute', inset: pad, borderRadius: '50%' }}
      />
      {/* {openToWork && (
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            right: 0,
            background: '#062411',
            border: '2px solid var(--mantine-color-body)',
            borderRadius: 999,
            padding: '2px 7px',
            fontSize: 9,
            fontWeight: 600,
            color: '#fff',
            letterSpacing: '0.02em',
            lineHeight: 1.5,
            whiteSpace: 'nowrap',
          }}
        >
          disponível
        </div>
      )} */}
    </div>
  )
}
