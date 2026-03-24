import { useSearchParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { Container, Title, Text } from '@mantine/core'

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams()
  const q = searchParams.get('q') ?? ''

  // Aqui você dispara sua query ao Supabase baseada em `q`
  // ex: useQuery({ queryKey: ['search', q], queryFn: () => searchAll(q), enabled: !!q })

  return (
    <Container size="xl" py="sm">
      <Title order={1} fz="h2" fw={700} lts="-0.02em" mb={24}>
        {q ? `Resultados para "${q}"` : 'Busca'}
      </Title>
      {!q && (
        <Text c="dimmed" size="sm">Digite algo para buscar músicos, projetos e mais.</Text>
      )}
    </Container>
  )
}