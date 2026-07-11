import { useRef } from 'react'
import { motion } from 'motion/react'
import { gsap, useGSAP } from '../lib/gsap'
import Marquee from '../components/Marquee'
import { SectionHeading, springSnappy, springSoft } from '../components/micro'
import { alsoFluent, leadership, medals } from '../content'

/* Calm ledger rows — a blush wash slides through on hover, nothing spins. */
function Row({ item }: { item: (typeof leadership)[number] }) {
  return (
    <motion.div
      whileHover="hover"
      className="ld-row border-line group relative overflow-hidden border-b"
    >
      {/* the wash */}
      <div className="from-rose/12 absolute inset-0 -translate-x-full bg-gradient-to-r to-transparent transition-transform duration-700 ease-out group-hover:translate-x-0" />

      <div className="relative grid gap-3 px-5 py-8 md:grid-cols-[7rem_1.2fr_1fr_auto] md:items-baseline md:gap-8 md:px-10 md:py-10">
        <span className="text-muted font-mono text-xs tracking-[0.18em] md:text-sm">
          {item.year}
        </span>
        <div>
          <motion.h3
            variants={{ hover: { x: 12 } }}
            transition={springSnappy}
            className="face-poster text-fg text-2xl font-semibold md:text-4xl"
          >
            {item.org}
          </motion.h3>
          <p className="text-rose mt-2 font-mono text-xs tracking-[0.16em] md:text-sm">
            {item.role.toUpperCase()}
          </p>
        </div>
        <p className="text-fg-dim text-sm leading-relaxed md:text-base">{item.story}</p>
        <span className="border-line-strong text-fg h-fit w-fit rounded-full border px-4 py-2 font-mono text-xs tracking-[0.16em]">
          {item.metric}
        </span>
      </div>
    </motion.div>
  )
}

export default function Leadership() {
  const ref = useRef<HTMLElement>(null)
  const medalShelfRef = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.from('.ld-row', {
          y: 48,
          autoAlpha: 0,
          duration: 0.9,
          stagger: 0.09,
          scrollTrigger: { trigger: '.ld-rows', start: 'top 82%', once: true },
        })
        gsap.from('.ld-medal', {
          scale: 0.85,
          autoAlpha: 0,
          duration: 0.8,
          ease: 'back.out(1.7)',
          stagger: 0.12,
          scrollTrigger: { trigger: '.ld-medals', start: 'top 85%', once: true },
        })
      })
    },
    { scope: ref },
  )

  return (
    <section id="beyond" ref={ref} data-act="night" className="relative mt-28 md:mt-40">
      <SectionHeading index="05/" title="Beyond the Desk" note="LEADERSHIP · SPORT · CRAFT" />

      <div className="ld-rows border-line border-t">
        {leadership.map((item) => (
          <Row key={item.org} item={item} />
        ))}
      </div>

      <div className="px-5 md:px-10">
        {/* the trophy shelf — pick a medal up and toss it, it springs home */}
        <div
          ref={medalShelfRef}
          className="ld-medals mt-16 grid gap-4 md:mt-24 md:grid-cols-3 md:gap-6"
        >
          {medals.map((m) => {
            const gold = m.metal.startsWith('GOLD')
            return (
              <motion.div
                key={m.event}
                drag
                dragConstraints={medalShelfRef}
                dragElastic={0.35}
                dragSnapToOrigin
                whileHover={{ y: -6, scale: 1.02 }}
                whileDrag={{ scale: 1.06, rotate: -2, cursor: 'grabbing' }}
                transition={springSoft}
                className={`ld-medal bg-card/70 flex cursor-grab items-center gap-5 border p-5 backdrop-blur-sm md:p-6 ${
                  gold ? 'border-gold/50' : 'border-line-strong'
                }`}
              >
                <span
                  className={`face-poster grid size-14 shrink-0 place-items-center rounded-full border text-[10px] font-semibold tracking-widest md:size-16 md:text-xs ${
                    gold
                      ? 'border-gold text-gold shadow-[0_0_24px_rgb(207_154_82_/_0.25)]'
                      : 'border-fg-dim text-fg-dim'
                  }`}
                >
                  {m.metal}
                </span>
                <div>
                  <p
                    className={`face-poster text-lg italic md:text-xl ${
                      gold ? 'text-gold' : 'text-fg'
                    }`}
                  >
                    {m.event}
                  </p>
                  <p className="text-muted mt-1.5 font-mono text-xs tracking-[0.18em]">{m.year}</p>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* second craft */}
      <div className="rule-top border-line mt-16 border-b md:mt-24">
        <Marquee duration={26} reverse className="py-4">
          <span className="label-caps text-fg-dim px-4 text-sm md:text-base">ALSO FLUENT IN</span>
          {alsoFluent.map((s) => (
            <span key={s} className="flex items-center">
              <span className="text-rose px-4 text-sm">✿</span>
              <span className="label-caps text-fg px-4 text-sm md:text-base">{s}</span>
            </span>
          ))}
        </Marquee>
      </div>
    </section>
  )
}
