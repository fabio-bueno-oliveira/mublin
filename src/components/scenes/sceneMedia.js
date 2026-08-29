const IMAGEKIT_HOST = 'ik.imagekit.io'

function getImageKitBaseUrl(originalUrl) {
  if (!originalUrl?.includes(IMAGEKIT_HOST)) {
    return originalUrl
  }

  return originalUrl.split('/tr:')[0].split('?')[0].replace(/\/$/, '')
}

// O ImageKit só reconhece e transforma vídeo (thumbnail, resize, qualidade)
// se a URL terminar em .mp4/.mov. Registros sem extensão (ex: upload sem o
// sufixo correto) quebram tanto o poster quanto o player. Nesses casos, o
// próprio ImageKit recomenda "dar a dica" adicionando /ik-video.mp4 ao final.
// Ver: https://imagekit.io/docs/transformations
function ensureVideoExtensionHint(baseUrl) {
  const hasVideoExtension = /\.(mp4|mov)$/i.test(baseUrl)
  return hasVideoExtension ? baseUrl : `${baseUrl}/ik-video.mp4`
}

export function getSceneMediaUrl(originalUrl, type) {
  if (!originalUrl?.includes(IMAGEKIT_HOST)) {
    return originalUrl
  }

  const base = ensureVideoExtensionHint(getImageKitBaseUrl(originalUrl))

  switch (type) {
    case 'poster':
      // Frame estático extraído automaticamente do vídeo pelo ImageKit.
      return `${base}/ik-thumbnail.jpg?tr=w-260,h-460,so-1,q-80`

    case 'preview':
      // Mantém o preview animado, mas só é carregado quando
      // a Scene está próxima/visível no scroller.
      return `${base}/tr:w-130,h-230,q-60`

    case 'player':
      // Vídeo usado no player principal.
      return `${base}/tr:h-720,q-80`

    default:
      return originalUrl
  }
}
