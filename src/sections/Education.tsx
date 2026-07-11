import { useRef } from 'react'
import { motion } from 'motion/react'
import { gsap, useGSAP } from '../lib/gsap'
import { Counter, SectionHeading, springSnappy, springSoft } from '../components/micro'
import { catReceipt, education } from '../content'

export default function Education() {
  const ref = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.utils.toArray<HTMLElement>('.edu-row').forEach((row) => {
          gsap.from(row, {
            y: 54,
            autoAlpha: 0,
            duration: 1,
            ease: 'power3.out',
            scrollTrigger: { trigger: row, start: 'top 88%', once: true },
          })
        })

        gsap.from('.edu-receipt', {
          y: 60,
          rotate: 2.5,
          autoAlpha: 0,
          duration: 1.2,
          ease: 'power3.out',
          scrollTrigger: { trigger: '.edu-receipt', start: 'top 85%', once: true },
        })

        gsap.utils.toArray<HTMLElement>('.edu-bar').forEach((bar) => {
          gsap.from(bar, {
            scaleX: 0,
            transformOrigin: 'left center',
            duration: 1.4,
            ease: 'expo.out',
            scrollTrigger: { trigger: bar, start: 'top 90%', once: true },
          })
        })
      })
    },
    { scope: ref },
  )

  return (
    <section id="education" ref={ref} data-act="day" className="relative mt-28 md:mt-40">
      <SectionHeading index="03/" title="Education" note="THE PAPER TRAIL" />

      <div className="grid gap-14 px-5 md:grid-cols-[1.45fr_1fr] md:gap-16 md:px-10">
        {/* institution ledger */}
        <div>
          {education.map((e) => (
            <motion.div
              key={e.degree}
              whileHover={{ x: 10 }}
              transition={springSnappy}
              className={`edu-row rule-top grid grid-cols-[1fr_auto] items-baseline gap-4 py-7 md:py-9 ${
                e.current ? 'frame-ants px-4 md:px-6' : ''
              }`}
            >
              <div>
                <h3
                  className={`face-poster text-fg font-semibold ${
                    e.current ? 'text-3xl md:text-5xl' : 'text-2xl md:text-4xl'
                  }`}
                >
                  {e.school}
                </h3>
                <p className="text-fg-dim mt-2 font-mono text-xs tracking-[0.16em] md:text-sm">
                  {e.degree.toUpperCase()}
                </p>
                {e.note && (
                  <p className="text-rose mt-2 font-mono text-xs tracking-[0.14em] md:text-sm">
                    ▲ {e.note.toUpperCase()}
                  </p>
                )}
              </div>
              <div className="text-right">
                {e.current ? (
                  <span className="text-rose flex items-center justify-end gap-2 font-mono text-sm md:text-lg">
                    <span className="dot-live" /> {e.score}
                  </span>
                ) : (
                  <span className="face-poster text-fg block text-2xl font-semibold md:text-4xl">
                    {e.score}
                  </span>
                )}
                <span className="text-muted mt-1 block font-mono text-xs tracking-[0.14em] md:text-sm">
                  {e.period}
                </span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* CAT scorecard, printed like a broker receipt */}
        <motion.div
          whileHover={{ rotate: -1.2, y: -6 }}
          transition={springSoft}
          className="edu-receipt receipt h-fit self-start p-6 md:sticky md:top-24 md:p-8"
        >
          <p className="text-fg-dim font-mono text-xs tracking-[0.22em]">{catReceipt.title}</p>
          <div className="border-line-strong mt-4 border-t border-dashed" />

          <div className="mt-5 flex flex-col gap-5">
            {catReceipt.rows.map((r) => (
              <div key={r.label}>
                <div className="flex items-baseline justify-between font-mono text-xs md:text-sm">
                  <span className="text-fg-dim">{r.label}</span>
                  <span className={r.pct > 99 ? 'text-rose' : 'text-fg'}>
                    <Counter value={r.pct} decimals={2} /> %ILE
                  </span>
                </div>
                <div className="bg-bg2 mt-2 h-[3px] w-full overflow-hidden">
                  <div
                    className={`edu-bar h-full ${r.pct > 99 ? 'bg-rose' : 'bg-fg-dim'}`}
                    style={{ width: `${r.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="border-line-strong mt-6 border-t border-dashed pt-5">
            <div className="flex items-baseline justify-between">
              <span className="text-fg-dim font-mono text-xs tracking-[0.22em]">OVERALL</span>
              <span className="face-poster text-rose text-5xl font-semibold md:text-6xl">
                <Counter value={catReceipt.overall} decimals={2} />
              </span>
            </div>
            <p className="text-muted mt-4 font-mono text-[9px] tracking-[0.18em] md:text-[10px]">
              {catReceipt.footer}
            </p>
            {/* barcode */}
            <div
              className="mt-5 h-10 w-full opacity-70"
              style={{
                background:
                  'repeating-linear-gradient(90deg, var(--t-fg) 0 2px, transparent 2px 5px, var(--t-fg) 5px 6px, transparent 6px 11px)',
              }}
            />
          </div>
        </motion.div>
      </div>
    </section>
  )
}
