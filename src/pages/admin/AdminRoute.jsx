// Guard que protege todas as rotas /admin/*
// Verifica sessão Supabase + flag is_admin no profile

import { useEffect, useState } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { Center, Loader } from '@mantine/core'
import { supabase } from '../../lib/supabaseClient'

export default function AdminRoute() {
  const [status, setStatus] = useState('loading') // 'loading' | 'allowed' | 'denied'

  useEffect(() => {
    async function checkAdmin() {
      try {
        const { data: { session } } = await supabase.auth.getSession()

        if (!session) {
          setStatus('denied')
          return
        }

        const { data: profile, error } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', session.user.id)
          .single()

        if (error || !profile?.is_admin) {
          setStatus('denied')
          return
        }

        setStatus('allowed')
      } catch {
        setStatus('denied')
      }
    }

    checkAdmin()
  }, [])

  if (status === 'loading') {
    return (
      <Center h="100vh">
        <Loader size="sm" />
      </Center>
    )
  }

  if (status === 'denied') {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}