// src/components/AuthSwitch.jsx
// Renderiza a versão privada (com AppLayout) ou a pública (com PublicLayout) de uma
// mesma URL, conforme o usuário esteja logado. Substitui ProjectRouter, GearRouter,
// SongRouter e qualquer outro "XRouter" que só faça essa escolha.
//
// Private e Public devem ser componentes criados com lazy(), assim cada visitante
// baixa só o chunk da versão que vai ver.
import { Suspense } from 'react'
import { useAuth } from '../hooks/useAuth'
import AppLayout from './layouts/AppLayout'
import PublicLayout from './layouts/PublicLayout'

export default function AuthSwitch({ Private, Public }) {
  const { user, loading } = useAuth()

  if (loading) return null

  const Layout = user ? AppLayout : PublicLayout
  const Page = user ? Private : Public

  return (
    <Layout>
      <Suspense fallback={null}>
        <Page />
      </Suspense>
    </Layout>
  )
}
