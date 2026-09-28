import { useEffect } from 'react'
import { createProjectTrack } from '../../../queries/discography'
import { useQueryClient, useMutation } from '@tanstack/react-query'
import { useForm } from '@mantine/form'
import {
  Stack,
  Button,
  Group,
  Text,
  TextInput,
  NumberInput,
  Checkbox,
  Select,
  Switch,
  Divider,
} from '@mantine/core'
import { IconMusic, IconBrandSpotify, IconBrandYoutube } from '@tabler/icons-react'

export default function TrackForm({
  projectId,
  userId,
  albums = [],
  track = null,
  onSuccess,
  onCancel,
}) {
  const queryClient = useQueryClient()

  const isEditing = !!track

  const form = useForm({
    mode: 'uncontrolled',

    initialValues: {
      title: track?.title ?? '',
      albumId: track?.album?.id ? String(track.album.id) : '',
      trackNumber: track?.track_number ?? null,
      releaseYear: track?.release_year ?? null,
      bpm: track?.bpm ?? null,
      isInstrumental: track?.is_instrumental ?? false,
      isPublic: track?.is_public ?? true,
      spotifyId: track?.spotify_id ?? '',
      youtubePath: track?.youtube_path ?? '',
    },

    validate: {
      title: (value) => {
        const title = value?.trim()

        if (!title) {
          return 'Informe o título da faixa'
        }

        if (title.length > 200) {
          return 'O título deve ter no máximo 200 caracteres'
        }

        return null
      },

      trackNumber: (value, values) => {
        if (!values.albumId) {
          return null
        }

        if (value == null || value === '') {
          return null
        }

        if (value < 1) {
          return 'O número da faixa deve ser maior que zero'
        }

        return null
      },

      releaseYear: (value) => {
        if (value == null || value === '') {
          return null
        }

        const currentYear = new Date().getFullYear()

        if (value < 1900 || value > currentYear) {
          return `Informe um ano entre 1900 e ${currentYear}`
        }

        return null
      },

      bpm: (value) => {
        if (value == null || value === '') {
          return null
        }

        if (value <= 0 || value >= 500) {
          return 'Informe um BPM entre 1 e 499'
        }

        return null
      },
    },
  })

  const albumOptions = albums.map((album) => {
    const typeLabels = {
      album: 'Álbum',
      ep: 'EP',
      single: 'Single',
      compilation: 'Compilação',
    }

    const details = [typeLabels[album.album_type], album.release_year]
      .filter(Boolean)
      .join(' · ')

    return {
      value: String(album.id),
      label: details ? `${album.title} — ${details}` : album.title,
    }
  })

  const selectedAlbumId = form.getValues().albumId

  const createMutation = useMutation({
    mutationFn: createProjectTrack,

    onSuccess: async (createdTrack) => {
      await queryClient.invalidateQueries({
        queryKey: ['project-discography-tracks', String(projectId)],
      })

      notifications.show({
        title: 'Faixa criada',
        message: `"${createdTrack.title}" foi adicionada à discografia.`,
        color: 'green',
        icon: <IconCheck size={16} />,
      })

      form.reset()
      onSuccess?.(createdTrack)
    },

    onError: (error) => {
      console.error('Erro ao criar faixa:', error)

      let message = 'Não foi possível cadastrar a faixa.'

      if (error?.code === '23505') {
        message = 'Já existe uma faixa cadastrada com esse identificador do Spotify.'
      } else if (error?.message) {
        message = error.message
      }

      notifications.show({
        title: 'Erro ao criar faixa',
        message,
        color: 'red',
      })
    },
  })

  // Ao remover o lançamento, track_number deixa de fazer sentido.
  useEffect(() => {
    if (!selectedAlbumId) {
      form.setFieldValue('trackNumber', null)
    }
  }, [selectedAlbumId])

  function handleSubmit(values) {
    if (!projectId || !userId) {
      notifications.show({
        title: 'Não foi possível criar a faixa',
        message: 'Projeto ou usuário não identificado.',
        color: 'red',
      })
      return
    }

    const payload = {
      projectId: Number(projectId),
      userId,
      title: values.title.trim(),

      albumId: values.albumId ? Number(values.albumId) : null,

      trackNumber:
        values.albumId && values.trackNumber != null ? Number(values.trackNumber) : null,

      releaseYear: values.releaseYear != null ? Number(values.releaseYear) : null,

      bpm: values.bpm != null ? Number(values.bpm) : null,

      isInstrumental: values.isInstrumental,
      isPublic: values.isPublic,

      spotifyId: values.spotifyId?.trim() || null,
      youtubePath: values.youtubePath?.trim() || null,
    }

    createMutation.mutate(payload)
  }

  return (
    <form onSubmit={form.onSubmit(handleSubmit)}>
      <Stack gap="lg">
        <Stack gap="md">
          <TextInput
            withAsterisk
            label="Título"
            placeholder="Nome da música"
            leftSection={<IconMusic size={16} />}
            key={form.key('title')}
            {...form.getInputProps('title')}
          />

          <Select
            label="Lançamento"
            description="Opcional. Você pode vincular esta faixa a um álbum, EP, single ou compilação."
            placeholder={
              albums.length ? 'Nenhum lançamento' : 'Nenhum lançamento cadastrado'
            }
            data={albumOptions}
            clearable
            searchable
            nothingFoundMessage="Nenhum lançamento encontrado"
            disabled={!albums.length}
            key={form.key('albumId')}
            {...form.getInputProps('albumId')}
          />

          {selectedAlbumId && (
            <NumberInput
              label="Número da faixa"
              description="Posição da música dentro do lançamento."
              placeholder="Ex.: 3"
              min={1}
              step={1}
              allowDecimal={false}
              key={form.key('trackNumber')}
              {...form.getInputProps('trackNumber')}
            />
          )}

          <Group grow align="flex-start">
            <NumberInput
              label="Ano"
              placeholder="Ex.: 2026"
              min={1900}
              max={new Date().getFullYear()}
              allowDecimal={false}
              key={form.key('releaseYear')}
              {...form.getInputProps('releaseYear')}
            />

            <NumberInput
              label="BPM"
              placeholder="Ex.: 120"
              min={1}
              max={499}
              allowDecimal={false}
              key={form.key('bpm')}
              {...form.getInputProps('bpm')}
            />
          </Group>

          <Checkbox
            label="Faixa instrumental"
            description="Marque se esta música não possui vocais."
            key={form.key('isInstrumental')}
            {...form.getInputProps('isInstrumental', {
              type: 'checkbox',
            })}
          />
        </Stack>

        <Divider label="Links externos" labelPosition="left" />

        <Stack gap="md">
          <TextInput
            label="Spotify ID"
            description="Opcional. Identificador da faixa no Spotify."
            placeholder="Ex.: 0C0XlULifJtAgn6ZNCW2eu"
            leftSection={<IconBrandSpotify size={16} />}
            key={form.key('spotifyId')}
            {...form.getInputProps('spotifyId')}
          />

          <TextInput
            label="YouTube"
            description="Opcional. URL ou identificador usado pelo Mublin para esta faixa."
            placeholder="Link ou identificador do YouTube"
            leftSection={<IconBrandYoutube size={16} />}
            key={form.key('youtubePath')}
            {...form.getInputProps('youtubePath')}
          />
        </Stack>

        <Divider label="Visibilidade" labelPosition="left" />

        <Switch
          label="Faixa pública"
          description={
            form.getValues().isPublic
              ? 'A faixa poderá aparecer publicamente no catálogo do projeto.'
              : 'A faixa ficará restrita aos contextos privados permitidos pelo Mublin.'
          }
          key={form.key('isPublic')}
          {...form.getInputProps('isPublic', {
            type: 'checkbox',
          })}
        />

        <Text size="xs" c="dimmed">
          Arquivos de áudio poderão ser adicionados depois que a faixa for criada.
        </Text>

        <Group justify="flex-end" mt="xs">
          {onCancel && (
            <Button
              type="button"
              variant="default"
              onClick={onCancel}
              disabled={createMutation.isPending}
            >
              Cancelar
            </Button>
          )}

          <Button type="submit" color="mublinColor" loading={createMutation.isPending}>
            {isEditing ? 'Salvar alterações' : 'Criar faixa'}
          </Button>
        </Group>
      </Stack>
    </form>
  )
}
