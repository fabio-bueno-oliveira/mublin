// middleware.js (colocar na raiz do projeto, ao lado do package.json)
// Edge Middleware da Vercel — funciona com qualquer framework, não só Next.js.
//
// Estratégia: "dynamic rendering" recomendado pelo Google para SPAs sem SSR.
// - Usuário real (navegador) -> segue normal, recebe a SPA React de sempre.
// - Bot conhecido (Googlebot, Bingbot, facebookexternalhit, WhatsApp, Twitterbot,
//   LinkedInBot, Slackbot, Discordbot, etc.) -> recebe um HTML gerado sob demanda
//   por /api/profile-og, com meta tags e conteúdo reais.
//
// Isso NÃO muda nada para usuários reais nem exige migrar para SSR.

import { next } from '@vercel/edge'

// Rotas que nunca devem passar por este tratamento (rotas de app, não são perfis públicos)
const RESERVED_PATHS = new Set([
  'login',
  'signup',
  'cadastro',
  'dashboard',
  'settings',
  'configuracoes',
  'notifications',
  'messages',
  'sitemap.xml',
  'robots.txt',
])

// Lista de user-agents de bots que devem receber a versão pré-renderizada.
// Inclui crawlers de busca e de preview social (que não executam JS).
const BOT_UA_REGEX =
  /bot|crawl|spider|slurp|facebookexternalhit|whatsapp|telegrambot|slackbot|discordbot|linkedinbot|twitterbot|embedly|quora link preview|showyoubot|outbrain|pinterest|vkshare|w3c_validator|redditbot|applebot|ia_archiver/i

export const config = {
  // Casa qualquer path de 1 nível (ex: /fabio) que não tenha extensão de arquivo
  // e não seja /api ou assets. Ajuste se sua estrutura de rotas for diferente.
  matcher: '/((?!api|assets|static|.*\\..*).*)',
}

export default async function middleware(request) {
  const ua = request.headers.get('user-agent') || ''

  if (!BOT_UA_REGEX.test(ua)) {
    return next() // usuário real -> segue para a SPA normalmente
  }

  const url = new URL(request.url)
  const segment = url.pathname.replace(/^\/+/, '') // remove a barra inicial

  if (!segment || RESERVED_PATHS.has(segment) || segment.includes('/')) {
    return next() // não é uma rota de perfil de 1 nível — segue o fluxo normal
  }

  const ogUrl = new URL('/api/profile-og', request.url)
  ogUrl.searchParams.set('username', segment)

  const ogResponse = await fetch(ogUrl)

  if (ogResponse.status === 404) {
    return next() // não existe perfil público com esse username -> deixa a SPA lidar com o 404
  }

  return new Response(await ogResponse.text(), {
    status: ogResponse.status,
    headers: { 'content-type': 'text/html; charset=utf-8' },
  })
}
