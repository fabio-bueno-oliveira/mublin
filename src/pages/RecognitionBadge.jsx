import AppNavbarMobile from '../components/AppNavbarMobile'
import { Container, Title, Text, Stack, Avatar, Center, Flex, Affix } from '@mantine/core'

export default function RecognitionBadge() {
  return (
    <>
      <Affix position={{ top: 0, left: 0 }} hiddenFrom="sm">
        <AppNavbarMobile pageName="Selo de reconhecimento" />
      </Affix>

      <Container size="xl" py="xs" px={{ base: 'md', sm: 0 }} mt={{ base: 62, sm: 0 }}>
        <Stack gap="xs" mb="xl">
          <Text ta="center" c="dimmed" size="13px" mb={6} visibleFrom="sm">
            Figura mainstream
          </Text>
          <Center pos="relative">
            <Avatar size={100} radius="xl" src="URL_DO_BADGE_AQUI" />
          </Center>
          <Flex direction="column" align="center">
            <Title order={1} fz="h2">
              NOME DO RECONHECIMENTO
            </Title>
            <Text size="sm" c="dimmed">
              Descrição do badge de reconhecimento
            </Text>
          </Flex>
        </Stack>
      </Container>
    </>
  )
}
