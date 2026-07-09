import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { gsap, SplitText, useGSAP } from '../lib/gsap'
import Aurora from '../components/Aurora'
import Marquee from '../components/Marquee'
import Petals from '../components/Petals'
import { springSnappy } from '../components/micro'
import { site, tickerQuotes } from '../content'

/* Framer Motion AnimatePresence cycles the role line */
function RoleRotator() {
  const [idx, setIdx] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setIdx((i) => (i + 1) % site.roles.length), 2800)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="relative h-6 flex-1 overflow-hidden text-right">
      <AnimatePresence mode="wait">
        <motion.span
          key={site.roles[idx]}
          initial={{ y: '130%' }}
          animate={{ y: 0 }}
          exit={{ y: '-130%' }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="text-rose absolute top-0 right-0 font-mono text-[11px] tracking-[0.12em] md:text-sm"
        >
          {site.roles[idx]}
        </motion.span>
      </AnimatePresence>
    </div>
  )
}

export default function Hero({ ready }: { ready: boolean }) {
  const ref = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      if (!ready) return
      const mm = gsap.matchMedia()
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        const line1 = new SplitText('.hero-line-1', { type: 'chars' })
        const line2 = new SplitText('.hero-line-2', { type: 'chars' })

        gsap
          .timeline()
          .from('.hero-aurora', { autoAlpha: 0, duration: 2.4, ease: 'power2.out' }, 0)
          .from(
            line1.chars,
            { yPercent: 130, rotate: 9, duration: 1.15, stagger: 0.035, ease: 'power4.out' },
            0.05,
          )
          .from(
            line2.chars,
            { yPercent: 130, rotate: -7, duration: 1.15, stagger: 0.035, ease: 'power4.out' },
            0.22,
          )
          .from('.hero-script', { autoAlpha: 0, y: 20, rotate: -8, duration: 0.9, ease: 'back.out(1.6)' }, 0.9)
          .from('.hero-meta', { yPercent: 130, duration: 0.9, stagger: 0.1, ease: 'power4.out' }, 0.8)
          .from(
            '.hero-rule',
            { scaleX: 0, transformOrigin: 'left center', duration: 1.3, ease: 'expo.out' },
            0.95,
          )
          .from('.hero-bottom', { autoAlpha: 0, y: 26, duration: 0.9 }, 1.15)

        // drift away as you leave
        gsap.to('.hero-stage', {
          yPercent: -14,
          autoAlpha: 0.15,
          ease: 'none',
          scrollTrigger: { trigger: ref.current, start: 'top top', end: 'bottom top', scrub: true },
        })
      })
    },
    { scope: ref, dependencies: [ready] },
  )

  return (
    <section
      id="top"
      ref={ref}
      data-act="night"
      className="relative flex min-h-svh flex-col overflow-hidden"
    >
      <div className="hero-aurora absolute inset-0">
        <Aurora amplitude={1.1} blend={0.6} />
        <Petals count={8} />
      </div>

      <div className="hero-stage relative z-10 flex flex-1 flex-col justify-center px-5 pt-24 md:px-10">
        <div className="overflow-hidden">
          <p className="hero-meta text-rose font-mono text-[10px] tracking-[0.25em] md:text-xs">
            <span className="dot-live mr-3 align-middle" />
            {site.metaLine}
          </p>
        </div>

        <div className="relative">
          <h1 className="text-fg mt-5 md:mt-8" aria-label={site.name}>
            <span className="block overflow-hidden py-[0.05em]">
              <span className="hero-line-1 face-poster block text-[16.5vw] font-semibold tracking-[-0.02em] md:text-[15.5vw]">
                {site.firstName}
              </span>
            </span>
            <span className="block overflow-hidden py-[0.05em]">
              <span className="hero-line-2 face-wonk block text-[16.5vw] font-semibold italic tracking-[-0.01em] md:text-[15.5vw]">
                {site.lastName}
                <motion.span
                  whileHover={{ scale: 1.5, rotate: 12 }}
                  transition={springSnappy}
                  className="text-rose inline-block not-italic"
                >
                  .
                </motion.span>
              </span>
            </span>
          </h1>
          <p className="hero-script face-script text-rose absolute -top-4 right-2 hidden -rotate-6 text-3xl md:block lg:text-5xl">
            future fund manager ✿
          </p>
        </div>

        <div className="hero-rule bg-line-strong mt-8 h-px w-full md:mt-10" />

        <div className="mt-4 flex items-center justify-between gap-6">
          <div className="overflow-hidden">
            <p className="hero-meta label-caps text-fg-dim text-[10px] font-medium md:text-xs">
              Finance · Strategy · Leadership
            </p>
          </div>
          <div className="hidden flex-1 md:block">
            <RoleRotator />
          </div>
        </div>
      </div>

      <div className="hero-bottom rule-top relative z-10 mt-12">
        <Marquee duration={30} className="py-3">
          {tickerQuotes.map((q) => (
            <motion.span
              key={q.sym}
              whileHover={{ y: -3 }}
              transition={springSnappy}
              className="text-fg-dim mx-7 flex items-baseline gap-2 font-mono text-[10px] tracking-[0.14em] md:text-xs"
            >
              <span className="text-fg">{q.sym}</span>
              <span className="text-rose">{q.val} ▲</span>
              <span>{q.delta}</span>
            </motion.span>
          ))}
        </Marquee>
      </div>
    </section>
  )
}
