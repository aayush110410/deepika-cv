import { useRef } from 'react'
import { gsap, useGSAP } from '../lib/gsap'
import Aurora from '../components/Aurora'
import Petals from '../components/Petals'
import { vision } from '../content'

/* Milestones plotted like an equity curve — x/y in the 1200×400 viewBox. */
const PTS: [number, number][] = [
  [60, 340],
  [270, 292],
  [480, 308],
  [700, 180],
  [920, 208],
  [1140, 82],
]
/* cumulative share of path length at each point (precomputed) */
const FRACS = [0, 0.186, 0.369, 0.589, 0.781, 1]

export default function Vision() {
  const ref = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.from('.vt-title', {
          y: 56,
          autoAlpha: 0,
          duration: 1,
          ease: 'power3.out',
          scrollTrigger: { trigger: ref.current, start: 'top 72%', once: true },
        })
        gsap.from('.vt-kicker', {
          yPercent: 130,
          duration: 0.8,
          ease: 'power4.out',
          scrollTrigger: { trigger: ref.current, start: 'top 75%', once: true },
        })

        // the curve inks itself and each milestone pops as the line reaches it
        const path = ref.current!.querySelector('.vt-path') as SVGPathElement
        const len = path.getTotalLength()
        gsap.set(path, { strokeDasharray: len, strokeDashoffset: len })

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: '.vt-chart',
            start: 'top 82%',
            end: 'center 42%',
            scrub: 0.7,
          },
        })
        tl.to(path, { strokeDashoffset: 0, ease: 'none', duration: 1 }, 0)
        gsap.utils.toArray<SVGGElement>('.vt-node').forEach((node, i) => {
          tl.from(
            node,
            { scale: 0, transformOrigin: 'center center', duration: 0.05, ease: 'back.out(2)' },
            Math.max(0, FRACS[i] - 0.015),
          )
        })
      })
    },
    { scope: ref },
  )

  return (
    <section
      ref={ref}
      data-act="night"
      className="relative mt-28 flex min-h-[92svh] flex-col items-center justify-center overflow-hidden px-5 py-24 text-center md:mt-40 md:px-10"
    >
      <Aurora flip amplitude={0.9} blend={0.65} colorStops={['#e0537f', '#cf9a52', '#b89be6']} />
      <Petals count={6} />

      <div className="relative z-10 w-full max-w-6xl">
        <div className="overflow-hidden">
          <p className="vt-kicker text-rose font-mono text-xs tracking-[0.3em] md:text-sm">
            06/ — {vision.kicker}
          </p>
        </div>

        <h2 className="vt-title face-poster text-fg mt-6 text-4xl font-semibold md:text-6xl">
          <span className="text-foil">Compounding,</span> since 2020.
        </h2>

        <svg
          className="vt-chart mx-auto mt-14 w-full md:mt-20"
          viewBox="0 0 1200 400"
          fill="none"
          aria-label="Milestones: ICSE 94.2% (2020), ISC 94.5% (2022), BBA 9.37 rank 1 of 315 (2025), CAT 96.75 percentile (2025), PGDM at MDI Gurgaon (2026–28), goal: Fund Manager"
        >
          {/* faint grid */}
          {[110, 210, 310].map((y) => (
            <line key={y} x1="0" y1={y} x2="1200" y2={y} stroke="var(--t-line)" strokeWidth="1" />
          ))}

          <path
            className="vt-path"
            d={`M${PTS.map((p) => p.join(' ')).join(' L')}`}
            stroke="var(--color-rose)"
            strokeWidth="3"
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {vision.milestones.map((m, i) => {
            const [x, y] = PTS[i]
            const last = i === PTS.length - 1
            const above = i % 2 === 0
            const labelY = above ? y - 46 : y + 40
            const yearY = above ? y - 26 : y + 60
            return (
              <g key={m.label} className="vt-node">
                {last && (
                  <circle className="vt-pulse" cx={x} cy={y} r="12" stroke="var(--color-gold)" strokeWidth="2" />
                )}
                <circle
                  cx={x}
                  cy={y}
                  r={last ? 11 : 8}
                  fill={last ? 'var(--color-gold)' : 'var(--t-bg)'}
                  stroke={last ? 'var(--color-gold)' : 'var(--color-rose)'}
                  strokeWidth="3"
                />
                <text
                  x={x}
                  y={labelY}
                  textAnchor={last ? 'end' : i === 0 ? 'start' : 'middle'}
                  fill={last ? 'var(--color-gold)' : 'var(--t-fg)'}
                  style={{ font: '600 19px var(--font-mono)', letterSpacing: '0.08em' }}
                >
                  {m.label}
                </text>
                <text
                  x={x}
                  y={yearY}
                  textAnchor={last ? 'end' : i === 0 ? 'start' : 'middle'}
                  fill="var(--t-muted)"
                  style={{ font: '15px var(--font-mono)', letterSpacing: '0.14em' }}
                >
                  {m.year}
                </text>
              </g>
            )
          })}
        </svg>

        <p className="face-script text-rose mt-10 text-3xl md:mt-14 md:text-4xl">
          the line only knows one direction ✿
        </p>
      </div>
    </section>
  )
}
