import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import {
  Container, Center, Box, Stack, Title, Text, TextInput,
  PasswordInput, Button, Anchor, Divider, Group
} from '@mantine/core'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import {
  IconMicrofrontends,
  IconBrandGoogle, IconBrandSpotify
} from '@tabler/icons-react'

export default function Login() {
  const navigate = useNavigate()
  const { signInWithEmail, signInWithGoogle, signInWithSpotify } = useAuth()
  const [loading, setLoading] = useState(false)
  const [loadingGoogle, setLoadingGoogle] = useState(false)
  const [loadingSpotify, setLoadingSpotify] = useState(false)

  const form = useForm({
    initialValues: { email: '', password: '' },
    validate: {
      email: (v) => (/^\S+@\S+$/.test(v) ? null : 'E-mail inválido'),
      password: (v) => (v.length < 6 ? 'Mínimo de 6 caracteres' : null),
    },
  })

  async function handleSubmit(values) {
    setLoading(true)
    const { error } = await signInWithEmail(values.email, values.password)
    if (error) {
      setLoading(false)
      notifications.show({
        position: 'top-center',
        color: 'red',
        title: 'Ops...',
        message: 'E-mail ou senha incorretos. Verifique e tente novamente',
      })
      return
    }
    navigate('/home')
  }

  async function handleGoogle() {
    setLoadingGoogle(true)
    const { error } = await signInWithGoogle()
    if (error) {
      notifications.show({
        position: 'top-center',
        color: 'red',
        title: 'Ops...',
        message: 'Não foi possível entrar com o Google. Tente novamente.',
      })
      setLoadingGoogle(false)
    }
    // sucesso: o Supabase redireciona automaticamente para /auth/callback
  }

  async function handleSpotify() {
    setLoadingSpotify(true)
    const { error } = await signInWithSpotify()
    if (error) {
      notifications.show({
        position: 'top-center',
        color: 'red',
        title: 'Ops...',
        message: 'Não foi possível entrar com o Spotify. Tente novamente.',
      })
      setLoadingSpotify(false)
    }
    // sucesso: o Supabase redireciona automaticamente para /auth/callback
  }

  return (
    <Container size={420} py={30}>
      <Stack gap="xl">

        <Stack gap={4} align="center">
          <Center>
            <IconMicrofrontends size={28} />
          </Center>
          <Title order={2} ta="center" fw={700} lts="-0.02em" mt={8}>
            Boas-vindas de volta
          </Title>
          <Text c="dimmed" size="sm" ta="center">
            Entre na sua conta para continuar
          </Text>
        </Stack>

        {/* Form */}
        <Box
          p="xl"
          style={{
            border: '1px solid var(--mantine-color-default-border)',
            borderRadius: 16,
            background: 'var(--mantine-color-default)',
          }}
        >
          <form onSubmit={form.onSubmit(handleSubmit)}>
            <Stack gap="md">

              <TextInput
                label="E-mail"
                placeholder="seu@email.com"
                radius="md"
                {...form.getInputProps('email')}
              />

              <PasswordInput
                label="Senha"
                placeholder="Sua senha"
                radius="md"
                {...form.getInputProps('password')}
              />

              <Anchor
                size="xs"
                c="dimmed"
                ta="right"
                component={Link}
                to="/forgot-password"
              >
                Esqueci minha senha
              </Anchor>

              <Button
                type="submit"
                color="amber"
                radius="xl"
                size="md"
                fw={700}
                loading={loading}
                fullWidth
                mt={4}
              >
                Entrar
              </Button>

              <Divider label="ou continue com" labelPosition="center" />

              {/* Login social */}
              <Group grow gap="sm">
                <Button
                  variant="default"
                  radius="xl"
                  size="md"
                  loading={loadingGoogle}
                  leftSection={<IconBrandGoogle size={18} />}
                  onClick={handleGoogle}
                >
                  Google
                </Button>
                <Button
                  radius="xl"
                  size="md"
                  loading={loadingSpotify}
                  leftSection={<IconBrandSpotify size={18} />}
                  onClick={handleSpotify}
                  style={{ background: '#1DB954', color: '#fff' }}
                >
                  Spotify
                </Button>
              </Group>

            </Stack>
          </form>
        </Box>

        {/* Link para cadastro */}
        <Text ta="center" size="sm" c="dimmed">
          Ainda não tem conta?{' '}
          <Anchor component={Link} to="/signup" c="amber" fw={600} underline="never">
            Criar conta grátis
          </Anchor>
        </Text>

      </Stack>
    </Container>
  )
}
