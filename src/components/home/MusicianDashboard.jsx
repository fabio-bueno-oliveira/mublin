import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useQuery } from '@tanstack/react-query'
import {
  Grid,
  Card,
  Paper,
  Group,
  Stack,
  Text,
  Title,
  Box,
  Popover,
  Slider,
  Button,
  Switch,
  Image,
} from '@mantine/core'
import { IconChevronRight } from '@tabler/icons-react'
import { fetchUserRecentGear } from '../../queries/user'

const PATH_GEAR_ITEM_IMG =
  'https://ik.imagekit.io/mublin/products/tr:w-70,h-70,cm-pad_resize,bg-FFFFFF,fo-x/'

export default function MusicianDashboard() {
  const { user, profile } = useAuth()

  const [goal, setGoal] = useState(10)
  const [tempGoal, setTempGoal] = useState(10)
  const [noGoal, setNoGoal] = useState(false)
  const [popoverOpened, setPopoverOpened] = useState(false)

  const currentGigs = 3
  const progress = noGoal ? 0 : Math.min((currentGigs / goal) * 100, 100)

  const handleSave = () => {
    setGoal(noGoal ? null : tempGoal)
    setPopoverOpened(false)
  }

  const handleOpen = () => {
    setTempGoal(goal || 10)
    setPopoverOpened(true)
  }

  const { data: recentGear, isLoading: loadingRecentGear } = useQuery({
    queryKey: ['user-recent-gear', user?.id],
    queryFn: () => fetchUserRecentGear(user.id),
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5,
  })

  const subtleBg = 'light-dark(rgba(0,0,0,0.01), rgba(0,0,0,0.09))'

  return (
    <Card
      radius="lg"
      withBorder
      p={{ base: 'sm', sm: 'sm' }}
      mb="md"
      mt={{ base: 2, sm: 8 }}
    >
      <Group justify="space-between" mb="sm">
        <Title order={3} fz="md" fw={600} ml={2}>
          Seu dia a dia
        </Title>
      </Group>

      <Stack gap="xs">
        <Grid gap="xs">
          <Grid.Col span={7.4}>
            <Paper
              radius="md"
              p="xs"
              h={84}
              style={{ boxShadow: 'none', background: subtleBg }}
            >
              <Text size="xs" fw={500} tt="uppercase" c="dimmed">
                Próxima gig
              </Text>
              <Group gap={6} mt={5} mb={4} wrap="nowrap">
                <Text size="sm" fw={600} lineClamp={1}>
                  Nenhuma gig próxima
                </Text>
              </Group>
              {/* <Text size="xs" c="dimmed">
                Em 4 dias • Estúdio Aurora
              </Text> */}
            </Paper>
          </Grid.Col>

          <Grid.Col span={4.6}>
            {/* CARD INTEIRO AGORA É O TARGET */}
            <Popover
              width={240}
              position="bottom-end"
              shadow="md"
              opened={popoverOpened}
              onChange={setPopoverOpened}
              withArrow
              arrowPosition="center"
            >
              <Popover.Target>
                <Card
                  radius="md"
                  p="xs"
                  h={84}
                  onClick={handleOpen}
                  style={{
                    boxShadow: 'none',
                    background: subtleBg,
                    cursor: 'pointer',
                    transition: 'transform 0.1s ease',
                  }}
                  className="musician-dashboard-goal-card"
                >
                  <Text size="xs" fw={500} tt="uppercase" c="dimmed">
                    Gigs este mês
                  </Text>
                  <Text size="sm" fw={600}>
                    {currentGigs} gigs
                  </Text>

                  {!noGoal && goal ? (
                    <Box
                      mt={3}
                      mb={6}
                      h={4}
                      bg="light-dark(var(--mantine-color-gray-2), var(--mantine-color-dark-4))"
                      style={{ borderRadius: 999 }}
                    >
                      <Box
                        w={`${progress}%`}
                        h="100%"
                        bg="teal"
                        style={{ borderRadius: 999 }}
                      />
                    </Box>
                  ) : (
                    <Box mt={3} mb={6} h={4} />
                  )}

                  <Text size="11px" c="dimmed">
                    {noGoal || !goal ? 'Definir meta' : `Meta: ${goal}`}
                  </Text>
                </Card>
              </Popover.Target>

              <Popover.Dropdown p="sm" onClick={(e) => e.stopPropagation()}>
                <Stack gap="sm">
                  <Text size="xs" fw={500}>
                    Minha meta de gigs no mês
                  </Text>
                  <Slider
                    value={tempGoal}
                    onChange={setTempGoal}
                    min={1}
                    max={20}
                    step={1}
                    disabled={noGoal}
                    marks={[
                      { value: 1, label: '1' },
                      { value: 10, label: '10' },
                      { value: 20, label: '20' },
                    ]}
                  />
                  <Group justify="space-between" mt={14}>
                    <Text size="xs" c="dimmed">
                      Sem meta
                    </Text>
                    <Switch
                      size="sm"
                      checked={noGoal}
                      onChange={(e) => setNoGoal(e.currentTarget.checked)}
                    />
                  </Group>
                  <Group gap="xs" grow>
                    <Button
                      variant="default"
                      size="xs"
                      onClick={() => setPopoverOpened(false)}
                    >
                      Cancelar
                    </Button>
                    <Button size="xs" onClick={handleSave}>
                      Salvar
                    </Button>
                  </Group>
                </Stack>
              </Popover.Dropdown>
            </Popover>
          </Grid.Col>
        </Grid>

        <Grid gutter="xs">
          {/* <Grid.Col span={6}>
            <Group
              gap={6}
              h={42}
              p={8}
              style={{ borderRadius: 8, boxShadow: 'none', background: subtleBg }}
            >
              <IconBulb size={16} opacity={0.7} />
              <Stack gap={5} style={{ flex: 1 }}>
                <Text size="11px" fw={500} lineClamp={1}>
                  Trocar cordas
                </Text>
                <Text size="10px" c="dimmed" lineClamp={1}>
                  em 2 dias
                </Text>
              </Stack>
              <IconChevronRight size={12} opacity={0.4} />
            </Group>
          </Grid.Col> */}
          <Grid.Col span={12}>
            <Group
              wrap="nowrap"
              gap={8}
              p={8}
              // style={{ borderRadius: 8, boxShadow: 'none', background: subtleBg }}
              component={Link}
              to={`/${profile?.username}`}
              style={{
                borderRadius: 8,
                boxShadow: 'none',
                background: subtleBg,
                cursor: 'pointer',
                transition: 'transform 0.1s ease',
              }}
              className="musician-dashboard-goal-card noDecoration"
            >
              {recentGear && (
                <Image
                  src={
                    recentGear?.products?.picture
                      ? PATH_GEAR_ITEM_IMG + recentGear?.products?.picture
                      : undefined
                  }
                  fit="contain"
                  h={35}
                  w={35}
                  radius="sm"
                />
              )}
              <Stack gap={1} style={{ flex: 1 }}>
                <Text size="xs" fw={500} tt="uppercase" c="dimmed" lineClamp={1}>
                  Último item adicionado
                </Text>
                {recentGear ? (
                  <Text size="xs" lineClamp={1}>
                    {loadingRecentGear
                      ? 'Carregando...'
                      : `${recentGear?.products?.name} (${recentGear?.products?.brands?.name})`}
                  </Text>
                ) : (
                  <Text size="xs" lineClamp={1}>
                    Nenhum item adicionado até o momento
                  </Text>
                )}
              </Stack>
              <IconChevronRight size={12} opacity={0.4} />
            </Group>
          </Grid.Col>
        </Grid>
      </Stack>
    </Card>
  )
}
