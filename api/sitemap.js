// api/sitemap.js
// Gera o sitemap.xml dinamicamente, listando apenas perfis marcados como públicos.
// Requer as env vars SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY configuradas no projeto Vercel
// (a service role key NUNCA deve ser exposta no client — aqui ela roda só no servidor).

import { createClient } from '@supabase/supabase-js'

const SITE_URL = 'https://mublin.com'

export default async function handler(req, res) {
  try {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
    )

    // Ajuste 'profiles', 'username', 'is_public' e 'updated_at' para os nomes reais
    // das suas tabelas/colunas no Supabase.
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('username, updated_at')

    if (error) {
      throw error
    }

    const staticUrls = [{ loc: `${SITE_URL}/`, changefreq: 'weekly', priority: '1.0' }]

    const profileUrls = (profiles || []).map((p) => ({
      loc: `${SITE_URL}/${p.username}`,
      lastmod: p.updated_at ? new Date(p.updated_at).toISOString() : undefined,
      changefreq: 'weekly',
      priority: '0.8',
    }))

    const urls = [...staticUrls, ...profileUrls]

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) => `  <url>
    <loc>${u.loc}</loc>${u.lastmod ? `\n    <lastmod>${u.lastmod}</lastmod>` : ''}
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`,
  )
  .join('\n')}
</urlset>`

    res.setHeader('Content-Type', 'application/xml; charset=utf-8')
    res.setHeader('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400')
    res.status(200).send(xml)
  } catch (err) {
    console.error('Erro ao gerar sitemap:', err)
    res.status(500).send('Erro ao gerar sitemap')
  }
}
