import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import {
  Container,
  Paper,
  Stack,
  Title,
  Text,
  TextInput,
  PasswordInput,
  Button,
  Anchor,
  Divider,
  Group,
} from '@mantine/core'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import { IconBrandGoogle, IconBrandSpotify } from '@tabler/icons-react'

export default function Signup() {
  const navigate = useNavigate()
  const { signUpWithEmail, signInWithGoogle, signInWithSpotify } = useAuth()
  const [loading, setLoading] = useState(false)
  const [loadingGoogle, setLoadingGoogle] = useState(false)
  const [loadingSpotify, setLoadingSpotify] = useState(false)

  const form = useForm({
    initialValues: {
      full_name: '',
      email: '',
      password: '',
      password_confirm: '',
    },
    validate: {
      full_name: (v) => (v.trim().length < 2 ? 'Informe seu nome completo' : null),
      email: (v) => (/^\S+@\S+$/.test(v) ? null : 'E-mail inválido'),
      password: (v) => (v.length < 6 ? 'Mínimo de 6 caracteres' : null),
      password_confirm: (v, values) =>
        v !== values.password ? 'As senhas não coincidem' : null,
    },
  })

  async function handleSubmit(values) {
    setLoading(true)

    const { error } = await signUpWithEmail(values.email, values.password)
    if (error) {
      setLoading(false)
      notifications.show({
        position: 'top-center',
        color: 'red',
        title: 'Ops...',
        message: error.message.includes('already registered')
          ? 'Este e-mail já está cadastrado. Tente entrar na sua conta.'
          : 'Não foi possível criar sua conta. Tente novamente.',
      })
      return
    }

    // Com confirmação desativada, a sessão já existe após o signup
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) {
      // Fallback: confirmação ainda ativa no Supabase
      notifications.show({
        position: 'top-center',
        color: 'green',
        title: 'Conta criada!',
        message: 'Verifique seu e-mail para confirmar o cadastro.',
      })
      setLoading(false)
      navigate('/login')
      return
    }

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
        message: 'Não foi possível continuar com o Google. Tente novamente.',
      })
      setLoadingGoogle(false)
    }
  }

  async function handleSpotify() {
    setLoadingSpotify(true)
    const { error } = await signInWithSpotify()
    if (error) {
      notifications.show({
        position: 'top-center',
        color: 'red',
        title: 'Ops...',
        message: 'Não foi possível continuar com o Spotify. Tente novamente.',
      })
      setLoadingSpotify(false)
    }
  }

  return (
    <Container size={420} py={30}>
      <Stack gap="xl">
        <Stack gap={4} align="center">
          <Title order={2} ta="center" fw={700}>
            Crie sua conta
          </Title>
          <Text c="dimmed" size="sm" ta="center">
            Junte-se à rede profissional da música
          </Text>
        </Stack>

        {/* Form */}
        <Paper p="lg" withBorder radius="lg">
          <form onSubmit={form.onSubmit(handleSubmit)}>
            <Stack gap="md">
              <TextInput
                label="Nome completo"
                placeholder="Seu nome"
                radius="md"
                {...form.getInputProps('full_name')}
              />
              <TextInput
                label="E-mail"
                placeholder="seu@email.com"
                radius="md"
                {...form.getInputProps('email')}
              />
              <PasswordInput
                label="Senha"
                placeholder="Mínimo 6 caracteres"
                radius="md"
                {...form.getInputProps('password')}
              />
              <PasswordInput
                label="Confirmar senha"
                placeholder="Repita a senha"
                radius="md"
                {...form.getInputProps('password_confirm')}
              />

              <Text size="xs" c="dimmed" lh={1.5}>
                Ao criar sua conta, você concorda com nossos{' '}
                <Anchor component={Link} to="/terms" size="xs" underline="hover">
                  Termos de uso
                </Anchor>{' '}
                e{' '}
                <Anchor component={Link} to="/privacy" size="xs" underline="hover">
                  Política de privacidade
                </Anchor>
                .
              </Text>

              <Button
                type="submit"
                radius="xl"
                size="md"
                fw={700}
                loading={loading}
                fullWidth
                mt={4}
              >
                Criar conta
              </Button>

              <Divider label="ou continue com" labelPosition="center" />

              {/* Social signup */}
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

        {/* Link para login */}
        <Text ta="center" size="sm" c="dimmed">
          Já tem uma conta?{' '}
          <Anchor component={Link} to="/login" fw={600} underline="hover">
            Entrar
          </Anchor>
        </Text>
      </Stack>
    </Container>
  )
}
