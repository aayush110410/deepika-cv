import { useRef, type ReactNode } from 'react'
import { gsap, ScrollTrigger, useGSAP } from '../lib/gsap'

/**
 * Infinite band. Scroll velocity whips its speed and can flip its direction —
 * it settles back to a lazy drift when the page rests.
 */
export default function Marquee({
  children,
  duration = 22,
  reverse = false,
  velocity = true,
  className = '',
}: {
  children: ReactNode
  duration?: number
  reverse?: boolean
  velocity?: boolean
  className?: string
}) {
  const hostRef = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
      const track = hostRef.current!.querySelector('.mq-track') as HTMLElement

      const tween = reverse
        ? gsap.fromTo(
            track,
            { xPercent: -50 },
            { xPercent: 0, duration, ease: 'none', repeat: -1 },
          )
        : gsap.to(track, { xPercent: -50, duration, ease: 'none', repeat: -1 })

      // run only while on screen
      ScrollTrigger.create({
        trigger: hostRef.current,
        start: 'top bottom',
        end: 'bottom top',
        onToggle: (self) => (self.isActive ? tween.play() : tween.pause()),
      })

      if (velocity) {
        let burst: gsap.core.Timeline | null = null
        ScrollTrigger.create({
          onUpdate: (self) => {
            const v = self.getVelocity()
            if (Math.abs(v) < 80) return
            const ts = gsap.utils.clamp(-5, 5, v / 220)
            burst?.kill()
            burst = gsap
              .timeline()
              .to(tween, { timeScale: ts, duration: 0.25, overwrite: true })
              .to(tween, { timeScale: v < 0 ? -1 : 1, duration: 1.4, ease: 'power2.out' }, '+=0.15')
          },
        })
      }
    },
    { scope: hostRef },
  )

  return (
    <div ref={hostRef} className={`overflow-hidden whitespace-nowrap ${className}`}>
      <div className="mq-track flex w-max">
        <div className="flex shrink-0 items-center">{children}</div>
        <div className="flex shrink-0 items-center" aria-hidden="true">
          {children}
        </div>
      </div>
    </div>
  )
}
