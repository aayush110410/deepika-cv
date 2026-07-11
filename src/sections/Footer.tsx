import { useRef } from 'react'
import { motion, useInView } from 'motion/react'
import { gsap, useGSAP } from '../lib/gsap'
import Marquee from '../components/Marquee'
import { Magnetic, springSnappy } from '../components/micro'
import { useScrollTo } from '../hooks/useLenis'
import { footer, site } from '../content'

export default function Footer() {
  const ref = useRef<HTMLElement>(null)
  const ctaRef = useRef<HTMLDivElement>(null)
  const ctaInView = useInView(ctaRef, { once: true, amount: 0.6 })
  const scrollTo = useScrollTo()

  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.from('.ft-cta', {
          yPercent: 40,
          autoAlpha: 0,
          duration: 1.2,
          ease: 'power4.out',
          scrollTrigger: { trigger: ref.current, start: 'top 65%', once: true },
        })
        gsap.from('.ft-meta', {
          y: 24,
          autoAlpha: 0,
          duration: 0.8,
          stagger: 0.08,
          scrollTrigger: { trigger: ref.current, start: 'top 55%', once: true },
        })
      })
    },
    { scope: ref },
  )

  return (
    <footer
      id="contact"
      ref={ref}
      data-act="night"
      className="rule-top relative mt-28 flex min-h-svh flex-col justify-between overflow-hidden md:mt-40"
    >
      <div className="px-5 pt-10 md:px-10 md:pt-14">
        <p className="ft-meta text-muted max-w-md font-mono text-xs leading-relaxed tracking-[0.2em] md:text-sm">
          07/ — CONTACT
          <br />
          {footer.note.toUpperCase()}
        </p>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center px-5 py-16">
        <p className="face-script text-rose relative z-10 mb-6 text-3xl md:mb-10 md:text-5xl">
          shall we?
        </p>
        <Magnetic strength={0.25}>
          <motion.a
            whileTap={{ scale: 0.96 }}
            transition={springSnappy}
            href={`mailto:${site.email}`}
            className="ft-cta group block text-center"
            data-cursor="hover"
          >
            <div ref={ctaRef} className="relative inline-block">
              <span className="face-wonk text-fg group-hover:text-rose block text-[15vw] leading-[0.95] font-semibold italic transition-colors duration-500 md:text-[11vw]">
                {footer.cta}
              </span>
              {/* hand-drawn ring, inked in when it enters view — transform-centered on the text */}
              <svg
                className="pointer-events-none absolute top-1/2 left-1/2 h-[165%] w-[114%] -translate-x-1/2 -translate-y-1/2"
                viewBox="0 0 620 240"
                fill="none"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <motion.path
                  d="M310 20 C 478 12, 606 60, 606 120 C 606 180, 468 222, 310 222 C 152 222, 14 180, 14 120 C 14 60, 148 22, 336 26"
                  stroke="var(--color-rose)"
                  strokeWidth="3"
                  strokeLinecap="round"
                  initial={{ pathLength: 0 }}
                  animate={ctaInView ? { pathLength: 1 } : undefined}
                  transition={{ duration: 1.4, ease: 'easeInOut', delay: 0.35 }}
                />
              </svg>
            </div>
            <span className="text-rose relative z-10 mt-12 block font-mono text-xs tracking-[0.3em] md:mt-16 md:text-sm">
              {site.email.toUpperCase()} ↗
            </span>
          </motion.a>
        </Magnetic>
      </div>

      <div>
        <div className="ft-meta text-fg-dim flex flex-wrap items-center justify-between gap-4 px-5 pb-8 font-mono text-sm tracking-[0.16em] md:px-10 md:text-base">
          <motion.a
            whileHover={{ y: -3, borderColor: 'var(--color-rose)', color: 'var(--color-rose)' }}
            whileTap={{ scale: 0.96 }}
            transition={springSnappy}
            href={site.linkedin}
            target="_blank"
            rel="noreferrer"
            className="border-line-strong text-fg rounded-full border px-6 py-3"
          >
            LINKEDIN ↗
          </motion.a>
          <span className="hidden md:inline">{site.location.toUpperCase()}</span>
          <motion.button
            whileHover={{ y: -3, borderColor: 'var(--color-rose)', color: 'var(--color-rose)' }}
            whileTap={{ scale: 0.96 }}
            transition={springSnappy}
            onClick={() => scrollTo('#top')}
            className="border-line-strong text-fg rounded-full border px-6 py-3"
            data-cursor="hover"
          >
            BACK TO TOP ↑
          </motion.button>
        </div>

        <div className="rule-top">
          <Marquee duration={40} velocity={false} className="py-4 md:py-6">
            <span className="face-ghost face-poster px-6 text-[11vw] font-semibold whitespace-nowrap md:text-[8vw]">
              DEEPIKA AGARWAL ✿ DEEPIKA AGARWAL ✿
            </span>
          </Marquee>
        </div>

        <div className="border-line text-muted flex flex-wrap items-center justify-between gap-2 border-t px-5 py-4 font-mono text-[11px] tracking-[0.16em] md:px-10 md:text-xs">
          <span>
            {site.year} {site.name.toUpperCase()}
          </span>
          <span>{footer.colophon.toUpperCase()}</span>
        </div>
      </div>
    </footer>
  )
}
