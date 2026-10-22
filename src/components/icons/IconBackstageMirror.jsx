/**
 * IconBackstageMirrorFilled
 * Estilo @tabler/icons-react (variante filled) - espelho de camarim
 * com moldura escura e grossa e lâmpadas redondas dentro da moldura.
 *
 * Construção: um único path com fill-rule "evenodd":
 *   moldura externa  -  janela do espelho  -  furos das lâmpadas
 * Os furos e a janela ficam transparentes, então o ícone funciona
 * em qualquer fundo (claro/escuro) e herda a cor via `color`.
 *
 * Grid 24x24, desenho ocupando x = 3.5 a 20.5 e y = 2 a 22 (centrado em 12,12).
 */

const BULB_R = 1.2

// Moldura externa (17 x 20, cantos arredondados r = 1.5)
const FRAME =
  'M5 2H19A1.5 1.5 0 0 1 20.5 3.5V20.5A1.5 1.5 0 0 1 19 22H5A1.5 1.5 0 0 1 3.5 20.5V3.5A1.5 1.5 0 0 1 5 2Z'

// Janela do espelho (9 x 12, r = 0.5): moldura de 4 em cada lado
const WINDOW =
  'M8 6H16A.5 .5 0 0 1 16.5 6.5V17.5A.5 .5 0 0 1 16 18H8A.5 .5 0 0 1 7.5 17.5V6.5A.5 .5 0 0 1 8 6Z'

// Lâmpadas: 5 no topo (y = 4) + 4 em cada lateral, espaçamento de 3.25
const BULBS = [
  [5.5, 4],
  [8.75, 4],
  [12, 4],
  [15.25, 4],
  [18.5, 4],
  [5.5, 7.25],
  [5.5, 10.5],
  [5.5, 13.75],
  [5.5, 17],
  [18.5, 7.25],
  [18.5, 10.5],
  [18.5, 13.75],
  [18.5, 17],
]

const circle = (cx, cy, r) =>
  `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0Z`

export function IconBackstageMirrorFilled({
  size = 24,
  color = 'currentColor',
  bulbRadius = BULB_R,
  ...rest
}) {
  const d = [FRAME, WINDOW, ...BULBS.map(([cx, cy]) => circle(cx, cy, bulbRadius))].join(
    '',
  )

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className="icon icon-tabler icons-tabler-filled icon-tabler-backstage-mirror-filled"
      {...rest}
    >
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <path d={d} fill={color} fillRule="evenodd" />
    </svg>
  )
}

export default IconBackstageMirrorFilled
