/** The two acts of the Rosé Editorial theme. GSAP tweens :root between them on scroll. */
export const ACTS = {
  night: {
    '--t-bg': '#251018',
    '--t-bg2': '#2f1620',
    '--t-card': '#2c141e',
    '--t-fg': '#f9e9e2',
    '--t-fg-dim': '#d9b4b3',
    '--t-muted': '#a87e8b',
    '--t-line': 'rgba(249, 233, 226, 0.15)',
    '--t-line-strong': 'rgba(249, 233, 226, 0.34)',
  },
  day: {
    '--t-bg': '#f7ebe4',
    '--t-bg2': '#efdcd2',
    '--t-card': '#fdf6f1',
    '--t-fg': '#3a182b',
    '--t-fg-dim': '#70435a',
    '--t-muted': '#a3768c',
    '--t-line': 'rgba(58, 24, 43, 0.16)',
    '--t-line-strong': 'rgba(58, 24, 43, 0.38)',
  },
} as const

export type Act = keyof typeof ACTS
