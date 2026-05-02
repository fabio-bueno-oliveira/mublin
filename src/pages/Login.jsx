import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import {
  Container, Paper, Stack, Title, Text, TextInput,
  PasswordInput, Button, Anchor, Divider, Group
} from '@mantine/core'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import {
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

    const { data: { session } } = await supabase.auth.getSession()
    const { data: profile } = await supabase
      .from('profiles')
      .select('onboarding_completed')
      .eq('id', session.user.id)
      .single()

    setLoading(false)
    navigate(profile?.onboarding_completed ? '/home' : '/onboarding')
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
          <Title order={2} ta="center" fw={700} lts="-0.02em">
            Login
          </Title>
          <Text c="dimmed" size="sm" ta="center">
            Entre na sua conta para continuar
          </Text>
        </Stack>

        {/* Form */}
        <Paper
          p="lg"
          withBorder
          radius="lg"
        >
          <form onSubmit={form.onSubmit(handleSubmit)}>
            <Stack gap="md">
              <TextInput
                size="lg"
                label="E-mail"
                placeholder="seu@email.com"
                radius="md"
                {...form.getInputProps('email')}
              />
              <PasswordInput
                size="lg"
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
                underline="hover"
              >
                Esqueci minha senha
              </Anchor>
              <Button
                type="submit"
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
        </Paper>

        <Text ta="center" size="sm" c="dimmed">
          Ainda não tem conta?{' '}
          <Anchor component={Link} to="/signup" fw={600} underline="hover">
            Criar conta grátis
          </Anchor>
        </Text>

      </Stack>
    </Container>
  )
}
