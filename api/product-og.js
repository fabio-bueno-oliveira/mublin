// api/product-og.js — HTML público de produtos (gear) para crawlers.
// Chamado pelo middleware.js apenas para User-Agents de bot, em /gear/:slug.
import { createClient } from '@supabase/supabase-js'

const SITE_URL = 'https://mublin.com'
const DEFAULT_IMAGE = `${SITE_URL}/og-default.png`

// Mesmo padrão do app (fundo branco, imagem "contida"), só que maior para o preview social.
const IMAGEKIT_PRODUCT_BASE =
  'https://ik.imagekit.io/mublin/products/tr:w-600,h-600,cm-pad_resize,bg-FFFFFF,fo-x/'

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function safeJsonLd(value) {
  return JSON.stringify(value).replace(/</g, '\\u003c')
}

function shortDescription(value, maxLength = 160) {
  const text = String(value || '')
    .replace(/\s+/g, ' ')
    .trim()
  if (text.length <= maxLength) return text

  const slice = text.slice(0, maxLength - 3)
  const lastSpace = slice.lastIndexOf(' ')

  return `${slice.slice(0, lastSpace > 0 ? lastSpace : slice.length).replace(/[.,;:!?-]+$/, '')}...`
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).send('Método não permitido')
  }

  const slug = typeof req.query.slug === 'string' ? req.query.slug : ''

  if (!slug || slug.length > 200 || slug.includes('/')) {
    return res.status(400).send('Slug inválido')
  }

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return res.status(500).send('Configuração indisponível')
  }

  try {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { persistSession: false, autoRefreshToken: false } },
    )

    // ⚠️ Ajuste o nome da tabela/colunas se forem diferentes das usadas em
    // fetchProductInfo (queries/gear). Se a tabela tiver algo como is_active/is_public,
    // adicione o .eq() correspondente aqui, como no project-og.
    const { data: product, error } = await supabase
      .from('products')
      .select('id, name, slug, description, picture, brands (name)')
      .eq('slug', slug)
      .maybeSingle()

    if (error) throw error
    if (!product) return res.status(404).send('Produto não encontrado')

    const brandName = product.brands?.name || null
    const url = `${SITE_URL}/gear/${encodeURIComponent(product.slug)}`

    // Mesmo formato do <title> do GearItemPublic.jsx
    const title = brandName
      ? `${product.name} | ${brandName} | Mublin`
      : `${product.name} | Mublin`

    const fallback = `Confira ${product.name}${brandName ? ` da ${brandName}` : ''} no Mublin. Pessoas que utilizam, gigs e muito mais!`
    const description = shortDescription(product.description || fallback)

    const image = product.picture
      ? `${IMAGEKIT_PRODUCT_BASE}${encodeURIComponent(product.picture)}`
      : DEFAULT_IMAGE

    // WebPage (e não Product) de propósito: o Google exige offers/review/aggregateRating
    // em Product e acusa erro no Search Console quando faltam. Ver observações na conversa.
    const structuredData = {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      '@id': url,
      url,
      name: title,
      description,
      inLanguage: 'pt-BR',
      primaryImageOfPage: image,
      isPartOf: {
        '@type': 'WebSite',
        name: 'Mublin',
        url: SITE_URL,
      },
    }

    const html = `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}" />
  <link rel="canonical" href="${escapeHtml(url)}" />

  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="Mublin" />
  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta property="og:description" content="${escapeHtml(description)}" />
  <meta property="og:url" content="${escapeHtml(url)}" />
  <meta property="og:image" content="${escapeHtml(image)}" />
  <meta property="og:locale" content="pt_BR" />

  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(title)}" />
  <meta name="twitter:description" content="${escapeHtml(description)}" />
  <meta name="twitter:image" content="${escapeHtml(image)}" />

  <script type="application/ld+json">${safeJsonLd(structuredData)}</script>
</head>
<body>
  <main>
    ${brandName ? `<p>${escapeHtml(brandName)}</p>` : ''}
    <h1>${escapeHtml(product.name)}</h1>
    <p>${escapeHtml(description)}</p>
    <p><a href="${escapeHtml(url)}">Ver ${escapeHtml(product.name)} no Mublin</a></p>
  </main>
</body>
</html>`

    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=3600')

    return res.status(200).send(html)
  } catch (error) {
    console.error('product-og:', error)
    return res.status(500).send('Erro ao carregar produto')
  }
}
