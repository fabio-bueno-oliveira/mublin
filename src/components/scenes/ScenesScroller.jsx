import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  useMantineColorScheme,
  ScrollArea,
  Group,
  Box,
  Skeleton,
  Image,
} from '@mantine/core'
import { IconPlayerPlayFilled, IconPlus } from '@tabler/icons-react'
import ScenePlayer from './ScenePlayer'
import { getScenePosterUrl, getSceneAnimatedUrl } from './sceneMedia'

const BORDER_COLORS_LIGHT_MODE = ['var(--mantine-color-red-6)']
const BORDER_COLORS_DARK_MODE = ['white']

const THUMB_SIZES = {
  mini: {
    width: 42,
    height: 75,
    mediaWidth: 84,
    mediaHeight: 150,
    borderRadius: 6,
    innerBorderRadius: 5,
    borderPadding: 1.5,
    groupGap: 8,
    groupPy: 0,
    playTop: 3,
    playRight: 3,
    playSize: 12,
    playRadius: 6,
    playIconSize: 6,
    newSceneGap: 2,
    newSceneIconContainer: 20,
    newSceneIcon: 12,
    showAuthor: false,
    showNewLabel: false,
  },
  medium: {
    width: 78,
    height: 138,
    mediaWidth: 156,
    mediaHeight: 276,
    borderRadius: 10,
    innerBorderRadius: 8,
    borderPadding: 2,
    groupGap: 9,
    groupPy: 2,
    playTop: 5,
    playRight: 5,
    playSize: 17,
    playRadius: 9,
    playIconSize: 9,
    newSceneGap: 4,
    newSceneIconContainer: 28,
    newSceneIcon: 16,
    showAuthor: false,
    showNewLabel: true,
  },
  default: {
    width: 130,
    height: 230,
    mediaWidth: 260,
    mediaHeight: 460,
    borderRadius: 14,
    innerBorderRadius: 12,
    borderPadding: 2,
    groupGap: 10,
    groupPy: 4,
    playTop: 8,
    playRight: 8,
    playSize: 22,
    playRadius: 11,
    playIconSize: 12,
    newSceneGap: 6,
    newSceneIconContainer: 36,
    newSceneIcon: 20,
    showAuthor: true,
    showNewLabel: true,
  },
}

function getThumbSize(mini, medium) {
  if (mini) {
    return 'mini'
  }
  if (medium) {
    return 'medium'
  }
  return 'default'
}

function SceneThumb({ scene, index, isDark, onOpen, size, animated }) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  const dimensions = THUMB_SIZES[size]

  const posterUrl = getScenePosterUrl(scene.video_url, {
    width: dimensions.mediaWidth,
    height: dimensions.mediaHeight,
    time: 0.5,
  })

  const animatedUrl = getSceneAnimatedUrl(scene.video_url, {
    width: dimensions.mediaWidth,
    start: 0.5,
    fps: 8,
  })

  const borderColor = isDark
    ? BORDER_COLORS_DARK_MODE[index % BORDER_COLORS_DARK_MODE.length]
    : BORDER_COLORS_LIGHT_MODE[index % BORDER_COLORS_LIGHT_MODE.length]

  const displayUrl = animated
    ? animatedUrl
    : isHovered && !hasError
      ? animatedUrl
      : posterUrl

  return (
    <Box
      onClick={onOpen}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="sceneThumbBorder"
      style={{
        '--scene-thumb-color': borderColor,
        '--scene-border-radius': `${dimensions.borderRadius}px`,
        '--scene-inner-border-radius': `${dimensions.innerBorderRadius}px`,
        '--scene-border-padding': `${dimensions.borderPadding}px`,
        flex: '0 0 auto',
        cursor: 'pointer',
      }}
      data-size={size}
    >
      <Box
        className="sceneThumbInner"
        style={{
          width: dimensions.width,
          height: dimensions.height,
          position: 'relative',
          backgroundColor: '#000',
        }}
      >
        {!isLoaded && !hasError && (
          <Skeleton radius={0} w={dimensions.width} h={dimensions.height} />
        )}

        <Image
          src={displayUrl}
          loading="lazy"
          onLoad={() => setIsLoaded(true)}
          onError={() => setHasError(true)}
          fallbackSrc={posterUrl}
          w={dimensions.width}
          h={dimensions.height}
          fit="cover"
          style={{
            opacity: isLoaded || hasError ? 1 : 0,
            transition: 'opacity 250ms ease',
          }}
        />

        {dimensions.showAuthor && (
          <Box
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              padding: '8px',
              background: 'linear-gradient(transparent, rgba(0,0,0,0.75))',
              color: '#fff',
              fontSize: 11,
              pointerEvents: 'none',
            }}
          >
            por <b>@{scene.profile?.username || scene.profile?.full_name}</b>
          </Box>
        )}

        <Box
          style={{
            position: 'absolute',
            top: dimensions.playTop,
            right: dimensions.playRight,
            width: dimensions.playSize,
            height: dimensions.playSize,
            borderRadius: dimensions.playRadius,
            backgroundColor: 'rgba(0,0,0,0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
            backdropFilter: 'blur(4px)',
          }}
        >
          <IconPlayerPlayFilled size={dimensions.playIconSize} color="#fff" />
        </Box>
      </Box>
    </Box>
  )
}

function NewSceneThumb({ size, showButtonAddNewScene }) {
  const dimensions = THUMB_SIZES[size]

  if (!showButtonAddNewScene) {
    return null
  }

  return (
    <Box
      component={Link}
      to="/new/scene"
      className="sceneThumbBorder"
      style={{
        '--scene-thumb-color': 'var(--mantine-color-blue-6)',
        '--scene-border-radius': `${dimensions.borderRadius}px`,
        '--scene-inner-border-radius': `${dimensions.innerBorderRadius}px`,
        '--scene-border-padding': `${dimensions.borderPadding}px`,
        flex: '0 0 auto',
        cursor: 'pointer',
        textDecoration: 'none',
      }}
      title="Nova Scene"
      data-size={size}
      data-new="true"
    >
      <Box
        className="sceneThumbInner"
        style={{
          width: dimensions.width,
          height: dimensions.height,
          position: 'relative',
          backgroundColor: 'var(--mantine-color-dark-6)',
          background:
            'linear-gradient(135deg, var(--mantine-color-dark-6) 0%, var(--mantine-color-dark-7) 100%)',
          border: '1px dashed var(--mantine-color-dark-3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: dimensions.newSceneGap,
          transition: 'all 0.2s ease',
        }}
      >
        <Box
          style={{
            width: dimensions.newSceneIconContainer,
            height: dimensions.newSceneIconContainer,
            borderRadius: '50%',
            backgroundColor: 'var(--mantine-color-dark-4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <IconPlus
            size={dimensions.newSceneIcon}
            color="var(--mantine-color-gray-3)"
            stroke={2}
          />
        </Box>

        {/* {dimensions.showNewLabel && (
          <Box
            style={{
              fontSize: size === 'medium' ? 10 : 11,
              color: 'var(--mantine-color-gray-4)',
              fontWeight: 500,
            }}
          >
            Novo
          </Box>
        )} */}
      </Box>
    </Box>
  )
}

export default function ScenesScroller({
  scenes,
  isMobile,
  mini = false,
  medium = false,
  animated = false,
  showButtonAddNewScene = false,
}) {
  const [activeIndex, setActiveIndex] = useState(null)

  const { colorScheme } = useMantineColorScheme()
  const isDark = colorScheme === 'dark'

  const size = getThumbSize(mini, medium)
  const dimensions = THUMB_SIZES[size]

  const handleOpen = useCallback((index) => {
    setActiveIndex(index)

    if (window.history.state?.scenesOpen !== true) {
      window.history.pushState({ scenesOpen: true }, '', window.location.href)
    }
  }, [])

  const handleClose = useCallback(() => {
    if (window.history.state?.scenesOpen === true) {
      window.history.back()
    } else {
      setActiveIndex(null)
    }
  }, [])

  useEffect(() => {
    const onPopState = () => {
      if (activeIndex !== null) {
        setActiveIndex(null)
      }
    }

    window.addEventListener('popstate', onPopState)
    return () => {
      window.removeEventListener('popstate', onPopState)
    }
  }, [activeIndex])

  if (!scenes?.length && !showButtonAddNewScene) {
    return null
  }

  return (
    <>
      <ScrollArea type={isMobile ? 'never' : 'always'}>
        <Group wrap="nowrap" gap={dimensions.groupGap} py={dimensions.groupPy}>
          <NewSceneThumb size={size} showButtonAddNewScene={showButtonAddNewScene} />

          {scenes.map((scene, index) => (
            <SceneThumb
              key={scene.id}
              scene={scene}
              index={index}
              isDark={isDark}
              size={size}
              animated={animated}
              onOpen={() => handleOpen(index)}
            />
          ))}
        </Group>
      </ScrollArea>

      {activeIndex !== null && (
        <ScenePlayer
          scenes={scenes}
          initialIndex={activeIndex}
          onClose={handleClose}
          onForceClose={() => setActiveIndex(null)}
        />
      )}

      <style>{`
       .sceneThumbBorder {
          position: relative;
          border-radius: var(--scene-border-radius);
          padding: var(--scene-border-padding);
          overflow: hidden;
        }

       .sceneThumbBorder::before {
          content: '';
          position: absolute;
          inset: -60%;
          background: conic-gradient(
            from 0deg,
            transparent 0deg,
            var(--scene-thumb-color, var(--mantine-color-blue-6)) 40deg,
            transparent 100deg,
            transparent 360deg
          );
          animation: sceneThumbSpin 1.9s linear infinite;
        }

       .sceneThumbBorder[data-new="true"]::before {
          background: none;
          animation: none;
        }

       .sceneThumbBorder[data-new="true"]:hover::before {
          animation: sceneThumbSpin 2.8s linear infinite;
        }

        @keyframes sceneThumbSpin {
          to {
            transform: rotate(360deg);
          }
        }

       .sceneThumbInner {
          position: relative;
          z-index: 1;
          border-radius: var(--scene-inner-border-radius);
          overflow: hidden;
        }

       .sceneThumbBorder[data-new="true"]:hover.sceneThumbInner {
          border-color: var(--mantine-color-blue-6)!important;
        }

        @media (prefers-reduced-motion: reduce) {
         .sceneThumbBorder::before {
            animation: none;
          }
        }
      `}</style>
    </>
  )
}
