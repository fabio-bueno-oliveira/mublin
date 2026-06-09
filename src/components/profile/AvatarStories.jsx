import { Avatar } from '@mantine/core'

export default function AvatarStories({ src, size = 96, active = false }) {
  return (
    <div
      style={{
        position: 'relative',
        width: size,
        height: size,
        flexShrink: 0,
      }}
    >
      {active && (
        <div
          style={{
            position: 'absolute',
            inset: -5 /* espessura da borda */,
            borderRadius: '50%',
            background:
              'conic-gradient(from 200deg, #bef264, #4ade80 40%, #16a34a 70%, #4ade80 85%, #bef264)',
            zIndex: 0,
          }}
        />
      )}
      {active && (
        <div
          style={{
            position: 'absolute',
            inset: -2 /* gap entre borda e foto */,
            borderRadius: '50%',
            background: 'var(--mantine-color-body)',
            zIndex: 1,
          }}
        />
      )}
      <Avatar
        size={size}
        // radius="xl"
        src={src}
        style={{ position: 'relative', zIndex: 2 }}
      />
    </div>
  )
}
