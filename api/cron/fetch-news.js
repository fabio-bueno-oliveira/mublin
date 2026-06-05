/**
 * Mublin – Cron Job: Busca RSS e salva no Supabase
 *
 * Arquivo: /api/cron/fetch-news.js
 * Deploy: Vercel (Serverless Function)
 * Agendamento: GitHub Actions (.github/workflows/fetch-news.yml)
 * Roda a cada 2 horas automaticamente via GitHub Actions.
 *
 * Variáveis de ambiente necessárias (Vercel Dashboard → Environment Variables):
 *   SUPABASE_URL              ← URL do projeto Supabase
 *   SUPABASE_SERVICE_ROLE_KEY ← service role, nunca expor no frontend
 *   CRON_SECRET               ← segredo pra proteger o endpoint
 *
 * Secret do GitHub Actions (Settings → Secrets and variables → Actions):
 *   CRON_SECRET               ← mesmo valor do Vercel
 */

import { createClient } from '@supabase/supabase-js'

// ─── Fontes RSS confirmadas e ativas ─────────────────────────────────────────
const RSS_SOURCES = [
  {
    name: 'Hits Perdidos',
    url: 'https://hitsperdidos.com/feed/',
    category: 'noticias', // notícias gerais, shows, artistas BR
  },
  {
    name: "Blog n' Roll",
    url: 'https://blognroll.com.br/category/br-music/feed/',
    category: 'artistas', // rock e música brasileira
  },
  {
    name: 'UMusic Store Blog',
    url: 'https://blog.umusicstore.com/feed/',
    category: 'artistas', // lançamentos e artistas
  },
  {
    name: 'Jornal de Brasília – Música',
    url: 'https://jornaldebrasilia.com.br/entretenimento/musica/feed/',
    category: 'noticias', // notícias gerais de música
  },
  {
    name: 'X5 Music Blog',
    url: 'https://blog.x5music.com.br/feed/',
    category: 'instrumentos', // gear, instrumentos, home studio
  },
  {
    name: 'JAM Music Blog',
    url: 'https://www.jam.mus.br/feed/',
    category: 'instrumentos', // técnicas, dicas para músicos
  },
]

// ─── Parser XML minimalista (sem dependências externas) ───────────────────────
function parseRSS(xml) {
  const items = []
  const itemMatches = xml.matchAll(/<item>([\s\S]*?)<\/item>/g)

  for (const match of itemMatches) {
    const block = match[1]

    const get = (tag) => {
      // Tenta CDATA primeiro, depois texto simples
      const cdata = block.match(
        new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>`, 'i'),
      )
      if (cdata) {
        return cdata[1].trim()
      }
      const plain = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'))
      return plain ? plain[1].replace(/<[^>]+>/g, '').trim() : null
    }

    // Imagem: tenta media:content, depois og:image no description
    const mediaUrl = block.match(/media:content[^>]+url="([^"]+)"/i)?.[1] ?? null

    const title = get('title')
    const link = get('link')
    if (!title || !link) {
      continue
    } // ignora items incompletos

    items.push({
      title,
      link: link.replace(/&amp;/g, '&'),
      description: get('description')?.slice(0, 300) ?? null,
      pub_date: get('pubDate') ?? get('dc:date') ?? null,
      image_url: mediaUrl,
    })
  }

  return items
}

// ─── Busca um feed RSS ────────────────────────────────────────────────────────
async function fetchFeed(source) {
  try {
    const res = await fetch(source.url, {
      headers: {
        'User-Agent': 'Mublin RSS Reader/1.0 (+https://mublin.app)',
        Accept: 'application/rss+xml, application/xml, text/xml',
      },
      signal: AbortSignal.timeout(10_000), // timeout 10s
    })

    if (!res.ok) {
      console.warn(`[${source.name}] HTTP ${res.status}`)
      return []
    }

    const xml = await res.text()
    const items = parseRSS(xml)

    return items.map((item) => ({
      ...item,
      source_name: source.name,
      source_url: source.url,
      category: source.category,
    }))
  } catch (err) {
    console.error(`[${source.name}] Erro ao buscar feed:`, err.message)
    return []
  }
}

// ─── Handler principal ────────────────────────────────────────────────────────
export default async function handler(req, res) {
  // Proteção básica do endpoint com segredo
  const authHeader = req.headers.authorization
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
  )

  // Busca todos os feeds em paralelo
  const results = await Promise.allSettled(RSS_SOURCES.map(fetchFeed))
  const allItems = results.filter((r) => r.status === 'fulfilled').flatMap((r) => r.value)

  if (allItems.length === 0) {
    return res.status(200).json({ message: 'Nenhum item encontrado.' })
  }

  // Upsert no Supabase usando o link como chave única (evita duplicatas)
  const rows = allItems.map((item) => ({
    title: item.title,
    description: item.description,
    url: item.link,
    source_name: item.source_name,
    source_url: item.source_url,
    image_url: item.image_url,
    category: item.category,
    published_at: item.pub_date
      ? new Date(item.pub_date).toISOString()
      : new Date().toISOString(),
  }))

  const { error } = await supabase
    .from('news_cache')
    .upsert(rows, { onConflict: 'url', ignoreDuplicates: true })

  if (error) {
    console.error('Supabase upsert error:', error)
    return res.status(500).json({ error: error.message })
  }

  // Limpa notícias com mais de 30 dias para não crescer indefinidamente
  await supabase
    .from('news_cache')
    .delete()
    .lt('published_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())

  return res.status(200).json({
    success: true,
    fetched: allItems.length,
    sources: RSS_SOURCES.length,
  })
}
