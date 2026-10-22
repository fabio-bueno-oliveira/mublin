import { useEffect, useState } from 'react'
import {
  Box,
  Group,
  SegmentedControl,
  Skeleton,
  Stack,
  Text,
  Tooltip,
  useMantineColorScheme,
} from '@mantine/core'
import { useReducedMotion } from '@mantine/hooks'
import SectionPanel from '../SectionPanel'

const FALLBACK_COLOR = 'var(--mantine-primary-color-filled)'

function StatRow({ label, fullLabel, value, total, color, isDark, animate }) {
  const pct = total > 0 ? Math.max((value / total) * 100, 4) : 0
  const unit = value === 1 ? 'experiência' : 'experiências'

  return (
    <Box>
      <Group justify="space-between" wrap="nowrap" gap="xs" mb={6}>
        <Tooltip label={fullLabel || label} openDelay={300} withArrow>
          <Text size="sm" fw={500} truncate style={{ minWidth: 0 }}>
            {label}
          </Text>
        </Tooltip>
        <Text size="xs" c="dimmed" style={{ flexShrink: 0 }}>
          <Text span fw={600} c={isDark ? 'gray.3' : 'gray.8'}>
            {value}
          </Text>{' '}
          {unit}
        </Text>
      </Group>

      <Box
        role="img"
        aria-label={`${fullLabel || label}: ${value} de ${total} ${unit}`}
        h={8}
        style={{
          borderRadius: 999,
          overflow: 'hidden',
          background: isDark
            ? 'var(--mantine-color-dark-5)'
            : 'var(--mantine-color-gray-2)',
        }}
      >
        <Box
          h="100%"
          style={{
            width: animate ? `${pct}%` : 0,
            borderRadius: 999,
            background: color || FALLBACK_COLOR,
            transition: 'width 600ms cubic-bezier(0.22, 1, 0.36, 1)',
          }}
        />
      </Box>
    </Box>
  )
}

export default function PortfolioGenresCard({
  name,
  loading = false,
  categories = [],
  subgenres = [],
  totalExperiences = 0,
  id = 'graph',
}) {
  const { colorScheme } = useMantineColorScheme()
  const isDark = colorScheme === 'dark'
  const reduceMotion = useReducedMotion()

  const [view, setView] = useState('categories')
  const [animate, setAnimate] = useState(false)

  // Anima a barra de 0 até o valor final ao montar e ao trocar de aba.
  useEffect(() => {
    if (reduceMotion) {
      setAnimate(true)
      return
    }
    setAnimate(false)
    const raf = requestAnimationFrame(() => setAnimate(true))
    return () => cancelAnimationFrame(raf)
  }, [view, loading, reduceMotion])

  const hasData = categories.length > 0 || subgenres.length > 0
  const items = view === 'categories' ? categories : subgenres

  const firstName = name?.split(' ')[0]
  const subtitle = totalExperiences
    ? `Estilos mais frequentes nas ${totalExperiences} experiências do portfólio${
        firstName ? ` de ${firstName}` : ''
      }`
    : 'Estilos mais frequentes no portfólio'

  return (
    <SectionPanel id={id}>
      <Text fw={600} size="18px" mb={2}>
        Estilos em que atua
      </Text>
      <Text size="xs" c="dimmed" mb="md">
        {subtitle}
      </Text>

      {loading ? (
        <Skeleton height={240} radius="md" />
      ) : !hasData ? (
        <Text size="sm" c="dimmed">
          Os estilos aparecem aqui quando o portfólio tiver projetos com gênero musical
          definido.
        </Text>
      ) : (
        <Stack gap="md">
          <SegmentedControl
            fullWidth
            size="xs"
            radius="md"
            p={0}
            value={view}
            onChange={setView}
            data={[
              { value: 'categories', label: 'Categorias' },
              { value: 'subgenres', label: 'Subgêneros' },
            ]}
          />

          {items.length > 0 ? (
            <Stack gap="sm">
              {items.map((item) => (
                <StatRow
                  key={item.id}
                  label={item.genre}
                  fullLabel={item.fullName}
                  value={item.projects}
                  total={totalExperiences}
                  color={item.color}
                  isDark={isDark}
                  animate={animate}
                />
              ))}
            </Stack>
          ) : (
            <Text size="sm" c="dimmed">
              Nenhum item nesta visão ainda.
            </Text>
          )}
        </Stack>
      )}
    </SectionPanel>
  )
}
