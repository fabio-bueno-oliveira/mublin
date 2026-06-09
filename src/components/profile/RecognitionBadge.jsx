import { Flex, Text, Image } from '@mantine/core'
import MublinMLogoWhite from '../../assets/svg/mublin-m-logo-white.svg'

const COLORS = {
  purple: { bg: '#534AB7', iconColor: '#EEEDFE' },
  amber: { bg: '#854F0B', iconColor: '#FAEEDA' },
  green: { bg: '#0F6E56', iconColor: '#E1F5EE' },
  blue: { bg: '#185FA5', iconColor: '#E6F1FB' },
  teal: { bg: '#085041', iconColor: '#E1F5EE' },
  coral: { bg: '#993C1D', iconColor: '#FAECE7' },
  dark: { bg: '#000000', iconColor: '#f0e7fa', mublinLogo: true },
}

export default function RecognitionBadge({
  icon: Icon,
  label,
  description,
  color = 'purple',
}) {
  const { bg, iconColor, mublinLogo } = COLORS[color] ?? COLORS.purple

  return (
    <Flex direction="column" align="center" gap={6} w={110} wrap="wrap">
      <div
        style={{
          width: 64,
          height: 64,
          background: bg,
          clipPath: 'polygon(50% 0%, 93% 25%, 93% 75%, 50% 100%, 7% 75%, 7% 25%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {mublinLogo ? (
          <Image src={MublinMLogoWhite} h={26} w="auto" fit="contain" />
        ) : (
          <Icon size={26} color={iconColor} />
        )}
      </div>
      <Text
        size="12px"
        fw={500}
        ta="center"
        lh={1}
        style={{ whiteSpace: 'pre-line', cursor: 'default' }}
      >
        {label}
      </Text>
      {description && (
        <Text
          size="10px"
          fw={300}
          c="dimmed"
          ta="center"
          style={{ whiteSpace: 'pre-line', cursor: 'default' }}
        >
          {description}
        </Text>
      )}
    </Flex>
  )
}
