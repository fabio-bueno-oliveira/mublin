import { Center, VisuallyHidden } from '@mantine/core'
import classes from './MublinLoader.module.css'

// Um único path usado em duas camadas (contorno e preenchimento).
const LOGO_PATH =
  'm62.1 40.9q7 0 8 1.9 6.8 2 11.7 5.9 5.2-3.4 11.6-5.6 6.4-2.2 15.4-2.2 6.5 0 12.8 1.7 6.2 1.7 11.1 5.4 4.9 3.6 7.8 9.7 2.9 6.1 2.9 14.8v53.8q-1.7 0.5-5.4 1-3.7 0.6-7.6 0.6-3.8 0-6.8-0.6-3-0.5-5-2-2.1-1.5-3.2-4.2-1.1-2.6-1.1-6.9v-40.9q0-5.1-2.9-7.4-2.9-2.3-7.9-2.3-2.3 0-5.1 1.1-2.7 1.1-4.1 2.3 0.2 0.7 0.2 1.3 0 0.6 0 1.1v56.9q-1.9 0.5-5.6 1-3.6 0.6-7.4 0.6-3.8 0-6.7-0.6-3-0.5-5.1-2-2-1.5-3.1-4.2-1.2-2.6-1.2-6.9v-40.9q0-5.1-3.1-7.4-3.2-2.3-7.6-2.3-3.1 0-5.3 0.9-2.2 1-3.8 1.8v60q-1.7 0.5-5.4 1-3.6 0.6-7.6 0.6-3.7 0-6.7-0.6-3-0.5-5.1-2-2-1.5-3.1-4.2-1.1-2.6-1.1-6.9v-51.6q0-4.6 1.9-7.4 2-2.7 5.4-5.1 5.8-4.1 14.5-6.7 8.6-2.5 18-2.5z'

function MublinLogo({ size }) {
  return (
    <svg
      className={classes.logo}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 160 160"
      width={size}
      height={size}
      aria-hidden="true"
      focusable="false"
    >
      {/* Camada 1: preenchimento (aparece depois do contorno) */}
      <path className={classes.fill} d={LOGO_PATH} />

      {/* Camada 2: contorno sendo desenhado. pathLength=1 normaliza o comprimento
          do traço, então a animação funciona com qualquer path. */}
      <path className={classes.outline} d={LOGO_PATH} pathLength="1" />
    </svg>
  )
}

export default function MublinLoader({
  size = 80,
  label = 'Carregando...',
  color, // opcional, ex: "#000" ou "var(--mantine-color-blue-6)"
  fullscreen = false,
}) {
  return (
    <Center
      className={fullscreen ? classes.fullscreen : undefined}
      role="status"
      aria-live="polite"
      style={color ? { '--mublin-loader-color': color } : undefined}
    >
      <MublinLogo size={size} />
      <VisuallyHidden>{label}</VisuallyHidden>
    </Center>
  )
}
