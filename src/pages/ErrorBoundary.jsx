// Exibido pelo React Router quando qualquer rota lança um erro não tratado
import {
  useRouteError,
  isRouteErrorResponse,
  useNavigate,
} from 'react-router-dom'
import { Container, Title, Text, Button, Stack, Code, Box } from '@mantine/core'
import { IconArrowLeft, IconRefresh } from '@tabler/icons-react'

export default function ErrorBoundary() {
  const error = useRouteError()
  const navigate = useNavigate()

  // Erros HTTP do próprio Router (404, 403, etc.)
  if (isRouteErrorResponse(error)) {
    return (
      <Container size="sm" py={80}>
        <Stack align="center" gap="md">
          <Text size="72px" fw={800} c="dimmed" lh={1}>
            {error.status}
          </Text>
          <Title order={2} fw={600} ta="center">
            {error.status === 404 ? 'Página não encontrada' : 'Algo deu errado'}
          </Title>
          <Text c="dimmed" ta="center" maw={400}>
            {error.statusText || 'Ocorreu um erro inesperado.'}
          </Text>
          <Button
            leftSection={<IconArrowLeft size={16} />}
            variant="default"
            onClick={() => navigate('/')}
          >
            Voltar ao início
          </Button>
        </Stack>
      </Container>
    )
  }

  // Erros de JavaScript (exceções não tratadas no código)
  const message = error instanceof Error ? error.message : String(error)

  return (
    <Container size="sm" py={80}>
      <Stack align="center" gap="md">
        <Text size="48px" fw={800} c="dimmed" lh={1}>
          Ops
        </Text>
        <Title order={2} fw={600} ta="center">
          Erro inesperado
        </Title>
        <Text c="dimmed" ta="center" maw={400}>
          Algo deu errado ao carregar esta página. Você pode tentar recarregar
          ou voltar ao início.
        </Text>
        {import.meta.env.DEV && (
          <Box w="100%" maw={480}>
            <Code block c="red" p="sm" style={{ wordBreak: 'break-word' }}>
              {message}
            </Code>
          </Box>
        )}
        <Stack gap="xs" align="center">
          <Button
            leftSection={<IconRefresh size={16} />}
            onClick={() => window.location.reload()}
          >
            Recarregar página
          </Button>
          <Button
            leftSection={<IconArrowLeft size={16} />}
            variant="default"
            onClick={() => navigate('/')}
          >
            Voltar ao início
          </Button>
        </Stack>
      </Stack>
    </Container>
  )
}
