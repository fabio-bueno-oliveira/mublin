/**
 * IconExplore
 *
 * Ícone "Explorar / Navegar": três níveis de pastas empilhadas em perspectiva,
 * com uma nota musical na pasta da frente.
 * Padrão @tabler/icons-react: grid 24x24, stroke 2px, linecap/linejoin round,
 * sem preenchimento (fill="none").
 *
 *   import { IconExplore } from '../assets/icons/IconExplore'
 *   <IconExplore size={24} color="currentColor" stroke={2} />
 *
 * Props:
 * - size: number | string — largura/altura do ícone (default: 24)
 * - color: string — cor do stroke (default: 'currentColor')
 * - stroke: number — espessura da linha (default: 1.6)
 * - ...rest — qualquer outra prop SVG (className, style, onClick, etc.)
 */
export function IconExplore({
  size = 24,
  color = 'currentColor',
  stroke = 1.6,
  ...rest
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="icon icon-tabler icons-tabler-outline icon-tabler-explore"
      {...rest}
    >
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />

      {/* nível 3: pasta mais ao fundo */}
      <path d="M7 3h10" />

      {/* nível 2: pasta do meio */}
      <path d="M5 7h14" />

      {/* nível 1: pasta da frente, borda larga em cima e base estreita */}
      <path d="M3 11h18l-2 8a1 1 0 0 1 -1 1h-12a1 1 0 0 1 -1 -1z" />

      {/* nota musical (traço mais fino para caber dentro da pasta) */}
      <g strokeWidth={stroke * 0.55}>
        <circle cx="11" cy="16.5" r="1" />
        <path d="M12 16.5v-3" />
        <path d="M12 13.5c1 0 2 .5 2 1.5" />
      </g>
    </svg>
  )
}

export default IconExplore
