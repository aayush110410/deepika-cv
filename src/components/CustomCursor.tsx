import { useEffect, useRef } from 'react'
import { gsap } from '../lib/gsap'

/** Blend-mode dot + trailing ring. Ring swells over anything interactive. */
export default function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null)
  const ringRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const dot = dotRef.current!
    const ring = ringRef.current!
    document.documentElement.classList.add('has-cursor')

    gsap.set([dot, ring], { xPercent: -50, yPercent: -50, autoAlpha: 0 })
    const dotX = gsap.quickTo(dot, 'x', { duration: 0.08, ease: 'power2.out' })
    const dotY = gsap.quickTo(dot, 'y', { duration: 0.08, ease: 'power2.out' })
    const ringX = gsap.quickTo(ring, 'x', { duration: 0.45, ease: 'power3.out' })
    const ringY = gsap.quickTo(ring, 'y', { duration: 0.45, ease: 'power3.out' })

    let shown = false
    const onMove = (e: MouseEvent) => {
      if (!shown) {
        shown = true
        gsap.set([dot, ring], { x: e.clientX, y: e.clientY })
        gsap.to([dot, ring], { autoAlpha: 1, duration: 0.3 })
      }
      dotX(e.clientX)
      dotY(e.clientY)
      ringX(e.clientX)
      ringY(e.clientY)
    }

    const INTERACTIVE = 'a, button, [data-cursor]'
    const onOver = (e: MouseEvent) => {
      if ((e.target as Element).closest?.(INTERACTIVE)) {
        gsap.to(ring, { scale: 2.1, duration: 0.35 })
        gsap.to(dot, { scale: 0.5, duration: 0.35 })
      }
    }
    const onOut = (e: MouseEvent) => {
      if ((e.target as Element).closest?.(INTERACTIVE)) {
        gsap.to(ring, { scale: 1, duration: 0.35 })
        gsap.to(dot, { scale: 1, duration: 0.35 })
      }
    }
    const onDown = () => gsap.to(ring, { scale: 0.8, duration: 0.2 })
    const onUp = () => gsap.to(ring, { scale: 1, duration: 0.3 })
    const onLeave = () => {
      shown = false
      gsap.to([dot, ring], { autoAlpha: 0, duration: 0.25 })
    }

    window.addEventListener('mousemove', onMove, { passive: true })
    document.addEventListener('mouseover', onOver)
    document.addEventListener('mouseout', onOut)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('mouseup', onUp)
    document.documentElement.addEventListener('mouseleave', onLeave)

    return () => {
      document.documentElement.classList.remove('has-cursor')
      window.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseover', onOver)
      document.removeEventListener('mouseout', onOut)
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('mouseup', onUp)
      document.documentElement.removeEventListener('mouseleave', onLeave)
      gsap.killTweensOf([dot, ring])
    }
  }, [])

  return (
    <div aria-hidden="true">
      <div
        ref={dotRef}
        className="bg-rose pointer-events-none fixed top-0 left-0 z-[120] size-2 rounded-full"
      />
      <div
        ref={ringRef}
        className="border-fg/60 pointer-events-none fixed top-0 left-0 z-[119] size-9 rounded-full border mix-blend-difference"
      />
    </div>
  )
}
