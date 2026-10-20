/**
 * IconBrandMuso - Muso.ai
 * Estilo @tabler/icons-react - Muso.ai (M fluido + drips + play)
 */

// Compensa o centro óptico do desenho (≈12.8) para alinhar ao centro do viewBox (12)
const OFFSET_Y = -0.8

export function IconBrandMuso({
  size = 24,
  color = 'currentColor',
  stroke = 1.7,
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
      className="icon icon-tabler icons-tabler-outline icon-tabler-brand-muso"
      {...rest}
    >
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <g transform={`translate(0 ${OFFSET_Y})`}>
        <path d="M4 19.5 V7.2 C4 5.1 5.5 4 7.1 5.2 L12 10.2 L16.9 5.2 C18.5 4 20 5.1 20 7.2 V19.5 C20 20.8 18.2 21.4 17.1 20.3 L12 14.6 L6.9 20.3 C5.8 21.4 4 20.8 4 19.5 Z" />
        <path d="M7.1 9.2 V17" />
        <path d="M9.6 10.2 V13.2" />
        <path d="M14.2 12.2 L13 13.1 L14.2 14 Z" fill={color} stroke="none" />
        <path d="M17.2 10.2 V15.2" />
      </g>
    </svg>
  )
}

export function IconBrandMusoOutline({
  size = 24,
  color = 'currentColor',
  stroke = 1.7,
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
      className="icon icon-tabler icons-tabler-outline icon-tabler-brand-muso"
      {...rest}
    >
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <g transform={`translate(0 ${OFFSET_Y})`}>
        <path d="M4 19.5 V7.2 C4 5.1 5.5 4 7.1 5.2 L12 10.2 L16.9 5.2 C18.5 4 20 5.1 20 7.2 V19.5 C20 20.8 18.2 21.4 17.1 20.3 L12 14.6 L6.9 20.3 C5.8 21.4 4 20.8 4 19.5 Z" />
        <path d="M7.1 9.2 V17" />
        <path d="M9.6 10.2 V13.2" />
        <path d="M14.5 11.8 L13 13 L14.5 14.2 Z" />
        <path d="M17.2 10.2 V15.2" />
      </g>
    </svg>
  )
}

export default IconBrandMuso
