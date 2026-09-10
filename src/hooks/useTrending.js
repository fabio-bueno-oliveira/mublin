import dayjs from 'dayjs'

const STOPWORDS = new Set([
  'para',
  'com',
  'sobre',
  'entre',
  'como',
  'quando',
  'onde',
  'porque',
  'por que',
  'seu',
  'sua',
  'seus',
  'suas',
  'esse',
  'essa',
  'isso',
  'isto',
  'aquele',
  'aquela',
  'mais',
  'muito',
  'sendo',
  'apenas',
  'ainda',
  'tambem',
  'também',
  'depois',
  'antes',
  'nova',
  'novo',
  'novas',
  'novos',
  'primeira',
  'primeiro',
  'lança',
  'lanca',
  'single',
  'musica',
  'música',
  'ouça',
  'ouca',
  'confira',
  'veja',
  'the',
  'and',
  'for',
  'with',
  'from',
  'this',
  'that',
  'have',
  'has',
  'will',
])

function tokenize(title) {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 3 && !STOPWORDS.has(w))
}

function jaccard(aTokens, bTokens) {
  const a = new Set(aTokens)
  const b = new Set(bTokens)
  const inter = [...a].filter((x) => b.has(x)).length
  const union = new Set([...a, ...b]).size
  return union === 0 ? 0 : inter / union
}

/**
 * Recebe array de notícias e retorna Map<id, { count, isTrending }>
 * Usa apenas front-end, janela de 48h
 */
export function getTrendingMap(news) {
  if (!news || news.length === 0) return new Map()

  const recent = news.filter((n) => dayjs().diff(dayjs(n.published_at), 'hour') <= 48)
  const clusters = []

  for (const item of recent) {
    const tokens = tokenize(item.title)
    if (tokens.length < 2) continue

    let found = false
    for (const cluster of clusters) {
      const sim = jaccard(tokens, cluster.representativeTokens)
      const common = tokens.filter((t) => cluster.representativeTokens.includes(t))
      const hasRareMatch = common.filter((t) => t.length >= 5).length >= 1
      if (sim >= 0.45 || (common.length >= 2 && hasRareMatch)) {
        cluster.items.push(item)
        found = true
        break
      }
    }
    if (!found) {
      clusters.push({ representativeTokens: tokens, items: [item] })
    }
  }

  const map = new Map()
  for (const cluster of clusters) {
    if (cluster.items.length >= 2) {
      const distinctSources = new Set(cluster.items.map((i) => i.source_name)).size
      if (distinctSources >= 2) {
        for (const it of cluster.items) {
          map.set(it.id, { count: cluster.items.length, isTrending: true })
        }
      }
    }
  }
  return map
}

import { useMemo } from 'react'

export function useTrendingMap(news) {
  return useMemo(() => getTrendingMap(news), [news])
}
