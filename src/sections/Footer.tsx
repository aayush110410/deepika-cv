import { useRef } from 'react'
import { motion } from 'motion/react'
import { gsap, useGSAP } from '../lib/gsap'
import Marquee from '../components/Marquee'
import { Magnetic, springSnappy } from '../components/micro'
import { useScrollTo } from '../hooks/useLenis'
import { footer, site } from '../content'

export default function Footer() {
  const ref = useRef<HTMLElement>(null)
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
      className="rule-top relative mt-28 flex min-h-svh flex-col justify-between overflow-hidden md:mt-40"
    >
      <div className="px-5 pt-10 md:px-10 md:pt-14">
        <p className="ft-meta text-muted max-w-md font-mono text-[10px] leading-relaxed tracking-[0.2em] md:text-xs">
          07/ — CONTACT
          <br />
          {footer.note.toUpperCase()}
        </p>
      </div>

      <div className="flex flex-1 items-center justify-center px-5 py-16">
        <Magnetic strength={0.25}>
          <motion.a
            whileTap={{ scale: 0.96 }}
            transition={springSnappy}
            href={`mailto:${site.email}`}
            className="ft-cta group block text-center"
            data-cursor="hover"
          >
            <span className="face-wonk text-ivory group-hover:text-mint block text-[15vw] leading-[0.95] font-semibold italic transition-colors duration-500 md:text-[11vw]">
              {footer.cta}
            </span>
            <span className="text-mint mt-6 inline-block font-mono text-[10px] tracking-[0.3em] md:text-xs">
              {site.email.toUpperCase()} ↗
            </span>
          </motion.a>
        </Magnetic>
      </div>

      <div>
        <div className="ft-meta text-ivory-dim flex flex-wrap items-center justify-between gap-4 px-5 pb-8 font-mono text-[10px] tracking-[0.18em] md:px-10 md:text-xs">
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
              DEEPIKA AGARWAL ✦ DEEPIKA AGARWAL ✦
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
