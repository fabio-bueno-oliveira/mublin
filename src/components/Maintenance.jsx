import { Badge, Button, Center, Paper, Stack, Text, Title } from '@mantine/core'

/**
 * GigsMaintenance
 * -----------------------------------------------------------------------
 * Tela de manutenção para a aba "Gigs" do Mublin.
 * Conceito: em vez de um alerta genérico de erro, tratamos a manutenção
 * como um "soundcheck" — algo natural e familiar pra quem é músico.
 * A barra de equalizador animada é o elemento de assinatura: remete a
 * afinar/testar o som antes do show, reforçando a mensagem "estamos
 * ajustando os últimos detalhes" sem soar como uma tela de erro.
 *
 * Paleta (definida via CSS vars locais, não conflita com o tema Mantine):
 *   --mub-ink    #1C1B29  texto principal / stage escuro
 *   --mub-bg     #F5F3FA  fundo lilás-claro (papel de set list)
 *   --mub-amber  #FFB84D  luz de spotlight (acento principal)
 *   --mub-teal   #2F7A78  cortina/coxia (acento secundário)
 *   --mub-rose   #FF6F59  detalhe de destaque (badge "em breve")
 *
 * Tipografia sugerida (opcional): importe no seu index.html /
 * ThemeProvider global, não faça o import aqui pra não repetir a
 * requisição em cada render:
 *   <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&family=Inter:wght@400;500&display=swap" rel="stylesheet" />
 *
 * Uso:
 *   <GigsMaintenance onBack={() => navigate('/dashboard')} />
 */
export default function Maintenance({ onBack }) {
  return (
    <Center mih="70vh" px="md">
      <style>{`
        .gigs-maintenance-root {
          --mub-ink: #1C1B29;
          --mub-bg: #F5F3FA;
          --mub-amber: #FFB84D;
          --mub-teal: #2F7A78;
          --mub-rose: #FF6F59;
        }

        @keyframes gm-eq {
          0%, 100% { transform: scaleY(0.35); }
          50% { transform: scaleY(1); }
        }

        @keyframes gm-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }

        @keyframes gm-sweep {
          0%, 100% { transform: rotate(-6deg); }
          50% { transform: rotate(6deg); }
        }

        .gm-bar {
          width: 6px;
          border-radius: 3px;
          transform-origin: bottom;
          animation: gm-eq 1.1s ease-in-out infinite;
        }

        .gm-spotlight {
          transform-origin: 90px 8px;
          animation: gm-sweep 4.5s ease-in-out infinite;
        }

        .gm-note {
          animation: gm-float 3.2s ease-in-out infinite;
        }

        @media (prefers-reduced-motion: reduce) {
          .gm-bar, .gm-spotlight, .gm-note {
            animation: none !important;
          }
        }
      `}</style>

      <Paper
        className="gigs-maintenance-root"
        radius="lg"
        p="lg"
        maw={460}
        w="100%"
        style={{
          // backgroundColor: 'var(--mub-bg)',
          // border: '1px solid rgba(28,27,41,0.06)',
          textAlign: 'center',
        }}
      >
        <Stack align="center" gap="md">
          {/* Ilustração: soundcheck no palco */}
          <svg
            width="180"
            height="150"
            viewBox="0 0 180 150"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            role="img"
            aria-label="Ilustração de um microfone em um palco durante um soundcheck"
          >
            <defs>
              <radialGradient id="gm-glow" cx="50%" cy="0%" r="75%">
                <stop offset="0%" stopColor="var(--mub-amber)" stopOpacity="0.55" />
                <stop offset="100%" stopColor="var(--mub-amber)" stopOpacity="0" />
              </radialGradient>
              <linearGradient id="gm-curtain" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--mub-teal)" stopOpacity="0.18" />
                <stop offset="100%" stopColor="var(--mub-teal)" stopOpacity="0.04" />
              </linearGradient>
            </defs>

            {/* coxias */}
            <rect x="0" y="0" width="26" height="150" fill="url(#gm-curtain)" rx="4" />
            <rect x="154" y="0" width="26" height="150" fill="url(#gm-curtain)" rx="4" />

            {/* feixe de luz */}
            <g className="gm-spotlight">
              <polygon points="90,8 58,120 122,120" fill="url(#gm-glow)" />
            </g>

            {/* notas musicais flutuando */}
            <g className="gm-note" style={{ animationDelay: '0s' }}>
              <circle cx="46" cy="40" r="4.5" fill="var(--mub-rose)" />
              <rect
                x="49"
                y="16"
                width="2.4"
                height="26"
                rx="1.2"
                fill="var(--mub-rose)"
              />
            </g>
            <g className="gm-note" style={{ animationDelay: '0.6s' }}>
              <circle cx="134" cy="54" r="4" fill="var(--mub-teal)" />
              <rect
                x="136.6"
                y="32"
                width="2.2"
                height="24"
                rx="1.1"
                fill="var(--mub-teal)"
              />
            </g>

            {/* pedestal e microfone */}
            <line
              x1="90"
              y1="120"
              x2="90"
              y2="150"
              stroke="var(--mub-ink)"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <line
              x1="72"
              y1="150"
              x2="108"
              y2="150"
              stroke="var(--mub-ink)"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <line
              x1="90"
              y1="120"
              x2="90"
              y2="98"
              stroke="var(--mub-ink)"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <rect x="82" y="72" width="16" height="28" rx="8" fill="var(--mub-ink)" />
            <rect
              x="85.5"
              y="77"
              width="9"
              height="4"
              rx="2"
              fill="var(--mub-bg)"
              opacity="0.5"
            />
            <rect
              x="85.5"
              y="84"
              width="9"
              height="4"
              rx="2"
              fill="var(--mub-bg)"
              opacity="0.5"
            />

            {/* barras de equalizador (soundcheck) */}
            <g transform="translate(60, 128)">
              <rect
                className="gm-bar"
                x="0"
                y="-14"
                width="6"
                height="14"
                fill="var(--mub-amber)"
                style={{ animationDelay: '0s' }}
              />
              <rect
                className="gm-bar"
                x="12"
                y="-14"
                width="6"
                height="14"
                fill="var(--mub-rose)"
                style={{ animationDelay: '0.15s' }}
              />
              <rect
                className="gm-bar"
                x="90"
                y="-14"
                width="6"
                height="14"
                fill="var(--mub-teal)"
                style={{ animationDelay: '0.3s' }}
              />
              <rect
                className="gm-bar"
                x="102"
                y="-14"
                width="6"
                height="14"
                fill="var(--mub-amber)"
                style={{ animationDelay: '0.45s' }}
              />
            </g>
          </svg>

          <Title order={3} fw={700} mt="sm">
            Estamos afinando os últimos detalhes
          </Title>

          <Text size="sm" style={{ opacity: 0.7 }}>
            A página de Gigs está passando por uma repaginada pra te trazer oportunidades
            ainda melhores. Volte em breve!.
          </Text>

          {onBack && (
            <Button size="sm" onClick={onBack} variant="light" color="gray" radius="md">
              Voltar
            </Button>
          )}
        </Stack>
      </Paper>
    </Center>
  )
}
