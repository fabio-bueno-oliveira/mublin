/**
 * IconGuitarPedal
 *
 * Ícone de pedal de guitarra (stompbox) desenhado no mesmo padrão visual
 * do @tabler/icons-react: grid 24x24, stroke 2px, linecap/linejoin round,
 * sem preenchimento (fill="none").
 *
 * Segue a mesma API dos ícones do Tabler para ser um "drop-in replacement":
 *
 *   import { IconGuitarPedal } from '../assets/icons/IconGuitarPedal'
 *   <IconGuitarPedal size={24} color="currentColor" stroke={2} />
 *
 * Props:
 * - size: number | string — largura/altura do ícone (default: 24)
 * - color: string — cor do stroke (default: 'currentColor')
 * - stroke: number — espessura da linha (default: 2)
 * - ...rest — qualquer outra prop SVG (className, style, onClick, etc.)
 */
export function IconGuitarPedal({
  size = 24,
  color = 'currentColor',
  stroke = 2,
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
      className="icon icon-tabler icons-tabler-outline icon-tabler-guitar-pedal"
      {...rest}
    >
      {/* path decorativo, mantém compatibilidade com o padrão Tabler */}
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />

      {/* corpo do pedal (stompbox) */}
      <path d="M5 3m0 2a2 2 0 0 1 2 -2h10a2 2 0 0 1 2 2v14a2 2 0 0 1 -2 2h-10a2 2 0 0 1 -2 -2z" />

      {/* knobs de ajuste */}
      <circle cx="9" cy="7.5" r="1.25" />
      <circle cx="15" cy="7.5" r="1.25" />

      {/* led indicador */}
      <path d="M12 11v.01" />

      {/* footswitch */}
      <circle cx="12" cy="16" r="2.5" />
    </svg>
  )
}

export default IconGuitarPedal
