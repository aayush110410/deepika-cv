import { useRef } from 'react'
import { gsap, useGSAP } from '../lib/gsap'
import Marquee from '../components/Marquee'
import { SectionHeading } from '../components/micro'
import { alsoFluent, leadership, medals } from '../content'

function TiltCard({ item }: { item: (typeof leadership)[number] }) {
  const ref = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      if (!window.matchMedia('(pointer: fine)').matches) return
      const el = ref.current!
      const rx = gsap.quickTo(el, 'rotationX', { duration: 0.5, ease: 'power3.out' })
      const ry = gsap.quickTo(el, 'rotationY', { duration: 0.5, ease: 'power3.out' })

      const onMove = (e: MouseEvent) => {
        const r = el.getBoundingClientRect()
        const px = (e.clientX - r.left) / r.width
        const py = (e.clientY - r.top) / r.height
        ry((px - 0.5) * 10)
        rx((0.5 - py) * 10)
        el.style.setProperty('--mx', `${px * 100}%`)
        el.style.setProperty('--my', `${py * 100}%`)
      }
      const onLeave = () => {
        rx(0)
        ry(0)
      }
      el.addEventListener('mousemove', onMove)
      el.addEventListener('mouseleave', onLeave)
      return () => {
        el.removeEventListener('mousemove', onMove)
        el.removeEventListener('mouseleave', onLeave)
      }
    },
    { scope: ref },
  )

  return (
    <div style={{ perspective: '900px' }}>
      <div
        ref={ref}
        className="ld-card bg-ink relative h-full p-7 md:p-9"
        style={{
          transformStyle: 'preserve-3d',
          backgroundImage:
            'radial-gradient(220px circle at var(--mx, 50%) var(--my, 50%), rgb(55 230 166 / 0.07), transparent 75%)',
        }}
      >
        <div className="text-muted flex justify-between font-mono text-[10px] tracking-[0.18em]">
          <span>{item.year}</span>
          <span className="text-mint">{item.metric}</span>
        </div>
        <h3 className="face-poster text-ivory mt-6 text-2xl font-semibold md:mt-10 md:text-3xl">
          {item.org}
        </h3>
        <p className="text-mint mt-1.5 font-mono text-[10px] tracking-[0.16em] md:text-xs">
          {item.role.toUpperCase()}
        </p>
        <p className="text-ivory-dim mt-4 text-[13px] leading-relaxed md:text-sm">{item.story}</p>
      </div>
    </div>
  )
}

export default function Leadership() {
  const ref = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.from('.ld-card', {
          y: 56,
          autoAlpha: 0,
          duration: 1,
          stagger: 0.1,
          scrollTrigger: { trigger: '.ld-grid', start: 'top 80%', once: true },
        })
        gsap.from('.ld-medal', {
          scale: 0.85,
          autoAlpha: 0,
          duration: 0.8,
          ease: 'back.out(1.7)',
          stagger: 0.12,
          scrollTrigger: { trigger: '.ld-medals', start: 'top 85%', once: true },
        })
      })
    },
    { scope: ref },
  )

  return (
    <section id="beyond" ref={ref} className="relative mt-28 md:mt-40">
      <SectionHeading index="05/" title="Beyond the Desk" note="LEADERSHIP · SPORT · CRAFT" />

      <div className="px-5 md:px-10">
        <div className="ld-grid bg-line border-line grid gap-px border md:grid-cols-2">
          {leadership.map((item) => (
            <TiltCard key={item.org} item={item} />
          ))}
        </div>

        {/* the trophy shelf */}
        <div className="ld-medals mt-16 grid gap-4 md:mt-24 md:grid-cols-3 md:gap-6">
          {medals.map((m) => (
            <div
              key={m.event}
              className="ld-medal border-line flex items-center gap-5 border p-5 md:p-6"
            >
              <span
                className={`face-poster grid size-14 shrink-0 place-items-center rounded-full border text-[10px] font-semibold tracking-widest md:size-16 ${
                  m.metal.startsWith('GOLD')
                    ? 'border-mint text-mint'
                    : 'border-ivory-dim text-ivory-dim'
                }`}
              >
                {m.metal}
              </span>
              <div>
                <p className="text-ivory text-sm font-medium md:text-base">{m.event}</p>
                <p className="text-muted mt-1 font-mono text-[10px] tracking-[0.18em]">{m.year}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* second craft */}
      <div className="rule-top border-line mt-16 border-b md:mt-24">
        <Marquee duration={26} reverse className="py-4">
          <span className="label-caps text-ivory-dim px-4 text-xs md:text-sm">ALSO FLUENT IN</span>
          {alsoFluent.map((s) => (
            <span key={s} className="flex items-center">
              <span className="text-mint px-4 text-xs">✦</span>
              <span className="label-caps text-ivory px-4 text-xs md:text-sm">{s}</span>
            </span>
          ))}
        </Marquee>
      </div>
    </section>
  )
}
