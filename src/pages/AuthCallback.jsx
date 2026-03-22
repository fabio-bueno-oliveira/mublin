import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { Center, Loader } from '@mantine/core'

export default function AuthCallback() {
  const navigate = useNavigate()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { navigate('/login'); return }

      // Verifica se o perfil já tem username (cadastro completo)
      supabase
        .from('profiles')
        .select('username')
        .eq('id', session.user.id)
        .single()
        .then(({ data }) => {
          if (data?.username) navigate('/home')      // perfil completo → app
          else navigate('/onboarding')              // novo usuário → onboarding
        })
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return <Center h="100vh"><Loader color="amber" /></Center>
}