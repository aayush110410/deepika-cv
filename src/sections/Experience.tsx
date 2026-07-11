import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'motion/react'
import { gsap, useGSAP } from '../lib/gsap'
import { useLenisInstance } from '../hooks/useLenis'
import { SectionHeading, springSnappy, springSoft } from '../components/micro'
import { experience } from '../content'

type Job = (typeof experience)[number]

function Card({ job, onOpen }: { job: Job; onOpen: () => void }) {
  return (
    <motion.article
      whileHover={{ y: -10, borderColor: 'var(--color-line-strong)' }}
      transition={springSoft}
      onClick={onOpen}
      data-cursor="hover"
      className="xp-card border-line bg-card/60 flex w-[88vw] shrink-0 cursor-pointer flex-col justify-between border p-6 md:w-[56vw] md:p-10 lg:w-[46vw]"
    >
      <div>
        <div className="text-muted flex items-baseline justify-between font-mono text-xs tracking-[0.18em] md:text-sm">
          <span className="text-rose">{job.index}</span>
          <span>{job.period}</span>
          <span className="border-line-strong text-fg hidden rounded-full border px-3 py-1 md:inline-block">
            {job.tag}
          </span>
        </div>

        <h3 className="face-poster text-fg mt-6 text-3xl font-semibold md:mt-10 md:text-5xl">
          {job.role}
        </h3>
        <p className="text-fg-dim mt-2 font-mono text-xs tracking-[0.14em] md:text-sm">
          {job.company.toUpperCase()} · {job.place.toUpperCase()}
        </p>

        <p className="face-poster text-fg-dim mt-6 max-w-lg text-lg italic md:mt-8 md:text-2xl">
          {job.summary}
        </p>

        <ul className="mt-6 flex flex-col gap-2.5 md:mt-8">
          {job.points.slice(0, 4).map((p, i) => (
            <li key={p} className="flex gap-3 text-sm leading-snug md:text-[15px]">
              <span className="text-rose shrink-0 font-mono text-xs leading-[1.8]">
                {String.fromCharCode(97 + i)}.
              </span>
              <span className="text-fg-dim">{p}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          {job.metrics.map((m) => (
            <motion.span
              key={m}
              whileHover={{ scale: 1.1, backgroundColor: 'rgba(224, 83, 127, 0.12)' }}
              transition={springSnappy}
              className="text-rose border-rose-deep rounded-full border px-3 py-1.5 font-mono text-[10px] tracking-[0.16em] md:text-xs"
            >
              {m}
            </motion.span>
          ))}
        </div>
        <span className="text-rose link-sweep font-mono text-xs tracking-[0.18em] md:text-sm">
          FULL CHAPTER ↗
        </span>
      </div>
    </motion.article>
  )
}

/** Full-screen chapter — portal keeps it outside the pinned transform. */
function ChapterModal({ job, onClose }: { job: Job | null; onClose: () => void }) {
  const lenis = useLenisInstance()

  useEffect(() => {
    if (!job) return
    lenis?.stop()
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => {
      lenis?.start()
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [job, lenis, onClose])

  return createPortal(
    <AnimatePresence>
      {job && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <motion.div
            className="bg-plum/75 absolute inset-0 backdrop-blur-md"
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={job.role}
            className="bg-card border-line-strong relative max-h-full w-full max-w-5xl overflow-y-auto border p-7 md:p-12"
            initial={{ y: 64, scale: 0.96, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: 40, scale: 0.97, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 240, damping: 26 }}
          >
            <div className="text-muted flex items-baseline justify-between gap-4 font-mono text-xs tracking-[0.18em] md:text-sm">
              <span className="text-rose">{job.index} — {job.tag}</span>
              <span className="hidden md:block">{job.period}</span>
              <motion.button
                whileHover={{ rotate: 90, borderColor: 'var(--color-rose)' }}
                whileTap={{ scale: 0.9 }}
                transition={springSnappy}
                onClick={onClose}
                aria-label="Close"
                className="border-line-strong text-fg grid size-11 shrink-0 place-items-center rounded-full border text-base"
              >
                ✕
              </motion.button>
            </div>

            <h2 className="face-poster text-fg mt-4 text-4xl font-semibold md:text-6xl">
              {job.role}
            </h2>
            <p className="text-fg-dim mt-3 font-mono text-xs tracking-[0.14em] md:text-sm">
              {job.company.toUpperCase()} · {job.place.toUpperCase()} · {job.period}
            </p>
            <p className="face-poster text-fg-dim mt-6 max-w-2xl text-xl italic md:text-3xl">
              {job.summary}
            </p>

            <div className="mt-10 grid gap-10 md:grid-cols-2 md:gap-14">
              <div>
                <h4 className="label-caps text-rose text-sm font-semibold md:text-base">
                  Responsibilities
                </h4>
                <ul className="mt-5 flex flex-col gap-3.5">
                  {job.points.map((p, i) => (
                    <li key={p} className="flex gap-3 text-sm leading-relaxed md:text-base">
                      <span className="text-rose shrink-0 font-mono text-xs leading-[2]">
                        {String.fromCharCode(97 + i)}.
                      </span>
                      <span className="text-fg-dim">{p}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="label-caps text-rose text-sm font-semibold md:text-base">
                  Achievements & Learnings
                </h4>
                <ul className="mt-5 flex flex-col gap-3.5">
                  {job.achievements.map((a) => (
                    <li key={a} className="flex gap-3 text-sm leading-relaxed md:text-base">
                      <span className="text-gold shrink-0 text-xs leading-[2]">▲</span>
                      <span className="text-fg-dim">{a}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="border-line mt-10 flex flex-wrap gap-2.5 border-t pt-7">
              {job.metrics.map((m) => (
                <span
                  key={m}
                  className="text-rose border-rose-deep rounded-full border px-4 py-2 font-mono text-xs tracking-[0.16em]"
                >
                  {m}
                </span>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}

export default function Experience() {
  const ref = useRef<HTMLElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const [openJob, setOpenJob] = useState<Job | null>(null)

  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add('(min-width: 768px) and (prefers-reduced-motion: no-preference)', () => {
        const track = trackRef.current!
        const bar = ref.current!.querySelector('.xp-progress') as HTMLElement
        const frac = ref.current!.querySelector('.xp-frac') as HTMLElement
        const setBar = gsap.quickSetter(bar, 'scaleX')
        const dist = () => track.scrollWidth - window.innerWidth

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: ref.current,
            start: 'top top',
            // extra runway so the last card rests before the page unpins
            end: () => '+=' + (dist() + window.innerHeight * 0.5),
            scrub: 1,
            pin: true,
            anticipatePin: 1,
            invalidateOnRefresh: true,
            onUpdate: (self) => {
              setBar(self.progress)
              const idx = Math.min(3, 1 + Math.floor(self.progress * 3))
              frac.textContent = `0${idx} / 03`
            },
          },
        })
        tl.to(track, { x: () => -dist(), ease: 'none', duration: 1 })
        tl.to({}, { duration: 0.22 }) // the hold

        return () => tl.scrollTrigger?.kill()
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
          <p className="text-muted mt-6 hidden font-mono text-xs tracking-[0.2em] md:block">
            SCROLL → · CLICK A CARD FOR THE FULL CHAPTER
          </p>
        </div>

        {experience.map((job) => (
          <Card key={job.index} job={job} onOpen={() => setOpenJob(job)} />
        ))}

        {/* breathing room after the last card */}
        <div className="hidden w-[8vw] shrink-0 md:block" />
      </div>

      {/* grounding bar under the rail */}
      <div className="text-muted absolute right-0 bottom-0 left-0 hidden items-center justify-between px-10 pb-6 font-mono text-xs tracking-[0.2em] md:flex">
        <span>THREE CHAPTERS · 2024 — 2026</span>
        <span className="xp-frac text-rose text-sm">01 / 03</span>
        <span>EVERY CARD OPENS THE FULL LEDGER</span>
      </div>

      <ChapterModal job={openJob} onClose={() => setOpenJob(null)} />
    </section>
  )
}
