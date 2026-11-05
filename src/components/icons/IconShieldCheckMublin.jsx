/**
 * IconShieldCheckMublin
 * Estilo @tabler/icons-react - escudo com check (outline) do Mublin.
 * Detalhe exclusivo: o contorno é sólido no topo e vai "se desfazendo"
 * em traços cada vez menores (até virar ponto) conforme desce até a ponta.
 *
 * Grid 24x24, desenho ocupando y = 3 a 21 (centrado em 12).
 * Geometria do escudo baseada no icon-tabler-shield.
 */

// Traços progressivos: [traço, vão, traço, vão, ...] em unidades normalizadas
// pelo pathLength (cada lateral do escudo tem 20 unidades, do ombro até a ponta).
// Traços ficam menores e vãos maiores a cada passo; o último é um ponto.
const FADE_DASH = '4.5 3.2 2.6 3.6 1.2 4.8 0.01 1'

export function IconShieldCheckMublin({
  size = 24,
  color = 'currentColor',
  stroke = 2,
  title = 'Projeto verificado',
  ...rest
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      title={title}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="icon icon-tabler icons-tabler-outline icon-tabler-shield-check-mublin"
      {...rest}
    >
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      {/* Topo do escudo (sólido) */}
      <path d="M3.5 6a12 12 0 0 0 8.5 -3a12 12 0 0 0 8.5 3" />
      {/* Lateral direita: do ombro até a ponta, tracejado progressivo */}
      <path d="M20.5 6a12 12 0 0 1 -8.5 15" pathLength="20" strokeDasharray={FADE_DASH} />
      {/* Lateral esquerda: espelhada, também do ombro até a ponta */}
      <path d="M3.5 6a12 12 0 0 0 8.5 15" pathLength="20" strokeDasharray={FADE_DASH} />
      {/* Check */}
      <path d="M9 12l2 2l4 -4" />
    </svg>
  )
}

export default IconShieldCheckMublin
