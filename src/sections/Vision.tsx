import { useRef } from 'react'
import { gsap, SplitText, useGSAP } from '../lib/gsap'
import Aurora from '../components/Aurora'
import Petals from '../components/Petals'
import { vision } from '../content'

export default function Vision() {
  const ref = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        const split = new SplitText('.vision-line', { type: 'words' })
        gsap.from(split.words, {
          yPercent: 60,
          autoAlpha: 0,
          stagger: 0.05,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: '.vision-line',
            start: 'top 80%',
            end: 'top 40%',
            scrub: 0.6,
          },
        })

        // the thesis line draws itself
        const path = ref.current!.querySelector('.vision-path') as SVGPathElement
        const len = path.getTotalLength()
        gsap.set(path, { strokeDasharray: len, strokeDashoffset: len })
        gsap.to(path, {
          strokeDashoffset: 0,
          ease: 'none',
          scrollTrigger: {
            trigger: '.vision-chart',
            start: 'top 85%',
            end: 'bottom 45%',
            scrub: 0.8,
          },
        })
        gsap.from('.vision-dot', {
          scale: 0,
          transformOrigin: 'center',
          duration: 0.5,
          ease: 'back.out(2.5)',
          scrollTrigger: { trigger: '.vision-chart', start: 'bottom 48%', once: true },
        })

        gsap.from('.vision-kicker', {
          yPercent: 130,
          duration: 0.8,
          ease: 'power4.out',
          scrollTrigger: { trigger: ref.current, start: 'top 70%', once: true },
        })
      })
    },
    { scope: ref },
  )

  return (
    <section
      ref={ref}
      data-act="night"
      className="relative mt-28 flex min-h-[90svh] flex-col items-center justify-center overflow-hidden px-5 py-24 text-center md:mt-40 md:px-10"
    >
      <Aurora flip amplitude={0.9} blend={0.65} colorStops={['#e0537f', '#cf9a52', '#b89be6']} />
      <Petals count={6} />

      <div className="relative z-10 max-w-6xl">
        <div className="overflow-hidden">
          <p className="vision-kicker text-rose font-mono text-[10px] tracking-[0.3em] md:text-xs">
            06/ — {vision.kicker}
          </p>
        </div>

        <p className="vision-line face-poster text-fg mt-8 text-[8.4vw] leading-[1.04] font-medium italic md:text-[4.6vw]">
          {vision.line}
        </p>

        <svg
          className="vision-chart mx-auto mt-14 w-full max-w-3xl md:mt-20"
          viewBox="0 0 1200 260"
          fill="none"
          aria-hidden="true"
        >
          <path
            className="vision-path"
            d="M0 236 L210 178 L400 214 L640 96 L880 140 L1160 24"
            stroke="var(--color-rose)"
            strokeWidth="3"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          <circle className="vision-dot" cx="1160" cy="24" r="10" fill="var(--t-fg)" />
        </svg>
      </div>
    </section>
  )
}
