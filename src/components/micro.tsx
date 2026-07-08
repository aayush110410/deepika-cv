import { useRef, type ReactNode } from 'react'
import { gsap, useGSAP, SCRAMBLE_CHARS } from '../lib/gsap'

/* ── MagneticButton ───────────────────────────────────── */

export function Magnetic({
  children,
  strength = 0.35,
  className = '',
}: {
  children: ReactNode
  strength?: number
  className?: string
}) {
  const hostRef = useRef<HTMLDivElement>(null)
  const innerRef = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      if (!window.matchMedia('(pointer: fine)').matches) return
      const host = hostRef.current!
      const inner = innerRef.current!
      const xTo = gsap.quickTo(inner, 'x', { duration: 0.4, ease: 'power3.out' })
      const yTo = gsap.quickTo(inner, 'y', { duration: 0.4, ease: 'power3.out' })

      const onMove = (e: MouseEvent) => {
        const r = host.getBoundingClientRect()
        xTo((e.clientX - (r.left + r.width / 2)) * strength)
        yTo((e.clientY - (r.top + r.height / 2)) * strength)
      }
      const onLeave = () => {
        gsap.to(inner, { x: 0, y: 0, duration: 1, ease: 'elastic.out(1, 0.3)' })
      }
      host.addEventListener('mousemove', onMove)
      host.addEventListener('mouseleave', onLeave)
      return () => {
        host.removeEventListener('mousemove', onMove)
        host.removeEventListener('mouseleave', onLeave)
      }
    },
    { scope: hostRef },
  )

  return (
    <div ref={hostRef} className={className}>
      <div ref={innerRef}>{children}</div>
    </div>
  )
}

/* ── ScrambleText — decodes on hover ──────────────────── */

export function Scramble({
  text,
  className = '',
}: {
  text: string
  className?: string
}) {
  const ref = useRef<HTMLSpanElement>(null)
  const { contextSafe } = useGSAP({ scope: ref })

  const onEnter = contextSafe(() => {
    gsap.to(ref.current, {
      duration: 0.7,
      scrambleText: { text, chars: SCRAMBLE_CHARS, speed: 1.4 },
      ease: 'none',
    })
  })

  return (
    <span ref={ref} className={className} onMouseEnter={onEnter}>
      {text}
    </span>
  )
}

/* ── Counter — counts up when scrolled into view ──────── */

export function Counter({
  value,
  decimals = 0,
  suffix = '',
  className = '',
}: {
  value: number
  decimals?: number
  suffix?: string
  className?: string
}) {
  const ref = useRef<HTMLSpanElement>(null)

  useGSAP(
    () => {
      const el = ref.current!
      const mm = gsap.matchMedia()
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        const obj = { v: 0 }
        el.textContent = (0).toFixed(decimals) + suffix
        gsap.to(obj, {
          v: value,
          duration: 2.2,
          ease: 'power3.out',
          scrollTrigger: { trigger: el, start: 'top 88%', once: true },
          onUpdate: () => {
            el.textContent = obj.v.toFixed(decimals) + suffix
          },
        })
      })
    },
    { scope: ref },
  )

  return (
    <span ref={ref} className={className}>
      {value.toFixed(decimals) + suffix}
    </span>
  )
}

/* ── SectionHeading — ruled index row shared by sections ── */

export function SectionHeading({
  index,
  title,
  note,
}: {
  index: string
  title: string
  note?: string
}) {
  const ref = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.from(ref.current!.querySelector('.sh-rule'), {
          scaleX: 0,
          transformOrigin: 'left center',
          duration: 1.4,
          ease: 'expo.out',
          scrollTrigger: { trigger: ref.current, start: 'top 88%', once: true },
        })
        gsap.from(ref.current!.querySelectorAll('.sh-item'), {
          yPercent: 120,
          duration: 0.9,
          stagger: 0.08,
          ease: 'power4.out',
          scrollTrigger: { trigger: ref.current, start: 'top 88%', once: true },
        })
      })
    },
    { scope: ref },
  )

  return (
    <div ref={ref} className="px-5 md:px-10">
      <div className="sh-rule bg-line-strong h-px w-full" />
      <div className="text-ivory-dim flex items-baseline justify-between gap-4 pt-3 pb-10 md:pb-14">
        <div className="overflow-hidden">
          <span className="sh-item font-mono text-mint inline-block text-xs md:text-sm">
            {index}
          </span>
        </div>
        <div className="overflow-hidden">
          <h2 className="sh-item label-caps text-ivory inline-block text-sm font-semibold md:text-base">
            {title}
          </h2>
        </div>
        <div className="hidden overflow-hidden md:block">
          <span className="sh-item font-mono inline-block text-xs">{note ?? ''}</span>
        </div>
      </div>
    </div>
  )
}
