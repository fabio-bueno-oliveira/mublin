import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Flex,
  Card,
  Group,
  Title,
  Text,
  Avatar,
  Skeleton,
  Image,
  Box,
} from '@mantine/core'
import { useScroller } from '@mantine/hooks'
import { fetchUpcomingEvents } from '../queries/events'
import { isEventHappeningNow } from '../utils/dates'
import dayjs from 'dayjs'

const EVENTS_IMG_PATH = `https://ik.imagekit.io/mublin/tr:h-320,c-maintain_ratio/events/`
const AVATAR_PATH = `https://ik.imagekit.io/mublin/tr:h-80,c-maintain_ratio/users/avatars/`

export default function UpcomingEvents() {
  const { data: globalEvents = [], isLoading: loadingGlobalEvents } = useQuery({
    queryKey: ['events', 'upcoming'],
    queryFn: () => fetchUpcomingEvents(10),
    staleTime: 1000 * 60 * 1,
    refetchInterval: 1000 * 60 * 2,
  })

  const eventsScroller = useScroller()

  return (
    <Box>
      {globalEvents?.length > 0 && (
        <>
          <Group justify="space-between" align="center" mt="lg" mb="xs">
            <Title order={3} fw={600} fz="lg">
              Eventos próximos
            </Title>
            {globalEvents?.length > 2 && (
              <Group>
                <ThemeIcon
                  variant="default"
                  onClick={eventsScroller.scrollStart}
                  opacity={eventsScroller.canScrollStart ? 1 : 0.5}
                >
                  <IconChevronLeft style={{ width: '70%', height: '70%' }} />
                </ThemeIcon>
                <ThemeIcon
                  variant="default"
                  onClick={eventsScroller.scrollEnd}
                  opacity={eventsScroller.canScrollEnd ? 1 : 0.5}
                >
                  <IconChevronRight style={{ width: '70%', height: '70%' }} />
                </ThemeIcon>
              </Group>
            )}
          </Group>

          {loadingGlobalEvents ? (
            <Group wrap="nowrap" gap="md">
              {[1, 2].map((i) => (
                <Skeleton key={i} width={160} height={240} />
              ))}
            </Group>
          ) : (
            <Box>
              <div
                ref={eventsScroller.ref}
                {...eventsScroller.dragHandlers}
                className="scrollerHidden"
                style={{
                  overflow: 'auto',
                  cursor: eventsScroller.isDragging ? 'grabbing' : 'default',
                }}
              >
                <Group wrap="nowrap" gap="md">
                  {globalEvents.map((event) => (
                    <Link
                      key={event.id}
                      to={`/event/${event.slug}`}
                      style={{ textDecoration: 'none', color: 'inherit' }}
                    >
                      <Card
                        p="xs"
                        w={160}
                        h={280}
                        shadow="sm"
                        padding="lg"
                        withBorder
                        style={{ position: 'relative' }}
                      >
                        <Card.Section style={{ position: 'relative' }}>
                          <Image
                            src={EVENTS_IMG_PATH + event.picture_url}
                            height={160}
                            alt={event.name}
                          />
                          <Box
                            style={{
                              position: 'absolute',
                              top: 16,
                              right: 16,
                              backgroundColor: 'rgba(0, 0, 0, 0.75)',
                              borderRadius: 6,
                              padding: '4px 6px',
                              textAlign: 'center',
                              lineHeight: 1.1,
                            }}
                          >
                            <Text size="sm" fw={700} c="white" ta="center">
                              {dayjs(event.date_start).format('DD')}
                            </Text>
                            <Text
                              size="9px"
                              fw={600}
                              c="white"
                              ta="center"
                              tt="uppercase"
                            >
                              {dayjs(event.date_start).locale('pt-br').format('MMM')}
                            </Text>
                          </Box>
                          {isEventHappeningNow(event) && (
                            <Group
                              gap={4}
                              pos="absolute"
                              style={{
                                bottom: 8,
                                right: 16,
                                backgroundColor: 'rgba(0, 0, 0, 0.75)',
                                borderRadius: 6,
                                padding: '5px 5px',
                              }}
                            >
                              <Box
                                component="span"
                                className="live-dot green"
                                style={{ flexShrink: 0 }}
                              />
                              <Text
                                size="10px"
                                c="white"
                                ta="center"
                                tt="uppercase"
                                lh={1}
                              >
                                Rolando agora
                              </Text>
                            </Group>
                          )}
                        </Card.Section>
                        <Text fw={600} fz="sm" mt="xs" mb={5} lineClamp={1}>
                          {event.name}
                        </Text>
                        <Text size="10px" mb={8}>
                          {dayjs(event.date_start).format('DD/MM/YYYY')} {' a '}
                          {dayjs(event.date_end).format('DD/MM/YYYY')}
                        </Text>
                        <Text lineClamp={2} size="xs" c="dimmed">
                          {event.description}
                        </Text>
                        <Flex gap={6} align="center" mt={6}>
                          <Text size="10px" span c="dimmed">
                            Criado por
                          </Text>
                          <Avatar
                            src={AVATAR_PATH + event.author?.avatar}
                            size={20}
                            title={event.author?.full_name}
                          />
                          <Text size="10px" span lineClamp={1}>
                            {event.author?.username}
                          </Text>
                        </Flex>
                      </Card>
                    </Link>
                  ))}
                </Group>
              </div>
            </Box>
          )}
        </>
      )}
    </Box>
  )
}
