import { useState } from 'react'
import { AngleSlider, Box, Text, Stack, Group, Badge } from '@mantine/core'

const knobConfigs = [
  {
    id: 'gain',
    label: 'GAIN',
    min: 0,
    max: 360,
    defaultValue: 135,
    color: '#ff4d00',
    description: 'Drive',
  },
  {
    id: 'tone',
    label: 'TONE',
    min: 0,
    max: 360,
    defaultValue: 180,
    color: '#00c8ff',
    description: 'Freq',
  },
  {
    id: 'level',
    label: 'LEVEL',
    min: 0,
    max: 360,
    defaultValue: 220,
    color: '#ffe600',
    description: 'Output',
  },
]

function getKnobPercent(value) {
  return Math.round((value / 360) * 100)
}

function LEDIndicator({ active, color }) {
  return (
    <div
      style={{
        width: 10,
        height: 10,
        borderRadius: '50%',
        background: active ? color : '#333',
        boxShadow: active ? `0 0 8px 2px ${color}88` : 'none',
        transition: 'all 0.2s',
        border: '1px solid #555',
      }}
    />
  )
}

function Knob({ config, value, onChange }) {
  const percent = getKnobPercent(value)
  return (
    <Stack align="center" gap={6}>
      <Text
        size="10px"
        fw={700}
        style={{
          letterSpacing: '0.18em',
          color: '#aaa',
          fontFamily: "'Courier New', monospace",
        }}
      >
        {config.label}
      </Text>
      <Box
        style={{
          background: 'radial-gradient(circle at 38% 32%, #3a3a3a 60%, #1a1a1a 100%)',
          borderRadius: '50%',
          padding: 6,
          boxShadow: `0 4px 18px #0008, 0 0 0 2px #222, 0 0 0 4px #444`,
          border: '2px solid #555',
        }}
      >
        <AngleSlider
          value={value}
          onChange={onChange}
          size={72}
          color={config.color}
          style={{ display: 'block' }}
        />
      </Box>
      <Text
        size="11px"
        fw={800}
        style={{
          color: config.color,
          fontFamily: "'Courier New', monospace",
          letterSpacing: '0.06em',
          textShadow: `0 0 8px ${config.color}88`,
          minWidth: 32,
          textAlign: 'center',
        }}
      >
        {percent}
      </Text>
      <Text
        size="9px"
        style={{
          color: '#666',
          fontFamily: "'Courier New', monospace",
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
        }}
      >
        {config.description}
      </Text>
    </Stack>
  )
}

export default function GuitarPedal() {
  const [values, setValues] = useState(
    Object.fromEntries(knobConfigs.map((k) => [k.id, k.defaultValue])),
  )
  const [active, setActive] = useState(false)

  const handleChange = (id, val) => {
    setValues((prev) => ({ ...prev, [id]: val }))
  }

  return (
    <Box
      style={{
        minHeight: '100vh',
        background: '#111',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Courier New', monospace",
      }}
    >
      {/* Pedal body */}
      <Box
        style={{
          width: 220,
          background: 'linear-gradient(160deg, #232323 60%, #1a1a1a 100%)',
          borderRadius: 18,
          border: '3px solid #333',
          boxShadow: '0 12px 48px #000c, 0 2px 0 #555 inset, 0 -2px 0 #111 inset',
          padding: '28px 18px 20px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Top scratch plate texture */}
        <Box
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'repeating-linear-gradient(90deg, transparent, transparent 3px, #ffffff04 3px, #ffffff04 4px)',
            pointerEvents: 'none',
            borderRadius: 16,
          }}
        />

        {/* Brand strip */}
        <Box
          style={{
            background: 'linear-gradient(90deg, #ff4d00 0%, #ff8800 100%)',
            borderRadius: 4,
            marginBottom: 18,
            padding: '3px 0',
            textAlign: 'center',
          }}
        >
          <Text
            size="9px"
            fw={900}
            style={{
              color: '#fff',
              letterSpacing: '0.28em',
              textTransform: 'uppercase',
              fontFamily: "'Courier New', monospace",
            }}
          >
            Mublin FX
          </Text>
        </Box>

        {/* Model name */}
        <Text
          size="15px"
          fw={900}
          ta="center"
          style={{
            color: '#eee',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            fontFamily: "'Courier New', monospace",
            marginBottom: 4,
          }}
        >
          OVERDRIVE
        </Text>
        <Text
          size="9px"
          ta="center"
          style={{
            color: '#555',
            letterSpacing: '0.22em',
            fontFamily: "'Courier New', monospace",
            marginBottom: 22,
          }}
        >
          MBL-808
        </Text>

        {/* LED row */}
        <Group justify="center" gap={6} mb={20}>
          {knobConfigs.map((k) => (
            <LEDIndicator key={k.id} active={active} color={k.color} />
          ))}
        </Group>

        {/* Knobs */}
        <Group justify="space-around" align="flex-start" mb={22} gap={0}>
          {knobConfigs.map((k) => (
            <Knob
              key={k.id}
              config={k}
              value={values[k.id]}
              onChange={(val) => handleChange(k.id, val)}
            />
          ))}
        </Group>

        {/* Stomp switch */}
        <Box style={{ display: 'flex', justifyContent: 'center', marginBottom: 10 }}>
          <Box
            onClick={() => setActive((v) => !v)}
            style={{
              width: 58,
              height: 58,
              borderRadius: '50%',
              background: active
                ? 'radial-gradient(circle at 40% 35%, #555 60%, #222 100%)'
                : 'radial-gradient(circle at 40% 35%, #3a3a3a 60%, #181818 100%)',
              border: active ? '3px solid #ff4d00' : '3px solid #444',
              boxShadow: active
                ? '0 0 18px 4px #ff4d0044, 0 4px 12px #000a'
                : '0 4px 16px #000a, 0 2px 0 #555 inset',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s',
              userSelect: 'none',
            }}
          >
            <Box
              style={{
                width: 20,
                height: 20,
                borderRadius: '50%',
                background: active
                  ? 'radial-gradient(circle, #ff4d00 60%, #aa2200 100%)'
                  : '#222',
                boxShadow: active ? '0 0 8px #ff4d00' : 'none',
                transition: 'all 0.15s',
              }}
            />
          </Box>
        </Box>

        {/* Status badge */}
        <Group justify="center" mt={4}>
          <Badge
            size="xs"
            variant="dot"
            color={active ? 'orange' : 'dark'}
            style={{
              fontFamily: "'Courier New', monospace",
              letterSpacing: '0.12em',
              fontSize: 8,
            }}
          >
            {active ? 'ENGAGED' : 'BYPASS'}
          </Badge>
        </Group>

        {/* Input/Output labels */}
        <Group justify="space-between" mt={16} px={4}>
          <Text size="8px" style={{ color: '#444', letterSpacing: '0.14em' }}>
            INPUT
          </Text>
          <Text size="8px" style={{ color: '#444', letterSpacing: '0.14em' }}>
            OUTPUT
          </Text>
        </Group>
        <Group justify="space-between" px={8}>
          <Box
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              border: '2px solid #444',
              background: '#1a1a1a',
            }}
          />
          <Box
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              border: '2px solid #444',
              background: '#1a1a1a',
            }}
          />
        </Group>
      </Box>
    </Box>
  )
}
