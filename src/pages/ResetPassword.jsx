import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import {
  Container, Paper, Stack, Title, Text,
  PasswordInput, Button, Anchor, ThemeIcon
} from '@mantine/core'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import { IconShieldCheck } from '@tabler/icons-react'

export default function ResetPassword() {
  const { updatePassword } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading]   = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const form = useForm({
    initialValues: { password: '', confirmPassword: '' },
    validate: {
      password: (v) =>
        v.length < 6 ? 'Mínimo de 6 caracteres' : null,
      confirmPassword: (v, values) =>
        v !== values.password ? 'As senhas não coincidem' : null,
    },
  })

  async function handleSubmit({ password }) {
    setLoading(true)
    const { error } = await updatePassword(password)
    setLoading(false)

    if (error) {
      notifications.show({
        position: 'top-center',
        color: 'red',
        title: 'Ops...',
        message: 'Não foi possível redefinir sua senha. O link pode ter expirado.',
      })
      return
    }

    setSubmitted(true)
  }

  return (
    <Container size={420} py={30}>
      <Stack gap="xl">
        <Stack gap={4} align="center">
          <Title order={2} ta="center" fw={700} lts="-0.02em">
            Nova senha
          </Title>
          <Text c="dimmed" size="sm" ta="center">
            Escolha uma senha forte para proteger sua conta
          </Text>
        </Stack>

        <Paper p="lg" withBorder radius="lg">
          {submitted ? (
            /* ── Estado de sucesso ── */
            <Stack gap="md" align="center" py="sm">
              <ThemeIcon size={56} radius="xl" color="indigo" variant="light">
                <IconShieldCheck size={28} />
              </ThemeIcon>
              <Stack gap={4} align="center">
                <Text fw={600} ta="center">
                  Senha redefinida!
                </Text>
                <Text size="sm" c="dimmed" ta="center" maw={300}>
                  Sua senha foi atualizada com sucesso. Você já pode fazer login.
                </Text>
              </Stack>
              <Button
                color="indigo"
                radius="xl"
                size="sm"
                mt={4}
                onClick={() => navigate('/login', { replace: true })}
              >
                Ir para o login
              </Button>
            </Stack>
          ) : (
            /* ── Formulário ── */
            <form onSubmit={form.onSubmit(handleSubmit)}>
              <Stack gap="md">
                <PasswordInput
                  size="lg"
                  label="Nova senha"
                  placeholder="Mínimo de 6 caracteres"
                  radius="md"
                  {...form.getInputProps('password')}
                />
                <PasswordInput
                  size="lg"
                  label="Confirmar senha"
                  placeholder="Repita a nova senha"
                  radius="md"
                  {...form.getInputProps('confirmPassword')}
                />
                <Button
                  type="submit"
                  color="indigo"
                  radius="xl"
                  size="md"
                  fw={700}
                  loading={loading}
                  fullWidth
                  mt={4}
                >
                  Redefinir senha
                </Button>
              </Stack>
            </form>
          )}
        </Paper>

        {!submitted && (
          <Text ta="center" size="sm" c="dimmed">
            Link expirado ou inválido?{' '}
            <Anchor component={Link} to="/forgot-password" c="indigo" fw={600} underline="hover">
              Solicitar novo link
            </Anchor>
          </Text>
        )}
      </Stack>
    </Container>
  )
}