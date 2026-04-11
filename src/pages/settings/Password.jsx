import { useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import {
  Title, Stack, PasswordInput, Button, Group, Alert,
} from '@mantine/core'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import { IconCheck, IconAlertCircle, IconLock } from '@tabler/icons-react'

export default function Password() {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm({
    initialValues: {
      password:        '',
      confirmPassword: '',
    },
    validate: {
      password: (v) => {
        if (!v) return 'Nova senha é obrigatória'
        if (v.length < 8) return 'A senha deve ter pelo menos 8 caracteres'
        return null
      },
      confirmPassword: (v, values) =>
        v !== values.password ? 'As senhas não coincidem' : null,
    },
  })

  async function handleSubmit(values) {
    setIsSubmitting(true)
    const { error } = await supabase.auth.updateUser({
      password: values.password,
    })
    if (error) {
      notifications.show({
        color: 'red',
        position: 'top-center',
        message: error.message ?? 'Erro ao alterar senha. Tente novamente.',
      })
    } else {
      notifications.show({
        color: 'green',
        position: 'top-center',
        message: 'Senha alterada com sucesso!',
      })
      form.reset()
    }
    setIsSubmitting(false)
  }

  return (
    <>
      <Title order={2} fz="h4" ta="left" fw={600} lts="-0.02em" mb="lg">
        Alterar minha senha
      </Title>

      <Stack gap="lg" maw={400}>

        <Stack gap="md">

          <PasswordInput
            label="Nova senha"
            placeholder="Mínimo 8 caracteres"
            leftSection={<IconLock size={16} />}
            autoComplete="new-password"
            {...form.getInputProps('password')}
          />

          <PasswordInput
            label="Confirmar nova senha"
            placeholder="Repita a nova senha"
            leftSection={<IconLock size={16} />}
            autoComplete="new-password"
            {...form.getInputProps('confirmPassword')}
          />
        </Stack>

        <Alert icon={<IconAlertCircle size={16} />} color="yellow" variant="light">
          Após alterar a senha, você continuará logado neste dispositivo. Em outros dispositivos, será necessário fazer login novamente.
        </Alert>

        <Group justify="flex-end">
          <Button
            loading={isSubmitting}
            leftSection={<IconCheck size={15} />}
            onClick={() => {
              const result = form.validate()
              if (!result.hasErrors) handleSubmit(form.values)
            }}
          >
            Salvar nova senha
          </Button>
        </Group>

      </Stack>
    </>
  )
}