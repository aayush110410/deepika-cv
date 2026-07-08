import { useRef } from 'react'
import { motion } from 'motion/react'
import { gsap, SplitText, useGSAP } from '../lib/gsap'
import Marquee from '../components/Marquee'
import { Counter, SectionHeading, springSnappy } from '../components/micro'
import { bio, highlightsMarquee, manifesto, stats, strengths } from '../content'

export default function About() {
  const ref = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        // the manifesto surfaces word by word as you scroll through it
        const split = new SplitText('.about-manifesto', { type: 'words' })
        gsap.fromTo(
          split.words,
          { opacity: 0.13 },
          {
            opacity: 1,
            stagger: 0.06,
            ease: 'none',
            scrollTrigger: {
              trigger: '.about-manifesto',
              start: 'top 78%',
              end: 'bottom 45%',
              scrub: 0.6,
            },
          },
        )

        gsap.from('.about-bio', {
          y: 46,
          autoAlpha: 0,
          duration: 1.1,
          stagger: 0.12,
          scrollTrigger: { trigger: '.about-bio-row', start: 'top 82%', once: true },
        })

        gsap.from('.about-stat', {
          y: 42,
          autoAlpha: 0,
          duration: 0.9,
          stagger: 0.08,
          scrollTrigger: { trigger: '.about-stats', start: 'top 85%', once: true },
        })
      })
    },
    { scope: ref },
  )

  return (
    <section id="profile" ref={ref} className="relative pt-20 md:pt-28">
      {/* highlights band bridging out of the hero */}
      <div className="rule-top border-line mb-20 border-b md:mb-28">
        <Marquee duration={34} className="py-4 md:py-5">
          {highlightsMarquee.map((h) => (
            <span key={h} className="flex items-center">
              <span className="face-poster text-ivory px-6 text-xl md:px-10 md:text-3xl">{h}</span>
              <span className="text-mint text-sm md:text-base">✦</span>
            </span>
          ))}
        </Marquee>
      </div>

      <SectionHeading index="01/" title="Profile" note="WHO'S WRITING" />

      <div className="px-5 md:px-10">
        <p className="about-manifesto face-poster text-ivory max-w-6xl text-[7.2vw] leading-[1.06] md:text-[3.6vw]">
          {manifesto}
        </p>

        <div className="about-bio-row mt-16 grid gap-10 md:mt-24 md:grid-cols-[1fr_1fr] md:gap-16">
          <div className="about-bio">
            <p className="text-ivory-dim max-w-xl text-sm leading-relaxed md:text-base">{bio[0]}</p>
          </div>
          <div className="about-bio flex flex-col gap-8">
            <p className="text-ivory-dim max-w-xl text-sm leading-relaxed md:text-base">{bio[1]}</p>
            <div className="flex flex-wrap gap-2">
              {strengths.map((s) => (
                <motion.span
                  key={s}
                  whileHover={{ y: -4, scale: 1.05, borderColor: 'var(--color-mint)' }}
                  transition={springSnappy}
                  className="border-line-strong text-ivory rounded-full border px-4 py-2 font-mono text-[10px] tracking-[0.16em]"
                >
                  {s}
                </motion.span>
              ))}
            </div>
          </div>
        </div>

        {/* the stat wall */}
        <div className="about-stats mt-20 grid grid-cols-2 md:mt-28 md:grid-cols-3">
          {stats.map((s) => (
            <motion.div
              key={s.label}
              whileHover={{ x: 8 }}
              transition={springSnappy}
              className="about-stat rule-top mr-6 py-8 md:mr-12 md:py-10"
            >
              <Counter
                value={s.value}
                decimals={s.decimals}
                suffix={s.suffix}
                className="face-poster text-ivory block text-5xl font-semibold md:text-7xl"
              />
              <span className="text-muted mt-3 block font-mono text-[10px] tracking-[0.18em] uppercase md:text-xs">
                {s.label}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
