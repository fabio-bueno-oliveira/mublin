import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useQuery } from '@tanstack/react-query'
import { fetchGigsCreatedByMe, fetchGigRoles } from '../../queries/gigs'
import { useAuth } from '../../hooks/useAuth'
import {
  Modal,
  Stack,
  Text,
  Textarea,
  Select,
  Button,
  Group,
  Avatar,
  Box,
  Alert,
  Divider,
} from '@mantine/core'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import { IconSend } from '@tabler/icons-react'

const AVATAR_PATH =
  'https://ik.imagekit.io/mublin/tr:h-200,c-maintain_ratio/users/avatars/'

/**
 * Modal de convite para gig.
 *
 * Props:
 *  - opened: boolean
 *  - onClose: () => void
 *  - targetProfile: { id, full_name, username, avatar, title }
 */
export default function InviteToGigModal({ opened, onClose, targetProfile }) {
  const { user } = useAuth()
  const [submitting, setSubmitting] = useState(false)
  const [selectedGigId, setSelectedGigId] = useState(null)

  const form = useForm({
    initialValues: {
      gig_id: '',
      gig_role_id: '',
      invitation_description: '',
    },
    validate: {
      gig_id: (v) => (!v ? 'Selecione uma gig' : null),
      gig_role_id: (v) => (!v ? 'Selecione o papel/função' : null),
      invitation_description: (v) =>
        !v.trim() ? 'Escreva uma mensagem de convite' : null,
    },
  })

  // Reset ao fechar
  useEffect(() => {
    if (!opened) {
      form.reset()
      setSelectedGigId(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened])

  const { data: myGigs = [], isLoading: loadingGigs } = useQuery({
    queryKey: ['my-gigs', user?.id],
    queryFn: () => fetchGigsCreatedByMe(user.id),
    enabled: !!user?.id && opened,
    staleTime: 1000 * 60 * 2,
  })

  const { data: gigRoles = [], isLoading: loadingRoles } = useQuery({
    queryKey: ['gig-roles', selectedGigId],
    queryFn: () => fetchGigRoles(selectedGigId),
    enabled: !!selectedGigId,
    staleTime: 1000 * 60 * 2,
  })

  const gigsOptions = myGigs.map((g) => ({
    value: String(g.id),
    label: g.title ?? `Gig #${g.id}`,
  }))

  const rolesOptions = gigRoles?.gig_roles?.map((r) => ({
    value: r.id,
    label: r.roles?.description_ptbr,
  }))

  async function handleSubmit(values) {
    if (!user?.id || !targetProfile?.id) {
      return
    }
    setSubmitting(true)
    try {
      const { error } = await supabase.from('gig_applications').insert([
        {
          gig_id: Number(values.gig_id),
          gig_role_id: values.gig_role_id,
          profile_id: targetProfile.id,
          invited_by: user.id,
          invitation_description: values.invitation_description.trim(),
          status_request_gig_owner: 1,
        },
      ])

      if (error) {
        throw error
      }

      notifications.show({
        title: 'Convite enviado!',
        message: `${targetProfile.full_name} receberá o seu convite em breve.`,
        color: 'green',
        position: 'top-center',
      })
      onClose()
    } catch (err) {
      notifications.show({
        title: 'Erro ao enviar convite',
        message: err.message ?? 'Tente novamente.',
        color: 'red',
      })
    } finally {
      setSubmitting(false)
    }
  }

  const noGigs = !loadingGigs && myGigs?.length === 0

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Text fw={700} size="md">
          Convidar para gig
        </Text>
      }
      radius="md"
      size="md"
      overlayProps={{ backgroundOpacity: 0.55, blur: 3 }}
    >
      {/* Cabeçalho com info do convidado */}
      <Stack gap="xs" my="sm">
        <Group gap="xs">
          <Avatar
            src={targetProfile?.avatar ? AVATAR_PATH + targetProfile.avatar : undefined}
            radius="xl"
            size={48}
          />
          <Stack gap={0}>
            <Text fw={600} size="sm">
              {targetProfile?.full_name}
            </Text>
            <Text size="xs" c="dimmed">
              @{targetProfile?.username}
            </Text>
          </Stack>
        </Group>
        {/* <Box>
          {targetProfile?.title && (
            <Text size="xs" c="dimmed" lh={1.2}>
              {targetProfile.title}
            </Text>
          )}
        </Box> */}
      </Stack>

      <Divider mb="xs" />

      {noGigs && (
        <Alert color="red" radius="md" mb="md">
          Você ainda não criou nenhuma gig. Crie uma gig antes de enviar convites.
        </Alert>
      )}

      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="sm" mb={2}>
          <Text>
            <Text span size="sm" c="dimmed">
              De:{' '}
            </Text>
            <Text span size="sm" fw={500}>
              {user?.user_metadata?.full_name ?? user?.email}
            </Text>
          </Text>

          {/* Gig */}
          <Select
            // label="Gig"
            placeholder={loadingGigs ? 'Carregando...' : 'Selecione a gig'}
            data={gigsOptions}
            disabled={loadingGigs || noGigs}
            {...form.getInputProps('gig_id')}
            onChange={(value) => {
              form.setFieldValue('gig_id', value ?? '')
              form.setFieldValue('gig_role_id', '')
              setSelectedGigId(value)
            }}
            searchable
            nothingFoundMessage="Nenhuma gig encontrada"
          />

          {/* Papel/função na gig */}
          <Select
            label="Papel / Função"
            placeholder={
              !selectedGigId
                ? 'Selecione uma gig primeiro'
                : loadingRoles
                  ? 'Carregando...'
                  : rolesOptions?.length === 0
                    ? 'Nenhum papel cadastrado nessa gig'
                    : 'Selecione o papel'
            }
            data={rolesOptions}
            disabled={!selectedGigId || loadingRoles || rolesOptions?.length === 0}
            {...form.getInputProps('gig_role_id')}
          />

          <Textarea
            label="Mensagem de convite"
            placeholder={`Escreva uma mensagem para ${targetProfile?.full_name}...`}
            minRows={2}
            autosize
            maxRows={8}
            {...form.getInputProps('invitation_description')}
          />

          <Group justify="flex-end" mt="xs">
            <Button size="sm" variant="subtle" onClick={onClose} disabled={submitting}>
              Cancelar
            </Button>
            <Button
              type="submit"
              size="sm"
              leftSection={<IconSend size={15} />}
              loading={submitting}
              disabled={noGigs}
            >
              Enviar convite
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  )
}
