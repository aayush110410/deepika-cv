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
        <p className="ft-meta text-muted max-w-md font-mono text-[10px] leading-relaxed tracking-[0.2em] md:text-xs">
          07/ — CONTACT
          <br />
          {footer.note.toUpperCase()}
        </p>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center px-5 py-16">
        <p className="face-script text-rose mb-2 text-3xl md:text-5xl">shall we?</p>
        <Magnetic strength={0.25}>
          <motion.a
            whileTap={{ scale: 0.96 }}
            transition={springSnappy}
            href={`mailto:${site.email}`}
            className="ft-cta group block text-center"
            data-cursor="hover"
          >
            <div ref={ctaRef} className="relative px-[0.6em]">
              <span className="face-wonk text-fg group-hover:text-rose block text-[15vw] leading-[0.95] font-semibold italic transition-colors duration-500 md:text-[11vw]">
                {footer.cta}
              </span>
              {/* hand-drawn ring, inked in when it enters view */}
              <svg
                className="pointer-events-none absolute -inset-x-[4%] -inset-y-[28%]"
                viewBox="0 0 620 240"
                fill="none"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <motion.path
                  d="M310 22 C 480 14, 600 62, 598 118 C 596 178, 462 218, 300 220 C 146 222, 22 176, 20 116 C 18 58, 152 24, 340 28"
                  stroke="var(--color-rose)"
                  strokeWidth="3"
                  strokeLinecap="round"
                  initial={{ pathLength: 0 }}
                  animate={ctaInView ? { pathLength: 1 } : undefined}
                  transition={{ duration: 1.4, ease: 'easeInOut', delay: 0.35 }}
                />
              </svg>
            </div>
            <span className="text-rose mt-6 inline-block font-mono text-[10px] tracking-[0.3em] md:text-xs">
              {site.email.toUpperCase()} ↗
            </span>
          </motion.a>
        </Magnetic>
      </div>

      <div>
        <div className="ft-meta text-fg-dim flex flex-wrap items-center justify-between gap-4 px-5 pb-8 font-mono text-[10px] tracking-[0.18em] md:px-10 md:text-xs">
          <motion.a
            whileHover={{ y: -3 }}
            transition={springSnappy}
            href={site.linkedin}
            target="_blank"
            rel="noreferrer"
            className="link-sweep"
          >
            LINKEDIN ↗
          </motion.a>
          <span>{site.location.toUpperCase()}</span>
          <motion.button
            whileHover={{ y: -3 }}
            whileTap={{ scale: 0.95 }}
            transition={springSnappy}
            onClick={() => scrollTo('#top')}
            className="link-sweep"
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

        <div className="border-line text-muted flex flex-wrap items-center justify-between gap-2 border-t px-5 py-4 font-mono text-[9px] tracking-[0.16em] md:px-10 md:text-[10px]">
          <span>
            {site.year} {site.name.toUpperCase()}
          </span>
          <span>{footer.colophon.toUpperCase()}</span>
        </div>
      </div>
    </footer>
  )
}
