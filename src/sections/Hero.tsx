import { useRef } from 'react'
import { gsap, SplitText, useGSAP } from '../lib/gsap'
import Aurora from '../components/Aurora'
import Marquee from '../components/Marquee'
import { site, tickerQuotes } from '../content'

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
          .from('.hero-meta', { yPercent: 130, duration: 0.9, stagger: 0.1, ease: 'power4.out' }, 0.8)
          .from(
            '.hero-rule',
            { scaleX: 0, transformOrigin: 'left center', duration: 1.3, ease: 'expo.out' },
            0.95,
          )
          .from('.hero-bottom', { autoAlpha: 0, y: 26, duration: 0.9 }, 1.15)

        // rotating role line
        const roles = gsap.utils.toArray<HTMLElement>('.hero-role')
        gsap.set(roles, { yPercent: 120, opacity: 1 })
        const rot = gsap.timeline({ repeat: -1, delay: 1.4 })
        roles.forEach((el) => {
          rot
            .to(el, { yPercent: 0, duration: 0.65, ease: 'power3.out' })
            .to(el, { yPercent: -120, duration: 0.65, ease: 'power3.in' }, '+=1.8')
        })

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
    <section id="top" ref={ref} className="relative flex min-h-svh flex-col overflow-hidden">
      <div className="hero-aurora absolute inset-0">
        <Aurora amplitude={1.1} blend={0.6} />
      </div>

      <div className="hero-stage relative z-10 flex flex-1 flex-col justify-center px-5 pt-24 md:px-10">
        <div className="overflow-hidden">
          <p className="hero-meta text-mint font-mono text-[10px] tracking-[0.25em] md:text-xs">
            <span className="dot-live mr-3 align-middle" />
            {site.metaLine}
          </p>
        </div>

        <h1 className="text-ivory mt-5 md:mt-8" aria-label={site.name}>
          <span className="block overflow-hidden py-[0.05em]">
            <span className="hero-line-1 face-poster block text-[16.5vw] font-semibold tracking-[-0.02em] md:text-[15.5vw]">
              {site.firstName}
            </span>
          </span>
          <span className="block overflow-hidden py-[0.05em]">
            <span className="hero-line-2 face-wonk block text-[16.5vw] font-semibold italic tracking-[-0.01em] md:text-[15.5vw]">
              {site.lastName}
              <span className="text-mint not-italic">.</span>
            </span>
          </span>
        </h1>

        <div className="hero-rule bg-line-strong mt-8 h-px w-full md:mt-10" />

        <div className="mt-4 flex items-center justify-between gap-6">
          <div className="overflow-hidden">
            <p className="hero-meta label-caps text-ivory-dim text-[10px] font-medium md:text-xs">
              Finance · Strategy · Leadership
            </p>
          </div>
          <div className="role-stack relative hidden h-6 flex-1 overflow-hidden text-right md:block">
            {site.roles.map((r) => (
              <span
                key={r}
                className="hero-role text-mint absolute top-0 right-0 font-mono text-[11px] tracking-[0.12em] md:text-sm"
              >
                {r}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="hero-bottom rule-top relative z-10 mt-12">
        <Marquee duration={30} className="py-3">
          {tickerQuotes.map((q) => (
            <span
              key={q.sym}
              className="text-ivory-dim mx-7 flex items-baseline gap-2 font-mono text-[10px] tracking-[0.14em] md:text-xs"
            >
              <span className="text-ivory">{q.sym}</span>
              <span className="text-mint">{q.val} ▲</span>
              <span>{q.delta}</span>
            </span>
          ))}
        </Marquee>
      </div>
    </section>
  )
}
