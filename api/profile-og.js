// api/profile-og.js
// Recebe ?username=fabio e devolve um HTML minimo, mas real, com:
// - title/description corretos
// - Open Graph e Twitter Card (essencial para preview no WhatsApp, Twitter/X, LinkedIn etc,
//   que NÃO executam JavaScript e por isso nunca veriam essas tags se dependessem do React)
// - JSON-LD (schema.org/Person) para rich results no Google
// - conteúdo textual real, para o crawler ter algo para indexar
//
// Só é chamado para User-Agents de bot (ver middleware.js) — usuários reais continuam
// recebendo a SPA normalmente.

import { createClient } from '@supabase/supabase-js'

const SITE_URL = 'https://mublin.com'
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-default.png`

export default async function handler(req, res) {
  const { username } = req.query

  if (!username) {
    res.status(400).send('username ausente')
    return
  }

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
  )

  const { data: profile, error } = await supabase
    .from('profiles')
    .select(
      `
      username,
      full_name,
      avatar,
      title,
      is_open_to_work,
      is_public,
      roles:profile_roles (
        main_activity,
        roles (
          name_ptbr,
          name_en
        )
      ),
      cities (
        name, countries ( name, name_ptbr )
      ),
      regions (
        name, uf
      )
    `,
    )
    .eq('username', username)
    .eq('is_public', true)
    .maybeSingle()

  if (error || !profile) {
    res.status(404).send('Perfil não encontrado ou não é público')
    return
  }

  const primaryRole = getPrimaryRole(profile.roles)
  const location = getLocation(profile.cities, profile.regions)

  const title = `${profile.full_name} (@${profile.username}) | Mublin`
  const description = buildDescription(profile, primaryRole, location)
  const image = profile.avatar || DEFAULT_OG_IMAGE
  const url = `${SITE_URL}/${profile.username}`

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: profile.full_name,
    url,
    image,
    ...(primaryRole ? { jobTitle: primaryRole } : {}),
    ...(location ? { homeLocation: { '@type': 'Place', name: location } } : {}),
  }

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}" />
  <link rel="canonical" href="${url}" />

  <meta property="og:type" content="profile" />
  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta property="og:description" content="${escapeHtml(description)}" />
  <meta property="og:image" content="${image}" />
  <meta property="og:url" content="${url}" />

  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(title)}" />
  <meta name="twitter:description" content="${escapeHtml(description)}" />
  <meta name="twitter:image" content="${image}" />

  <script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
</head>
<body>
  <h1>${escapeHtml(profile.full_name)}</h1>
  ${profile.title ? `<p>${escapeHtml(profile.title)}</p>` : ''}
  ${primaryRole ? `<p>${escapeHtml(primaryRole)}</p>` : ''}
  ${location ? `<p>${escapeHtml(location)}</p>` : ''}
  ${profile.is_open_to_work ? '<p>Aberto a oportunidades</p>' : ''}
  <p>${escapeHtml(profile.title || '')}</p>
  <p><a href="${url}">Ver perfil completo no Mublin</a></p>
</body>
</html>`

  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=3600')
  res.status(200).send(html)
}

// Pega o papel principal (main_activity = true); se nenhum estiver marcado, usa o primeiro.
function getPrimaryRole(profileRoles) {
  if (!Array.isArray(profileRoles) || profileRoles.length === 0) return null
  const main = profileRoles.find((r) => r.main_activity) || profileRoles[0]
  return main?.roles?.name_ptbr || main?.roles?.name_en || null
}

// Monta "Cidade, UF" para perfis no Brasil, ou "Cidade, País" para o resto.
function getLocation(cities, regions) {
  const cityName = cities?.name
  if (!cityName) return null

  const uf = regions?.uf
  if (uf) return `${cityName}, ${uf}`

  const countryName = cities?.countries?.name_ptbr || cities?.countries?.name
  return countryName ? `${cityName}, ${countryName}` : cityName
}

// Descrição para <meta description> e OG: prioriza a title; na ausência dela,
// monta algo relevante a partir de title/role/localização.
function buildDescription(profile, primaryRole, location) {
  if (profile.title) return profile.title.slice(0, 160)

  const parts = [profile.title, primaryRole, location].filter(Boolean)
  if (parts.length > 0) {
    return `${profile.full_name} · ${parts.join(' · ')} · Perfil no Mublin.`.slice(0, 160)
  }

  return `Perfil de ${profile.full_name} no Mublin.`
}

function escapeHtml(str = '') {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
