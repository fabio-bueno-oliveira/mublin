import {
  Container, Title
} from '@mantine/core'

export default function NewProject() {

  return (
    <Container size="xl" py="sm">
      <Title order={1} fz="h3" ta="left" fw={600} lts="-0.02em" mb={24}>
        Cadastrar novo evento
      </Title>
    </Container>
  )
}
