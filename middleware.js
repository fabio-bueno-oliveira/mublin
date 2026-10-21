import { next } from '@vercel/functions'

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
  'project',
  'gear',
])

const BOT_UA_REGEX =
  /bot|crawl|spider|slurp|facebookexternalhit|whatsapp|telegrambot|slackbot|discordbot|linkedinbot|twitterbot|embedly|quora link preview|showyoubot|outbrain|pinterest|vkshare|w3c_validator|redditbot|applebot|ia_archiver/i

// Rotas de dois segmentos (/prefixo/:valor) -> endpoint que gera o HTML + nome do query param
const TWO_SEGMENT_ROUTES = {
  project: { endpoint: '/api/project-og', param: 'slug' },
  gear: { endpoint: '/api/product-og', param: 'slug' },
}

export const config = {
  matcher: '/((?!api|assets|static|.*\\..*).*)',
  runtime: 'nodejs',
}

// decodeURIComponent lança erro em URLs malformadas (ex: /gear/%E0%A4%A)
function safeDecode(value) {
  try {
    return decodeURIComponent(value)
  } catch {
    return null
  }
}

export default async function middleware(request) {
  const ua = request.headers.get('user-agent') || ''
  if (!BOT_UA_REGEX.test(ua)) {
    return next()
  }

  const url = new URL(request.url)
  const segments = url.pathname.split('/').filter(Boolean)

  let ogUrl = null

  // /project/:slug -> project-og  |  /gear/:slug -> product-og
  if (segments.length === 2 && TWO_SEGMENT_ROUTES[segments[0]]) {
    const { endpoint, param } = TWO_SEGMENT_ROUTES[segments[0]]
    const value = safeDecode(segments[1])

    if (value) {
      ogUrl = new URL(endpoint, request.url)
      ogUrl.searchParams.set(param, value)
    }
  }
  // /:username -> profile-og
  else if (segments.length === 1 && !RESERVED_PATHS.has(segments[0])) {
    const username = safeDecode(segments[0])

    if (username) {
      ogUrl = new URL('/api/profile-og', request.url)
      ogUrl.searchParams.set('username', username)
    }
  }

  if (!ogUrl) {
    return next()
  }

  const ogResponse = await fetch(ogUrl)

  // Qualquer falha (404, 500...) cai no SPA em vez de mostrar erro ao bot
  if (!ogResponse.ok) {
    return next()
  }

  return new Response(await ogResponse.text(), {
    status: 200,
    headers: { 'content-type': 'text/html; charset=utf-8' },
  })
}
