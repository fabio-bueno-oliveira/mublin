/**
 * Mublin – Cron Job: Busca RSS e salva no Supabase
 *
 * Arquivo: /api/cron/fetch-news.js
 * Deploy: Vercel (Serverless Function)
 * Agendamento: GitHub Actions (.github/workflows/fetch-news.yml)
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

// ─── Fontes RSS curadas para o Mublin ───────────────

const RSS_SOURCES = [
  // --- NOTÍCIAS GERAIS / CENA BR ---
  {
    name: 'Hits Perdidos',
    url: 'https://hitsperdidos.com/feed/',
    category: 'noticias', // independente BR, festivais, cena
  },
  {
    name: 'Tenho Mais Discos Que Amigos',
    url: 'https://tenhomaisdiscosqueamigos.com/feed/',
    category: 'noticias', // maior portal independente BR
  },
  {
    name: 'Igor Miranda',
    url: 'https://igormiranda.com.br/feed/',
    category: 'noticias', // rock/metal, referência jornalística
  },
  {
    name: 'Wikimetal',
    url: 'https://wikimetal.com.br/feed/',
    category: 'noticias', // rock/metal/pop, bem ativo
  },
  {
    name: 'Whiplash.net',
    url: 'https://whiplash.net/rss/',
    category: 'noticias', // acervo gigante, metal e clássicos
  },

  // --- ARTISTAS / LANÇAMENTOS ---
  {
    name: "Blog n' Roll",
    url: 'https://blognroll.com.br/feed/', // feed geral é mais estável que /category/br-music/feed/
    category: 'artistas',
  },
  {
    name: 'Monkeybuzz',
    url: 'https://monkeybuzz.com.br/feed/',
    category: 'artistas', // indie, alternativo, gringo e BR
  },

  // --- INSTRUMENTOS / TÉCNICA (muito relevante pro Mublin) ---
  {
    name: 'Cifra Club News',
    url: 'https://www.cifraclub.com.br/noticias/feed/',
    category: 'instrumentos', // teoria, técnicas, cifras - ouro pra músico
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

  // --- MERCADO DA MÚSICA (nova categoria recomendada) ---
  {
    name: 'Mundo da Música',
    url: 'https://www.mundodamusica.com.br/feed/',
    category: 'mercado', // negócios, streaming, direitos, carreira
  },
]

function cleanText(str) {
  if (!str) {
    return null
  }
  return str
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(code))
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&nbsp;/g, ' ')
    .trim()
}

// ─── Parser XML minimalista melhorado (sem deps) ───────────────────────────
function parseRSS(xml) {
  const items = []
  const itemMatches = xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)

  for (const match of itemMatches) {
    const block = match[1]

    const get = (tag) => {
      // CDATA primeiro
      const cdata = block.match(
        new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>`, 'i'),
      )
      if (cdata) {
        return cdata[1].trim()
      }
      const plain = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'))
      return plain ? plain[1].replace(/<[^>]+>/g, '').trim() : null
    }

    const title = cleanText(get('title'))
    const linkRaw = get('link')
    if (!title || !linkRaw) {
      continue
    }

    const link = linkRaw.replace(/&amp;/g, '&').split('#')[0] // limpa âncora

    // Descrição: tenta description, depois content:encoded cortado
    const descriptionRaw = get('description')
    const contentEncodedMatch = block.match(
      /<content:encoded[^>]*><!\[CDATA\[([\s\S]*?)\]\]><\/content:encoded>/i,
    )
    const contentEncoded = contentEncodedMatch?.[1] ?? ''
    const description = cleanText(descriptionRaw || contentEncoded)?.slice(0, 300) ?? null

    // Imagem: tenta 4 estratégias (a maioria dos feeds BR não usa media:content)
    const mediaContent = block.match(/<media:content[^>]+url="([^"]+)"/i)?.[1] ?? null
    const mediaThumb = block.match(/<media:thumbnail[^>]+url="([^"]+)"/i)?.[1] ?? null
    const enclosure = block.match(/<enclosure[^>]+url="([^"]+)"/i)?.[1] ?? null
    const imgInContent = contentEncoded.match(/<img[^>]+src="([^"]+)"/i)?.[1] ?? null
    const imgInDescription =
      (descriptionRaw || '').match(/<img[^>]+src="([^"]+)"/i)?.[1] ?? null

    let image_url =
      mediaContent || mediaThumb || enclosure || imgInContent || imgInDescription || null
    // Filtra imagens lixo (tracking pixel, etc)
    if (
      image_url &&
      (image_url.includes('feeds.feedburner.com') || image_url.endsWith('.svg'))
    ) {
      image_url = imgInContent || imgInDescription || null
    }

    items.push({
      title,
      link,
      description,
      pub_date: get('pubDate') ?? get('dc:date') ?? get('published') ?? null,
      image_url,
    })
  }

  return items
}

// ─── Busca um feed RSS ─────────────────────────────────────────────────────
async function fetchFeed(source) {
  try {
    const res = await fetch(source.url, {
      headers: {
        'User-Agent': 'Mublin RSS Reader/1.0 (+https://mublin.app)',
        Accept: 'application/rss+xml, application/xml, text/xml, */*',
      },
      signal: AbortSignal.timeout(12_000),
    })

    if (!res.ok) {
      console.warn(`[${source.name}] HTTP ${res.status} - ${source.url}`)
      return []
    }

    const xml = await res.text()
    // Alguns feeds retornam HTML quando bloqueiam, valida rápido
    if (!xml.includes('<rss') && !xml.includes('<feed') && !xml.includes('<item>')) {
      console.warn(`[${source.name}] não retornou RSS válido`)
      return []
    }

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

// ─── Handler principal ──────────────────────────────────────────────────────
export default async function handler(req, res) {
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
  )

  // Busca todos os feeds em paralelo
  const results = await Promise.allSettled(RSS_SOURCES.map(fetchFeed))
  const fetchedItems = results
    .filter((r) => r.status === 'fulfilled')
    .flatMap((r) => r.value)

  if (fetchedItems.length === 0) {
    return res
      .status(200)
      .json({ message: 'Nenhum item encontrado.', sources: RSS_SOURCES.length })
  }

  // Deduplicação por URL antes de ir pro banco (feeds diferentes republicam a mesma notícia)
  const uniqueByUrl = new Map()
  for (const item of fetchedItems) {
    if (!uniqueByUrl.has(item.link)) {
      uniqueByUrl.set(item.link, item)
    }
  }
  const allItems = Array.from(uniqueByUrl.values())

  // Prepara linhas pro Supabase
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

  // Upsert sem ignoreDuplicates = atualiza se o título/imagem mudar
  const { error } = await supabase.from('news_cache').upsert(rows, { onConflict: 'url' })

  if (error) {
    console.error('Supabase upsert error:', error)
    return res.status(500).json({ error: error.message })
  }

  // Limpa notícias com mais de 35 dias (margem maior que 30 pra não apagar no dia do corte)
  await supabase
    .from('news_cache')
    .delete()
    .lt('published_at', new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString())

  return res.status(200).json({
    success: true,
    fetched_raw: fetchedItems.length,
    fetched_unique: allItems.length,
    sources: RSS_SOURCES.length,
  })
}
