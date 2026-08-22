// Extrai o ID de uma faixa do Spotify a partir de:
//  - link completo: https://open.spotify.com/track/4uLU6hMCjMI75M1A2tKUQC?si=abc123
//  - link com locale: https://open.spotify.com/intl-pt/track/4uLU6hMCjMI75M1A2tKUQC
//  - URI: spotify:track:4uLU6hMCjMI75M1A2tKUQC
//  - ID puro colado direto: 4uLU6hMCjMI75M1A2tKUQC
// Retorna null se não conseguir reconhecer o formato.
export function extractSpotifyTrackId(input) {
  if (!input) {
    return null
  }
  const trimmed = input.trim()

  const urlMatch = trimmed.match(
    /open\.spotify\.com\/(?:intl-[a-z]{2}\/)?track\/([a-zA-Z0-9]{22})/,
  )
  if (urlMatch) {
    return urlMatch[1]
  }

  const uriMatch = trimmed.match(/spotify:track:([a-zA-Z0-9]{22})/)
  if (uriMatch) {
    return uriMatch[1]
  }

  if (/^[a-zA-Z0-9]{22}$/.test(trimmed)) {
    return trimmed
  }

  return null
}

// Checagem simples (não bloqueante) de que o link colado parece ser do YouTube.
// A URL inteira é salva como está — não tentamos extrair o ID do vídeo.
export function isLikelyYoutubeUrl(input) {
  if (!input) {
    return false
  }
  return /youtu\.?be/i.test(input.trim())
}

export function buildSpotifyTrackUrl(spotifyId) {
  return spotifyId ? `https://open.spotify.com/track/${spotifyId}` : null
}
