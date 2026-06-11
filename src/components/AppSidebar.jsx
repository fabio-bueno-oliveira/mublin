import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import {
  useComputedColorScheme,
  Stack,
  Box,
  Group,
  Indicator,
  Text,
  Avatar,
  Card,
  Anchor,
  Skeleton,
} from '@mantine/core'
import ProPlanBadge from './ProPlanBadge'
import { IconRosetteDiscountCheckFilled } from '@tabler/icons-react'
import { Calendar } from '@mantine/dates'
import dayjs from 'dayjs'

const AVATAR_PATH =
  'https://ik.imagekit.io/mublin/tr:h-96,c-maintain_ratio/users/avatars/'

export default function AppSidebar() {
  const { profile, loading } = useAuth()
  const computedColorScheme = useComputedColorScheme('light')
  const isDark = computedColorScheme === 'dark'
  const today = dayjs().startOf('day')
  const [selectedDate, setSelectedDate] = useState(dayjs().format('YYYY-MM-DD'))

  const handleDayClick = (date) => {
    setSelectedDate(date)
    // fetchEventsByDate(date)
    // navigate(`/agenda?date=${date}`);
  }

  const gigDates = [
    { id: 123, date: '2026-06-29', title: 'Teste' },
    { id: 125, date: '2026-06-30', title: 'Teste 2' },
  ]

  return (
    <Box px="sm" py="md" h="100%">
      {loading ? (
        <Card withBorder={false} shadow="xs" radius="md" p="md" mt={4} mb="md">
          <Skeleton height={48} circle mb="sm" />
          <Skeleton width={160} height={20} radius="md" mb="xs" />
          <Skeleton width={120} height={16} radius="md" mb="xs" />
          <Skeleton width={136} height={12} radius="md" />
        </Card>
      ) : (
        <>
          <Card
            withBorder={false}
            shadow="xs"
            radius="md"
            p={0}
            mt={4}
            mb={20}
            style={{ overflow: 'hidden' }}
            pos="relative"
          >
            {/* Cover */}
            <Card.Section
              h={52}
              withBorder
              style={{
                border: isDark
                  ? '1px solid var(--mantine-color-dark-9)'
                  : '1px solid var(--mantine-color-gray-2)',
                background: isDark
                  ? 'var(--mantine-color-dark-9)'
                  : 'var(--mantine-color-gray-0)',
              }}
            />

            {/* Avatar sobre a cover */}
            <Box px="sm" pb="sm">
              <Box mt={-24} mb={5}>
                <Avatar
                  size={48}
                  radius="xl"
                  src={profile?.avatar ? AVATAR_PATH + profile?.avatar : undefined}
                  component={Link}
                  to={`/${profile?.username}`}
                  style={{
                    border: '2px solid var(--mantine-color-body)',
                  }}
                />
              </Box>
              <Stack gap={1}>
                <Group gap={4} align="center">
                  <Anchor
                    component={Link}
                    to={`/${profile?.username}`}
                    underline="hover"
                    c="var(--mantine-color-text)"
                    fw={600}
                    size="lg"
                    maw={180}
                    lineClamp={1}
                    truncate="end"
                  >
                    {profile?.full_name}
                  </Anchor>
                  {!!profile?.is_verified && (
                    <IconRosetteDiscountCheckFilled
                      className="iconVerified small"
                      title="Perfil verificado"
                    />
                  )}
                </Group>
                <Group gap={4} align="center">
                  <Text size="xs" opacity={0.7} fw={400} lineClamp={1} lh={1}>
                    @{profile?.username}
                  </Text>
                  {profile?.plan === 'Pro' && <ProPlanBadge small />}
                </Group>
                {profile?.title && (
                  <Text size="13px" lh={1.3} mt={4} c="dimmed" lineClamp={2}>
                    {profile.title}
                  </Text>
                )}
              </Stack>
            </Box>
          </Card>
          <Calendar
            fullWidth
            getDayProps={(date) => {
              const isToday = dayjs(date).isSame(today, 'date')
              const isSelected = selectedDate
                ? dayjs(date).isSame(selectedDate, 'date')
                : false

              return {
                selected: isSelected,
                onClick: () => handleDayClick(date),
                style:
                  isToday && !isSelected
                    ? {
                        border: '2px solid rgba(126, 126, 126, 0.5)',
                        borderRadius: 'var(--mantine-radius-sm)',
                        fontWeight: 700,
                        color: 'var(--mantine-color-text)',
                      }
                    : undefined,
              }
            }}
            renderDay={(date) => {
              const hasGig = gigDates.some((gig) => dayjs(date).isSame(gig.date, 'date'))

              return (
                <Indicator size={6} color="red" offset={-2} disabled={!hasGig}>
                  <span>{dayjs(date).date()}</span>
                </Indicator>
              )
            }}
          />
          <Text fw={600} size="md" mt="md" mb={4}>
            {selectedDate
              ? `Gigs em ${dayjs(selectedDate).format('DD/MM/YYYY')}`
              : 'Selecione uma data'}
            :
          </Text>
          <Text size="sm" c="dimmed">
            Nenhuma gig nesta data
          </Text>
        </>
      )}
    </Box>
  )
}
