// Duração assumida quando a gig não tem horário de fim
const DEFAULT_GIG_DURATION_MIN = 120
const DAY_MIN = 24 * 60

function timeToMinutes(time) {
  if (!time) {
    return null
  }
  const [hours, minutes] = time.split(':').map(Number)
  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return null
  }
  return hours * 60 + minutes
}

// Aceita "HH:MM" ou "HH:MM:SS". Retorna o intervalo em minutos desde 00:00.
function getTimeRange(start, end) {
  const startMin = timeToMinutes(start)
  if (startMin === null) {
    return null
  }

  let endMin = timeToMinutes(end)
  if (endMin === null) {
    endMin = startMin + DEFAULT_GIG_DURATION_MIN
  } else if (endMin <= startMin) {
    endMin += DAY_MIN // atravessa a meia-noite (ex.: 22:00 → 02:00)
  }

  return { start: startMin, end: endMin }
}

/**
 * @param existingGigs retorno de fetchUserGigsByDate (itens com .gig)
 * @param candidate { start, end } no formato "HH:MM"
 */
export function findGigTimeConflicts(existingGigs, { start, end }) {
  const candidate = getTimeRange(start, end)
  if (!candidate) {
    return []
  }

  return existingGigs.filter(({ gig }) => {
    if (!gig || gig.is_canceled) {
      return false
    }
    const other = getTimeRange(gig.time_stage_start, gig.time_stage_end)
    if (!other) {
      return false
    }
    // Estrito: gigs "encostadas" (uma termina 17:00, outra começa 17:00) não conflitam
    return candidate.start < other.end && other.start < candidate.end
  })
}
