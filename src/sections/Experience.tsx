import { useRef } from 'react'
import { motion } from 'motion/react'
import { gsap, useGSAP } from '../lib/gsap'
import { SectionHeading, springSnappy, springSoft } from '../components/micro'
import { experience } from '../content'

function Card({ job }: { job: (typeof experience)[number] }) {
  return (
    <motion.article
      whileHover={{ y: -10, borderColor: 'var(--color-line-strong)' }}
      transition={springSoft}
      className="xp-card border-line bg-card/60 flex w-[88vw] shrink-0 flex-col justify-between border p-6 md:w-[56vw] md:p-10 lg:w-[46vw]"
    >
      <div>
        <div className="text-muted flex items-baseline justify-between font-mono text-[10px] tracking-[0.18em] md:text-xs">
          <span className="text-rose">{job.index}</span>
          <span>{job.period}</span>
          <span className="border-line-strong text-fg hidden rounded-full border px-3 py-1 md:inline-block">
            {job.tag}
          </span>
        </div>

        <h3 className="face-poster text-fg mt-6 text-3xl font-semibold md:mt-10 md:text-5xl">
          {job.role}
        </h3>
        <p className="text-fg-dim mt-2 font-mono text-[11px] tracking-[0.14em] md:text-xs">
          {job.company.toUpperCase()} · {job.place.toUpperCase()}
        </p>

        <p className="face-poster text-fg-dim mt-6 max-w-lg text-lg italic md:mt-8 md:text-2xl">
          {job.summary}
        </p>

        <ul className="mt-6 flex flex-col gap-2.5 md:mt-8">
          {job.points.map((p, i) => (
            <li key={p} className="flex gap-3 text-[13px] leading-snug md:text-sm">
              <span className="text-rose shrink-0 font-mono text-[10px] leading-[1.9]">
                {String.fromCharCode(97 + i)}.
              </span>
              <span className="text-fg-dim">{p}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-8 flex flex-wrap gap-2">
        {job.metrics.map((m) => (
          <motion.span
            key={m}
            whileHover={{ scale: 1.1, backgroundColor: 'rgba(224, 83, 127, 0.12)' }}
            transition={springSnappy}
            className="text-rose border-rose-deep rounded-full border px-3 py-1.5 font-mono text-[9px] tracking-[0.16em] md:text-[10px]"
          >
            {m}
          </motion.span>
        ))}
      </div>
    </motion.article>
  )
}

export default function Experience() {
  const ref = useRef<HTMLElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add('(min-width: 768px) and (prefers-reduced-motion: no-preference)', () => {
        const track = trackRef.current!
        const bar = ref.current!.querySelector('.xp-progress') as HTMLElement
        const setBar = gsap.quickSetter(bar, 'scaleX')

        gsap.to(track, {
          x: () => -(track.scrollWidth - window.innerWidth),
          ease: 'none',
          scrollTrigger: {
            trigger: ref.current,
            start: 'top top',
            end: () => '+=' + (track.scrollWidth - window.innerWidth),
            scrub: 1,
            pin: true,
            anticipatePin: 1,
            invalidateOnRefresh: true,
            onUpdate: (self) => setBar(self.progress),
          },
        })
      })

      mm.add('(max-width: 767px) and (prefers-reduced-motion: no-preference)', () => {
        gsap.utils.toArray<HTMLElement>('.xp-card').forEach((card) => {
          gsap.from(card, {
            y: 60,
            autoAlpha: 0,
            duration: 1,
            scrollTrigger: { trigger: card, start: 'top 88%', once: true },
          })
        })
      })
    },
    { scope: ref },
  )

  return (
    <section
      id="experience"
      ref={ref}
      data-act="day"
      className="relative mt-24 md:mt-36 md:h-svh md:overflow-hidden md:pt-14"
    >
      <div className="xp-progress bg-rose absolute top-0 left-0 z-20 h-[2px] w-full origin-left scale-x-0" />
      <SectionHeading index="02/" title="Experience" note="PLATIZIO SERVICES LLP — NOIDA" />

      <div ref={trackRef} className="flex flex-col gap-6 px-5 md:flex-row md:gap-8 md:px-10">
        {/* intro panel rides the rail on desktop */}
        <div className="flex w-full shrink-0 flex-col justify-between md:w-[30vw] md:pr-6">
          <p className="face-poster text-fg text-4xl leading-[1.05] md:text-[3.2vw]">
            Three seats.
            <br />
            One obsession:
            <br />
            <em className="text-rose">markets.</em>
          </p>
          <p className="text-muted mt-6 hidden font-mono text-[10px] tracking-[0.2em] md:block">
            SCROLL → THE LEDGER READS LEFT TO RIGHT
          </p>
        </div>

        {experience.map((job) => (
          <Card key={job.index} job={job} />
        ))}
      </div>
    </section>
  )
}
