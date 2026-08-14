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
])

const BOT_UA_REGEX =
  /bot|crawl|spider|slurp|facebookexternalhit|whatsapp|telegrambot|slackbot|discordbot|linkedinbot|twitterbot|embedly|quora link preview|showyoubot|outbrain|pinterest|vkshare|w3c_validator|redditbot|applebot|ia_archiver/i

export const config = {
  matcher: '/((?!api|assets|static|.*\\..*).*)',
}

export default async function middleware(request) {
  const ua = request.headers.get('user-agent') || ''
  if (!BOT_UA_REGEX.test(ua)) {
    return next()
  }

  const url = new URL(request.url)
  const segment = url.pathname.replace(/^\/+/, '')

  if (!segment || RESERVED_PATHS.has(segment) || segment.includes('/')) {
    return next()
  }

  const ogUrl = new URL('/api/profile-og', request.url)
  ogUrl.searchParams.set('username', segment)

  const ogResponse = await fetch(ogUrl)

  if (ogResponse.status === 404) {
    return next()
  }

  return new Response(await ogResponse.text(), {
    status: ogResponse.status,
    headers: { 'content-type': 'text/html; charset=utf-8' },
  })
}
