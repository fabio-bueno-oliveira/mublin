// api/sitemap.js
// Gera o sitemap.xml dinamicamente, listando apenas perfis marcados como públicos.
// Requer as env vars SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY configuradas no projeto Vercel
// (a service role key NUNCA deve ser exposta no client — aqui ela roda só no servidor).
// Update em 2026-10-12: adicionando "projects"

import { createClient } from '@supabase/supabase-js'

const SITE_URL = 'https://mublin.com'

const escapeXml = (value) =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')

const formatDate = (date) => {
  if (!date) return undefined

  const parsed = new Date(date)

  return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString()
}

export default async function handler(req, res) {
  try {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      },
    )

    // Busca perfis e projetos simultaneamente
    const [profilesResult, projectsResult] = await Promise.all([
      supabase
        .from('profiles')
        .select('username, updated_at')
        .eq('is_public', true)
        .eq('onboarding_completed', true)
        .eq('is_fake_profile', false)
        .eq('is_shadow_hidden', false)
        .not('username', 'is', null),

      supabase
        .from('projects')
        .select('slug, updated_at')
        .eq('is_public', true)
        .eq('is_active', true)
        .not('slug', 'is', null),
    ])

    if (profilesResult.error) {
      throw profilesResult.error
    }

    if (projectsResult.error) {
      throw projectsResult.error
    }

    const profiles = profilesResult.data || []
    const projects = projectsResult.data || []

    const staticUrls = [
      {
        loc: `${SITE_URL}/`,
        changefreq: 'weekly',
        priority: '1.0',
      },
    ]

    const profileUrls = profiles
      .filter((p) => p.username?.trim())
      .map((p) => ({
        loc: `${SITE_URL}/${encodeURIComponent(p.username)}`,
        lastmod: formatDate(p.updated_at),
        changefreq: 'weekly',
        priority: '0.8',
      }))

    const projectUrls = projects
      .filter((p) => p.slug?.trim())
      .map((p) => ({
        loc: `${SITE_URL}/project/${encodeURIComponent(p.slug)}`,
        lastmod: formatDate(p.updated_at),
        changefreq: 'weekly',
        priority: '0.8',
      }))

    const urls = [...staticUrls, ...profileUrls, ...projectUrls]

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) => `  <url>
    <loc>${escapeXml(u.loc)}</loc>${
      u.lastmod ? `\n    <lastmod>${u.lastmod}</lastmod>` : ''
    }
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
