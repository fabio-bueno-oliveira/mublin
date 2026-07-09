import { useEffect } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Helmet } from 'react-helmet-async'
import { fetchProductInfo } from '../queries/gear'
import { Container, Box, ActionIcon, Text, Group, Affix, em } from '@mantine/core'
import { useMediaQuery, useWindowScroll } from '@mantine/hooks'
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch'
import {
  IconArrowLeft,
  IconZoomIn,
  IconZoomOut,
  IconRefresh,
  IconX,
} from '@tabler/icons-react'
import AppNavbarMobile from '../components/AppNavbarMobile'

const PATH_PRODUCT_IMG = 'https://ik.imagekit.io/mublin/products/'

export default function GearItemZoom() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const productImagePath = searchParams.get('src')
  const isMobile = useMediaQuery(`(max-width: ${em(750)})`)
  const [, scrollTo] = useWindowScroll()

  useEffect(() => {
    scrollTo({ y: 0 })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const { data: product } = useQuery({
    queryKey: ['product', slug],
    queryFn: () => fetchProductInfo(slug),
    enabled: !!slug,
    staleTime: 1000 * 60 * 10,
    retry: 1,
  })

  if (!productImagePath) {
    return <div>Imagem não encontrada</div>
  }

  return (
    <>
      <Helmet>
        <meta charSet="utf-8" />
        <title>{`Imagem de ${product?.name} | ${product?.brands?.name} | Mublin`}</title>
        <link rel="canonical" href={`https://mublin.com/gear/${product?.slug}/zoom`} />
      </Helmet>

      {/* {isMobile && (
        <Affix position={{ top: 0, left: 0 }} w="100%">
          <AppNavbarMobile pageName={`${product?.brands?.name} · ${product?.name}`} />
        </Affix>
      )} */}

      <Container size="lg" mt={{ base: 60, sm: 16 }} p={0}>
        <Group visibleFrom="sm">
          <IconArrowLeft
            size={22}
            style={{ flexShrink: 0, cursor: 'pointer' }}
            onClick={() => navigate(-1) || navigate('/home')}
          />
          <Text size="md" fw={500}>
            {product?.brands?.name} · {product?.name}
          </Text>
        </Group>

        <Box
          mt={{ base: 80, sm: 26 }}
          style={{
            width: '100%',
            height: '68vh',
            background: '#000',
            overflow: 'hidden',
          }}
        >
          <TransformWrapper
            initialScale={1}
            minScale={0.5}
            maxScale={8}
            centerOnInit
            limitToBounds={false}
            doubleClick={{ mode: 'zoomIn', step: 0.7 }}
            wheel={{ step: 0.002 }}
            pinch={{ step: 5 }}
            panning={{ velocityDisabled: true }}
          >
            {({ zoomIn, zoomOut, resetTransform }) => (
              <>
                <TransformComponent
                  wrapperStyle={{ width: '100%', height: '100%' }}
                  contentStyle={{ width: '100%', height: '100%' }}
                >
                  <img
                    src={PATH_PRODUCT_IMG + productImagePath}
                    alt="Zoom"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain',
                      userSelect: 'none',
                      pointerEvents: 'all',
                    }}
                    draggable={false}
                  />
                </TransformComponent>

                <Affix
                  position={{ top: isMobile ? 20 : 80, right: '9%' }}
                  // style={{ transform: 'translateX(-50%)' }}
                >
                  <Group gap="xs">
                    <ActionIcon
                      size="xl"
                      radius="xl"
                      variant="filled"
                      color="dark"
                      onClick={() => zoomOut()}
                    >
                      <IconZoomOut size={20} />
                    </ActionIcon>
                    <ActionIcon
                      size="xl"
                      radius="xl"
                      variant="filled"
                      color="dark"
                      onClick={() => resetTransform()}
                    >
                      <IconRefresh size={20} />
                    </ActionIcon>
                    <ActionIcon
                      size="xl"
                      radius="xl"
                      variant="filled"
                      color="dark"
                      onClick={() => zoomIn()}
                    >
                      <IconZoomIn size={20} />
                    </ActionIcon>
                    <ActionIcon
                      size="xl"
                      radius="xl"
                      variant="filled"
                      color="dark"
                      onClick={() => navigate(-1) || navigate('/home')}
                    >
                      <IconX size={20} />
                    </ActionIcon>
                  </Group>
                </Affix>
              </>
            )}
          </TransformWrapper>
        </Box>
      </Container>
    </>
  )
}
