// Mublin - Mux only - final
// video_url no DB = playbackId (ex: Q1KCWhU1fuMF01Gg016Pkd01017702sKYeQxf7uqYDENn02400)

export function getSceneMediaUrl(playbackId) {
  if (!playbackId) {
    return ''
  }
  if (playbackId.startsWith('http')) {
    return playbackId
  }
  return `https://stream.mux.com/${playbackId}.m3u8`
}

export function getScenePosterUrl(
  playbackId,
  { width = 640, height, time = 1, fit = 'smartcrop' } = {},
) {
  if (!playbackId) {
    return ''
  }
  const id = playbackId.startsWith('http')
    ? playbackId.split('/').pop()?.replace('.m3u8', '')
    : playbackId

  const params = new URLSearchParams()
  if (width) {
    params.set('width', width)
  }
  if (height) {
    params.set('height', height)
  }
  if (fit) {
    params.set('fit_mode', fit)
  }
  params.set('time', time)

  return `https://image.mux.com/${id}/thumbnail.jpg?${params.toString()}`
}

export function getSceneAnimatedUrl(
  playbackId,
  { width = 320, start = 0, fps = 12, end } = {},
) {
  if (!playbackId) {
    return ''
  }
  const id = playbackId.startsWith('http')
    ? playbackId.split('/').pop()?.replace('.m3u8', '')
    : playbackId

  const params = new URLSearchParams()
  if (width) {
    params.set('width', width)
  }
  if (start !== undefined) {
    params.set('start', start)
  }
  if (end !== undefined) {
    params.set('end', end)
  }
  params.set('fps', fps)

  return `https://image.mux.com/${id}/animated.gif?${params.toString()}`
}
