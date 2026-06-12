import React, { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../hooks/useAuth'
import {
  Container,
  Stack,
  Group,
  Avatar,
  Title,
  Text,
  Box,
  Skeleton,
  Alert,
  Indicator,
  Divider,
} from '@mantine/core'
import { IconBellOff, IconCalendar, IconUserPlus } from '@tabler/icons-react'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/pt-br'

dayjs.extend(relativeTime)
dayjs.locale('pt-br')

const AVATAR_PATH =
  'https://ik.imagekit.io/mublin/tr:h-70,c-maintain_ratio/users/avatars/'

// ─── Queries ────────────────────────────────────────────────────────────────

async function fetchNotifications(userId) {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('recipient_id', userId)
    .order('created_at', { ascending: false })
    .limit(40)

  if (error) {
    throw new Error(error.message)
  }
  return data
}

async function markAllAsRead(userId) {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true, read_at: new Date().toISOString() })
    .eq('recipient_id', userId)
    .eq('read', false)

  if (error) {
    throw new Error(error.message)
  }
}

async function markOneAsRead(notificationId) {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true, read_at: new Date().toISOString() })
    .eq('id', notificationId)

  if (error) {
    throw new Error(error.message)
  }
}

// ─── Ícone por tipo ──────────────────────────────────────────────────────────

function NotificationIcon({ type }) {
  const icons = {
    new_follower: <IconUserPlus size={14} />,
    gig_invite: <IconCalendar size={14} />,
  }
  const colors = {
    new_follower: 'blue',
    gig_invite: 'violet',
  }

  return (
    <Indicator
      color={colors[type] ?? 'gray'}
      size={24}
      label={icons[type] ?? null}
      position="bottom-end"
      offset={2}
      styles={{
        indicator: {
          padding: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        },
      }}
    />
  )
}

// ─── Texto descritivo por tipo ───────────────────────────────────────────────

function notificationContent(notification) {
  const { type, metadata } = notification

  switch (type) {
    case 'new_follower':
      return {
        // Link aponta para o perfil de quem seguiu
        href: `/${metadata.follower_username}`,
        avatarSrc: metadata.follower_avatar
          ? AVATAR_PATH + metadata.follower_avatar
          : undefined,
        avatarAlt: metadata.follower_name,
        text: (
          <>
            <Text size="sm" fw={600}>
              {metadata.follower_name}
            </Text>
            <Text size="xs" c="dimmed">
              começou a seguir você
            </Text>
          </>
        ),
      }

    case 'gig_invite':
      return {
        href: `/gig/${metadata.gig_id}`,
        avatarSrc: metadata.actor_avatar
          ? AVATAR_PATH + metadata.actor_avatar
          : undefined,
        avatarAlt: metadata.actor_name,
        text: (
          <>
            <Text span fw={600} size="xs">
              {metadata.actor_name}
            </Text>
            <Text span size="xs" c="dimmed">
              {' '}
              te convidou para a gig{' '}
            </Text>
            <Text span fw={600} size="xs">
              {metadata.gig_title}
            </Text>
            {metadata.role && (
              <Text span size="xs" c="dimmed">
                {' '}
                como {metadata.role}
              </Text>
            )}
          </>
        ),
      }

    default:
      return {
        href: '/',
        avatarSrc: undefined,
        avatarAlt: '?',
        text: (
          <Text size="sm" c="dimmed">
            Nova notificação
          </Text>
        ),
      }
  }
}

// ─── Item individual ─────────────────────────────────────────────────────────

function NotificationItem({ notification, onRead }) {
  const content = notificationContent(notification)
  const isUnread = !notification.read

  function handleClick() {
    if (isUnread) {
      onRead(notification.id)
    }
  }

  return (
    <Box
      component={Link}
      to={content.href}
      onClick={handleClick}
      style={{ textDecoration: 'none', color: 'inherit' }}
    >
      <Group
        gap="xs"
        wrap="nowrap"
        align="flex-start"
        pr="xs"
        py="xs"
        style={(theme) => ({
          borderRadius: theme.radius.md,
          // backgroundColor: isUnread ? 'light-dark(#ffffff, #1c1c1c)' : 'transparent',
          transition: 'background-color 150ms ease',
          cursor: 'pointer',
          '&:hover': {
            backgroundColor: isUnread
              ? 'var(--mantine-color-blue-light-hover)'
              : 'var(--mantine-color-default-hover)',
          },
        })}
      >
        {/* Avatar com indicador de tipo */}
        <Box style={{ position: 'relative', flexShrink: 0 }}>
          <Avatar src={content.avatarSrc} alt={content.avatarAlt} size={35} radius="xl" />
          {/* <NotificationIcon type={notification.type} /> */}
        </Box>

        {/* Texto + timestamp */}
        <Stack gap={2} style={{ flex: 1, minWidth: 0 }}>
          <Box lh={1}>{content.text}</Box>
          <Text size="xs" c="dimmed">
            {dayjs(notification.created_at).fromNow()}
          </Text>
        </Stack>

        {/* Bolinha de não lido */}
        {isUnread && (
          <Box
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              backgroundColor: 'var(--mantine-color-red-8)',
              flexShrink: 0,
              marginTop: 1,
            }}
          />
        )}
      </Group>
    </Box>
  )
}

// ─── Skeletons de carregamento ───────────────────────────────────────────────

function NotificationSkeleton() {
  return (
    <Group gap="sm" wrap="nowrap" align="flex-start" px="md" py="sm">
      <Skeleton circle height={44} width={44} />
      <Stack gap={6} style={{ flex: 1 }}>
        <Skeleton height={14} width="60%" radius="xl" />
        <Skeleton height={11} width="30%" radius="xl" />
      </Stack>
    </Group>
  )
}

// ─── Componente principal ────────────────────────────────────────────────────

export default function Notifications({ limit = 40 }) {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const markAllRef = useRef(null)
  const userRef = useRef(null)

  const {
    data: notifications = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: () => fetchNotifications(user.id),
    enabled: !!user?.id,
    staleTime: 1000 * 30, // 30s — notificações mudam com frequência
  })

  // Marca todas como lidas ao montar o componente
  // (comportamento comum em apps de música/redes sociais)
  const { mutate: markAll } = useMutation({
    mutationFn: () => markAllAsRead(user.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] })
      // Invalida também o badge de contagem, se você tiver uma query separada
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] })
    },
  })

  const { mutate: markOne } = useMutation({
    mutationFn: (id) => markOneAsRead(id),
    // Atualização otimista: marca como lida na UI antes da resposta do servidor
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['notifications', user?.id] })
      const previous = queryClient.getQueryData(['notifications', user?.id])
      queryClient.setQueryData(['notifications', user?.id], (old) =>
        old.map((n) => (n.id === id ? { ...n, read: true } : n)),
      )
      return { previous }
    },
    onError: (_err, _id, context) => {
      queryClient.setQueryData(['notifications', user?.id], context.previous)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] })
    },
  })

  // const unreadCount = notifications.filter((n) => !n.read).length

  useEffect(() => {
    markAllRef.current = markAll
    userRef.current = user
  })

  useEffect(() => {
    return () => {
      const hasUnread = queryClient
        .getQueryData(['notifications', userRef.current?.id])
        ?.some((n) => !n.read)

      if (userRef.current?.id && hasUnread) {
        markAllRef.current?.()
      }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (!user) {
    return null
  }

  return (
    <Container size="xs" px={0} py="xs">
      <Title order={3} fw={600} fz="16px" mb={6}>
        Notificações
      </Title>

      <Stack gap={0}>
        {isLoading &&
          Array.from({ length: 5 }).map((_, i) => <NotificationSkeleton key={i} />)}
        {isError && (
          <Alert color="red" radius="md" mx="md">
            Erro ao carregar notificações. Tente novamente.
          </Alert>
        )}
        {!isLoading && !isError && notifications.length === 0 && (
          <Stack align="center" gap="xs" py={48}>
            <IconBellOff size={32} opacity={0.3} />
            <Text size="xs" c="dimmed">
              Nenhuma notificação por enquanto
            </Text>
          </Stack>
        )}
        {!isLoading &&
          !isError &&
          notifications.slice(0, limit).map((notification, index) => (
            <React.Fragment key={notification.id}>
              {index > 0 && <Divider />}
              <NotificationItem notification={notification} onRead={markOne} />
            </React.Fragment>
          ))}
      </Stack>
    </Container>
  )
}
