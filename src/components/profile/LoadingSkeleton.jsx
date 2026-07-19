import {
  Container,
  Skeleton,
  Grid,
  Center,
  Group,
  Flex,
  Stack,
  Paper,
} from '@mantine/core'

export default function LoadingSkeleton() {
  return (
    <Container size="xl" py="sm" mt={{ base: 50, sm: 14 }}>
      <Grid>
        {/* Coluna Principal (Esquerda) */}
        <Grid.Col span={{ base: 12, md: 2 }} hiddenFrom="xs">
          <Flex
            justify="flex-start"
            align="center"
            direction="row"
            wrap="nowrap"
            columnGap="xs"
            w="100%"
          >
            <Skeleton circle height={84} />
            <Stack gap={8} flex={1}>
              <Skeleton height={22} width={160} radius="xl" />
              <Skeleton height={12} width={110} radius="xl" />
              <Skeleton height={12} width={130} radius="md" />
            </Stack>
          </Flex>
          <Group justify="center" gap="xs" mt="sm" w="100%">
            <Skeleton height={16} width={110} radius="xl" />
            <Skeleton height={16} width={110} radius="xl" />
          </Group>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 2 }} visibleFrom="sm">
          <Group align="center" gap="md" mb="xl">
            <Center>
              <Skeleton circle height={140} />
            </Center>
          </Group>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 7 }}>
          <Stack gap={8} flex={1} visibleFrom="sm">
            <Skeleton height={28} width={200} radius="xl" />
            <Skeleton height={14} width={300} radius="xl" />
            <Group gap={4} mt={3}>
              <Skeleton height={18} width={80} radius="xl" />
              <Skeleton height={18} width={80} radius="xl" />
            </Group>
          </Stack>
          <Stack gap={12} mt="sm">
            <Paper p="md" radius="md" withBorder>
              <Skeleton height={20} width={100} mb="md" />
              <Skeleton height={14} width="80%" mb="sm" />
              <Group gap={6}>
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} height={20} width={80} radius="xl" />
                ))}
              </Group>
            </Paper>

            <Paper p="md" radius="md" withBorder>
              <Skeleton height={20} width={100} mb="md" />
              <Stack gap="md">
                {[1, 2, 3].map((i) => (
                  <Group key={i} gap="sm" wrap="nowrap" align="flex-start">
                    <Skeleton width={48} height={48} radius="md" />
                    <Stack gap="xs" style={{ flex: 1 }}>
                      <Skeleton height={16} width={130} radius="xl" />
                      <Skeleton height={12} width={90} radius="xl" />
                    </Stack>
                  </Group>
                ))}
              </Stack>
            </Paper>
          </Stack>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 3 }}>
          <Paper p="md" radius="md" withBorder>
            <Skeleton height={20} width={136} mb="md" />
            <Stack gap="md">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Stack key={i} gap="xs" style={{ flex: 1 }}>
                  <Skeleton height={12} width="80%" radius="xl" />
                  <Skeleton height={10} width="50%" radius="xl" />
                </Stack>
              ))}
            </Stack>
          </Paper>
        </Grid.Col>
      </Grid>
    </Container>
  )
}
