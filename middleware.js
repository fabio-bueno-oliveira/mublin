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
])

const BOT_UA_REGEX =
  /bot|crawl|spider|slurp|facebookexternalhit|whatsapp|telegrambot|slackbot|discordbot|linkedinbot|twitterbot|embedly|quora link preview|showyoubot|outbrain|pinterest|vkshare|w3c_validator|redditbot|applebot|ia_archiver/i

export const config = {
  matcher: '/((?!api|assets|static|.*\\..*).*)',
  runtime: 'nodejs',
}

export default async function middleware(request) {
  const ua = request.headers.get('user-agent') || ''
  if (!BOT_UA_REGEX.test(ua)) {
    return next()
  }

  const url = new URL(request.url)
  const segments = url.pathname.split('/').filter(Boolean)

  let ogUrl = null

  // /project/:slug -> project-og
  if (segments.length === 2 && segments[0] === 'project') {
    ogUrl = new URL('/api/project-og', request.url)
    ogUrl.searchParams.set('slug', decodeURIComponent(segments[1]))
  }
  // /:username -> profile-og
  else if (segments.length === 1 && !RESERVED_PATHS.has(segments[0])) {
    ogUrl = new URL('/api/profile-og', request.url)
    ogUrl.searchParams.set('username', decodeURIComponent(segments[0]))
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
