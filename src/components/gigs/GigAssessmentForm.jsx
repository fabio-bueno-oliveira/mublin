import { useEffect, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Alert,
  Button,
  Group,
  LoadingOverlay,
  Paper,
  Radio,
  SegmentedControl,
  SimpleGrid,
  Stack,
  Switch,
  Text,
  Textarea,
} from '@mantine/core'
import { IconMoodSad, IconMoodSmile, IconStarFilled } from '@tabler/icons-react'
import { useAuth } from '../../hooks/useAuth'
import {
  fetchGigAssessment,
  upsertGigAssessment,
  deleteGigAssessment,
} from '../../queries/gigs'

const COMMENT_MAX = 2000

// Valores gravados em gig_assessments.rating
const RATING_OPTIONS = [
  { value: '1', label: 'Fraco / Pode melhorar', icon: IconMoodSad, color: 'orange' },
  { value: '2', label: 'Bom', icon: IconMoodSmile, color: 'teal' },
  { value: '3', label: 'Excelente', icon: IconStarFilled, color: 'yellow' },
]

// boolean | null <-> valor do SegmentedControl
const repeatToValue = (v) => (v === true ? 'yes' : v === false ? 'no' : 'none')
const valueToRepeat = (v) => (v === 'yes' ? true : v === 'no' ? false : null)

/**
 * Avaliação de uma gig (tabela public.gig_assessments).
 *
 * Props:
 *  - gigId (obrigatório): id da gig
 *  - gigRoleId (opcional): papel do usuário na gig (gig_roles.id)
 *  - onSaved / onDeleted (opcionais): callbacks após salvar / remover
 */
export default function GigAssessmentForm({
  gigId,
  gigRoleId = null,
  onSaved,
  onDeleted,
}) {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const queryKey = ['gig-assessment', gigId, user?.id]

  const [rating, setRating] = useState('')
  const [wouldRepeat, setWouldRepeat] = useState('none')
  const [comment, setComment] = useState('')
  const [isPublic, setIsPublic] = useState(true)
  const [validationError, setValidationError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)

  const {
    data: assessment,
    isLoading,
    error: loadError,
  } = useQuery({
    queryKey,
    queryFn: () => fetchGigAssessment(gigId, user.id),
    enabled: !!gigId && !!user?.id,
    staleTime: 1000 * 60 * 5,
  })

  // Preenche o formulário quando a avaliação existente chega (ou muda)
  useEffect(() => {
    if (assessment) {
      setRating(String(assessment.rating))
      setWouldRepeat(repeatToValue(assessment.would_repeat))
      setComment(assessment.comment ?? '')
      setIsPublic(assessment.is_public)
    } else {
      setRating('')
      setWouldRepeat('none')
      setComment('')
      setIsPublic(true)
    }
  }, [assessment])

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey })
    // Caso exista uma listagem/resumo de avaliações da gig no app
    queryClient.invalidateQueries({ queryKey: ['gig-assessments', gigId] })
  }

  const saveMutation = useMutation({
    mutationFn: upsertGigAssessment,
    onSuccess: (data) => {
      queryClient.setQueryData(queryKey, data)
      invalidate()
      setSuccessMessage(
        assessment ? 'Avaliação atualizada.' : 'Avaliação enviada. Obrigado!',
      )
      onSaved?.(data)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => deleteGigAssessment(assessment.id),
    onSuccess: () => {
      queryClient.setQueryData(queryKey, null)
      invalidate()
      setSuccessMessage('Avaliação removida.')
      onDeleted?.()
    },
  })

  const isBusy = saveMutation.isPending || deleteMutation.isPending
  const mutationError = saveMutation.error || deleteMutation.error

  // Qualquer edição limpa as mensagens de feedback anteriores
  const touch = () => {
    setSuccessMessage(null)
    setValidationError(null)
    saveMutation.reset()
    deleteMutation.reset()
  }

  const handleSave = () => {
    if (!rating) {
      setValidationError('Escolha uma opção para avaliar a gig.')
      return
    }
    setValidationError(null)
    setSuccessMessage(null)
    saveMutation.mutate({
      gigId,
      profileId: user.id,
      rating: Number(rating),
      wouldRepeat: valueToRepeat(wouldRepeat),
      comment,
      isPublic,
      gigRoleId,
    })
  }

  const handleDelete = () => {
    setSuccessMessage(null)
    deleteMutation.mutate()
  }

  return (
    <Paper mt="sm" withBorder radius="md" p={0} pos="relative">
      <LoadingOverlay visible={isLoading} zIndex={10} />

      <Stack gap="md">
        <div>
          <Text fw={600}>{assessment ? 'Sua avaliação' : 'Como foi essa gig?'}</Text>
        </div>

        <Radio.Group
          value={rating}
          onChange={(v) => {
            touch()
            setRating(v)
          }}
          aria-label="Avaliação da gig"
        >
          <SimpleGrid cols={{ base: 1, xs: 3 }} spacing="xs">
            {RATING_OPTIONS.map(({ value, label, icon: Icon, color }) => {
              const selected = rating === value
              return (
                <Radio.Card
                  key={value}
                  value={value}
                  radius="md"
                  p="xs"
                  style={
                    selected
                      ? {
                          borderColor: `var(--mantine-color-${color}-filled)`,
                          backgroundColor: `var(--mantine-color-${color}-light)`,
                        }
                      : undefined
                  }
                >
                  <Stack align="center" gap={4}>
                    <Icon
                      size={22}
                      stroke={1.6}
                      color={
                        selected
                          ? `var(--mantine-color-${color}-filled)`
                          : 'var(--mantine-color-dimmed)'
                      }
                    />
                    <Text size="xs" fw={selected ? 600 : 500} ta="center">
                      {label}
                    </Text>
                  </Stack>
                </Radio.Card>
              )
            })}
          </SimpleGrid>
        </Radio.Group>

        <Stack gap={4}>
          <Text size="sm" fw={500}>
            Participaria de novo?
          </Text>
          <Text size="xs" c="dimmed">
            Opcional
          </Text>
          <SegmentedControl
            value={wouldRepeat}
            onChange={(v) => {
              touch()
              setWouldRepeat(v)
            }}
            data={[
              { value: 'none', label: 'Não sei' },
              { value: 'yes', label: 'Sim' },
              { value: 'no', label: 'Não' },
            ]}
          />
        </Stack>

        <Textarea
          label="Comentário"
          placeholder="Conte como foi: organização, som, clima, pagamento…"
          autosize
          minRows={2}
          maxRows={5}
          maxLength={COMMENT_MAX}
          value={comment}
          onChange={(e) => {
            touch()
            setComment(e.currentTarget.value)
          }}
          description={`Opcional (${comment.length}/${COMMENT_MAX})`}
        />

        <Switch
          checked={isPublic}
          size="xs"
          onChange={(e) => {
            touch()
            setIsPublic(e.currentTarget.checked)
          }}
          label="Avaliação pública"
          description={
            isPublic
              ? 'Só você e quem criou a gig podem ver sua opinião'
              : 'Todos do projeto podem ver sua opinião'
          }
        />

        {loadError && (
          <Alert color="red" variant="light">
            Não foi possível carregar sua avaliação.
          </Alert>
        )}
        {validationError && (
          <Alert color="red" variant="light">
            {validationError}
          </Alert>
        )}
        {mutationError && (
          <Alert color="red" variant="light">
            Não foi possível concluir a operação. Tente novamente.
          </Alert>
        )}
        {successMessage && (
          <Alert color="green" variant="light">
            {successMessage}
          </Alert>
        )}

        <Group justify="space-between">
          {assessment ? (
            <Button
              variant="subtle"
              color="red"
              size="sm"
              onClick={handleDelete}
              loading={deleteMutation.isPending}
              disabled={saveMutation.isPending}
            >
              Remover avaliação
            </Button>
          ) : (
            <span />
          )}
          <Button
            onClick={handleSave}
            size="sm"
            loading={saveMutation.isPending}
            disabled={isBusy || isLoading || !!loadError}
          >
            {assessment ? 'Atualizar avaliação' : 'Enviar avaliação'}
          </Button>
        </Group>
      </Stack>
    </Paper>
  )
}
