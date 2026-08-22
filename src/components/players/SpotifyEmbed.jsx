import { Box, Text } from '@mantine/core'
import { extractSpotifyTrackId } from '../../utils/musicLinks'

// Player somente leitura da Spotify (iframe oficial, sem OAuth/API key).
// Aceita tanto um spotify_id já salvo quanto um link/URI cru (nesse caso
// passa pelo mesmo parser usado no cadastro de faixas).
//
// Uso:
//   <SpotifyEmbed spotifyId={track.spotify_id} />
//   <SpotifyEmbed uri="https://open.spotify.com/track/4uLU6hMCjMI75M1A2tKUQC" />
export default function SpotifyEmbed({ spotifyId, uri, compact = true, radius = 12 }) {
  const id = spotifyId || extractSpotifyTrackId(uri)

  if (!id) {
    return (
      <Text size="xs" c="dimmed">
        Sem link do Spotify pra essa faixa.
      </Text>
    )
  }

  return (
    <Box style={{ position: 'relative', width: '100%', height: compact ? 152 : 352 }}>
      <iframe
        title="Spotify player"
        src={`https://open.spotify.com/embed/track/${id}?utm_source=generator`}
        width="100%"
        height="100%"
        style={{ position: 'absolute', top: 0, left: 0, border: 0, borderRadius: radius }}
        frameBorder="0"
        allowFullScreen=""
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        loading="lazy"
      />
    </Box>
  )
}
