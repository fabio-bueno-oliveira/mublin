import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import {
  Container, Paper, Stack, Title, Text,
  TextInput, Button, Anchor, ThemeIcon
} from '@mantine/core'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import { IconMailCheck } from '@tabler/icons-react'

export default function ForgotPassword() {
  const { resetPassword } = useAuth()
  const [loading, setLoading]   = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const form = useForm({
    initialValues: { email: '' },
    validate: {
      email: (v) => (/^\S+@\S+$/.test(v) ? null : 'E-mail inválido'),
    },
  })

  async function handleSubmit({ email }) {
    setLoading(true)
    const { error } = await resetPassword(email)
    setLoading(false)

    if (error) {
      notifications.show({
        position: 'top-center',
        color: 'red',
        title: 'Ops...',
        message: 'Não foi possível enviar o e-mail. Tente novamente.',
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
            Recuperar senha
          </Title>
          <Text c="dimmed" size="sm" ta="center">
            Informe seu e-mail e enviaremos um link para redefinir sua senha
          </Text>
        </Stack>

        <Paper p="lg" withBorder radius="lg">
          {submitted ? (
            /* ── Estado de sucesso ── */
            <Stack gap="md" align="center" py="sm">
              <ThemeIcon size={56} radius="xl" color="indigo" variant="light">
                <IconMailCheck size={28} />
              </ThemeIcon>
              <Stack gap={4} align="center">
                <Text fw={600} ta="center">
                  E-mail enviado!
                </Text>
                <Text size="sm" c="dimmed" ta="center" maw={300}>
                  Verifique sua caixa de entrada e siga as instruções para
                  redefinir sua senha.
                </Text>
              </Stack>
              <Button
                component={Link}
                to="/login"
                variant="subtle"
                color="indigo"
                radius="xl"
                size="sm"
                mt={4}
              >
                Voltar para o login
              </Button>
            </Stack>
          ) : (
            /* ── Formulário ── */
            <form onSubmit={form.onSubmit(handleSubmit)}>
              <Stack gap="md">
                <TextInput
                  size="lg"
                  label="E-mail"
                  placeholder="seu@email.com"
                  radius="md"
                  {...form.getInputProps('email')}
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
                  Enviar link de recuperação
                </Button>
              </Stack>
            </form>
          )}
        </Paper>

        <Text ta="center" size="sm" c="dimmed">
          Lembrou a senha?{' '}
          <Anchor component={Link} to="/login" c="indigo" fw={600} underline="hover">
            Voltar para o login
          </Anchor>
        </Text>
      </Stack>
    </Container>
  )
}