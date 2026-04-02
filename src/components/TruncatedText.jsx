import {
  Text
} from '@mantine/core'

export default function TruncatedBio({ fontSize, text, maxLength }) {
  if (!text || text.length <= maxLength) return text;

  return (
    <>
      {text.substring(0, maxLength)}...
      <Text 
        span 
        fw={600}
        fz={fontSize}
        style={{ cursor: 'pointer' }}
      >
        {" "}ver mais
      </Text>
    </>
  )
}