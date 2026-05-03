import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { Alert } from '@mantine/core'
import { useMediaQuery } from '@mantine/hooks'

export default function WelcomeAlert() {
  const { profile } = useAuth()
  const [showWelcomeAlert, setShowWelcomeAlert] = useState(true)
  const isMobile = useMediaQuery('(max-width: 48em)')

  const mobileText =
    'Aqui você acompanha o panorama da sua carreira, projetos e equipamentos recentemente adicionados.'
  const desktopText =
    'Aqui você acompanha o panorama da sua carreira, seus projetos e equipamentos recentes. Fique de olho no feed ao lado para não perder nenhuma atualização da sua rede.'

  return (
    showWelcomeAlert && (
      <Alert
        variant="light"
        color="mublinColor"
        title={`Olá, ${profile.username}! Boas-vindas ao seu Dashboard`}
        withCloseButton
        onClose={() => setShowWelcomeAlert(false)}
        mb="lg"
      >
        {isMobile ? mobileText : desktopText}
      </Alert>
    )
  )
}
