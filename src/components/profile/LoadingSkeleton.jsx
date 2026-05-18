import {
  Container,
  Skeleton,
  Grid,
  Group,
  Flex,
  Box,
  Stack,
  Paper,
  em,
} from '@mantine/core'
import { useMediaQuery } from '@mantine/hooks'

export default function LoadingSkeleton() {
  const isMobile = useMediaQuery(`(max-width: ${em(750)})`)

  return (
    <Container size="xl" py="sm" mt="sm">
      <Grid>
        {/* Coluna Principal (Esquerda) */}
        <Grid.Col span={{ base: 12, md: 8 }}>
          <Group align="center" gap="md" mb="xl">
            <Skeleton circle height={96} />
            <Stack gap={8} flex={1}>
              <Skeleton height={28} width="40%" radius="xl" />
              <Skeleton height={16} width="25%" radius="xl" />
              <Skeleton height={16} width="60%" radius="md" mt={4} />
              <Group gap={4} mt={4}>
                <Skeleton height={20} width={80} radius="xl" />
                <Skeleton height={20} width={80} radius="xl" />
              </Group>
            </Stack>
          </Group>

          <Stack gap={12}>
            <Box>
              <Skeleton height={24} width={100} mb="xs" />
              <Skeleton height={14} width="100%" radius="sm" />
              <Skeleton height={14} width="95%" radius="sm" mt={6} />
              <Skeleton height={14} width="40%" radius="sm" mt={6} />
            </Box>
          </Stack>
          <Flex mx={isMobile ? 'xs' : 0} mt="md" gap={15} justify="space-between">
            <Skeleton height={160} radius="md" />
            <Skeleton height={160} radius="md" />
          </Flex>
        </Grid.Col>

        {/* Sidebar (Direita) */}
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Stack gap={12}>
            <Paper p="md" radius="md" withBorder>
              <Skeleton height={20} width="60%" mb="sm" />
              <Group gap={6}>
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} circle height={32} />
                ))}
              </Group>
            </Paper>

            <Paper p="md" radius="md" withBorder>
              <Skeleton height={20} width="70%" mb="md" />
              <Stack gap="md">
                {[1, 2, 3].map((i) => (
                  <Group key={i} gap="sm" wrap="nowrap">
                    <Skeleton circle height={40} />
                    <Stack gap={4} style={{ flex: 1 }}>
                      <Skeleton height={12} width="80%" radius="xl" />
                      <Skeleton height={10} width="50%" radius="xl" />
                    </Stack>
                  </Group>
                ))}
              </Stack>
            </Paper>
          </Stack>
        </Grid.Col>
      </Grid>
    </Container>
  )
}
