import { Container } from '@mantine/core'
import MublinLoader from '../../components/MublinLoader'

export default function LoadingSkeleton() {
  return (
    <Container size="xl" py="sm" mt={{ base: 50, sm: 150 }}>
      <MublinLoader size={80} />
    </Container>
  )
}
