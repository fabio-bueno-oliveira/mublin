import { Image } from '@mantine/core'
import { modals } from '@mantine/modals'

/**
 * Abre um modal "limpo" (sem título, sem chrome) exibindo uma imagem
 * ampliada, com o fundo escurecido e desfocado.
 *
 * Uso: chame ao clicar num Avatar/thumbnail para mostrar a foto em
 * tamanho maior. Reaproveitável em qualquer lugar do app (perfil,
 * projetos, posts, etc.)
 *
 * @param {string} src - URL da imagem em resolução maior
 * @param {string} [alt] - texto alternativo (ex: nome do perfil)
 * @param {object} [options]
 * @param {boolean} [options.circular] - recorta a imagem em círculo.
 *   Use true para avatares (evita que overlays como o selo "Open to
 *   Gig", que são retangulares, vazem para fora do círculo do avatar).
 */
export function openImagePreviewModal(src, alt = '', { circular = false } = {}) {
  if (!src) {
    return
  }

  modals.open({
    modalId: 'image-preview',
    withCloseButton: false,
    padding: 0,
    radius: 'md',
    size: 'auto',
    centered: true,
    overlayProps: {
      backgroundOpacity: 0.55,
      blur: 3,
    },
    styles: {
      content: {
        background: 'transparent',
        boxShadow: 'none',
      },
      body: {
        padding: 0,
        lineHeight: 0,
      },
    },
    children: (
      <Image
        src={src}
        alt={alt}
        fit={circular ? 'cover' : 'contain'}
        radius={circular ? '50%' : 'md'}
        onClick={() => modals.close('image-preview')}
        style={
          circular
            ? {
                // largura e altura usam a MESMA expressão (baseada em
                // vmin) para garantir um círculo perfeito em qualquer
                // proporção de tela — em mobile (retrato), vw e vh têm
                // valores bem diferentes, então usar unidades distintas
                // por eixo resultava numa "oval"
                width: 'min(70vmin, 420px)',
                height: 'min(70vmin, 420px)',
                cursor: 'zoom-out',
              }
            : {
                maxWidth: 'min(68vw, 420px)',
                maxHeight: 'min(64vh, 420px)',
                width: 'auto',
                height: 'auto',
                cursor: 'zoom-out',
              }
        }
      />
    ),
  })
}
