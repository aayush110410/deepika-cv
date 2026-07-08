import { useRef } from 'react'
import { motion } from 'motion/react'
import { gsap, useGSAP } from '../lib/gsap'
import { SectionHeading, springSnappy } from '../components/micro'
import { projects } from '../content'

/**
 * FlowingMenu, hand-built in the spirit of React Bits: hovering a row pours a
 * mint tape through it from whichever edge the cursor entered.
 */
function Row({ project }: { project: (typeof projects)[number] }) {
  const rowRef = useRef<HTMLDivElement>(null)
  const { contextSafe } = useGSAP(
    () => {
      // park the tape below the row; GSAP owns this transform exclusively
      gsap.set(rowRef.current!.querySelector('.fm-band'), { yPercent: 101 })
    },
    { scope: rowRef },
  )

  const edge = (e: React.MouseEvent) => {
    const r = rowRef.current!.getBoundingClientRect()
    return e.clientY < r.top + r.height / 2 ? -101 : 101
  }

  const onEnter = contextSafe((e: React.MouseEvent) => {
    if (!window.matchMedia('(pointer: fine)').matches) return
    gsap.fromTo(
      rowRef.current!.querySelector('.fm-band'),
      { yPercent: edge(e) },
      { yPercent: 0, duration: 0.5, ease: 'expo.out', overwrite: true },
    )
  })

  const onLeave = contextSafe((e: React.MouseEvent) => {
    if (!window.matchMedia('(pointer: fine)').matches) return
    gsap.to(rowRef.current!.querySelector('.fm-band'), {
      yPercent: edge(e),
      duration: 0.5,
      ease: 'expo.in',
      overwrite: true,
    })
  })

  const tape = [...project.band, ...project.band, ...project.band, ...project.band]

  return (
    <div
      ref={rowRef}
      className="fm-row border-line relative overflow-hidden border-b"
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      data-cursor="hover"
    >
      <motion.div
        whileHover="hover"
        className="flex flex-col gap-2 px-5 py-7 md:flex-row md:items-baseline md:justify-between md:px-10 md:py-9"
      >
        <div>
          <motion.h3
            variants={{ hover: { x: 18 } }}
            transition={springSnappy}
            className="face-poster text-ivory text-3xl font-semibold md:text-[3.4vw]"
          >
            {project.title}
          </motion.h3>
          <p className="text-muted mt-2 max-w-xl text-[13px] leading-snug md:hidden">
            {project.desc}
          </p>
        </div>
        <motion.span
          variants={{ hover: { x: -14 } }}
          transition={springSnappy}
          className="text-muted font-mono text-[10px] tracking-[0.2em] md:text-xs"
        >
          {project.meta}
        </motion.span>
      </motion.div>

      {/* the tape */}
      <div className="fm-band bg-mint text-ink invisible absolute inset-0 items-center overflow-hidden md:visible md:flex">
        <div className="fm-tape flex w-max items-center whitespace-nowrap">
          {[0, 1].map((copy) => (
            <div key={copy} className="flex items-center" aria-hidden={copy === 1}>
              {tape.map((t, i) => (
                <span key={`${t}-${i}`} className="flex items-center">
                  <span className="face-poster px-5 text-2xl font-semibold italic md:text-4xl">
                    {t}
                  </span>
                  <span className="text-lg">✦</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function Projects() {
  const ref = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      // every tape drifts forever; it only shows through on hover
      gsap.utils.toArray<HTMLElement>('.fm-tape').forEach((tape) => {
        gsap.to(tape, { xPercent: -50, duration: 16, ease: 'none', repeat: -1 })
      })

      const mm = gsap.matchMedia()
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.from('.fm-row', {
          y: 50,
          autoAlpha: 0,
          duration: 0.9,
          stagger: 0.08,
          scrollTrigger: { trigger: ref.current, start: 'top 78%', once: true },
        })
      })
    },
    { scope: ref },
  )

  return (
    <section id="work" ref={ref} className="relative mt-28 md:mt-40">
      <SectionHeading index="04/" title="Selected Work" note="HOVER TO READ THE TAPE" />
      <div className="border-line border-t">
        {projects.map((p) => (
          <Row key={p.title} project={p} />
        ))}
      </div>
      <p className="text-muted px-5 pt-5 font-mono text-[10px] tracking-[0.2em] md:px-10">
        06 ENGAGEMENTS · RESEARCH → PRODUCT → EDUCATION
      </p>
    </section>
  )
}
