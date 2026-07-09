import { useRef, useState } from 'react'
import { gsap, useGSAP } from '../lib/gsap'
import { useLenisInstance } from '../hooks/useLenis'

/**
 * Viper-style opening: a blush cover with masked serif lines sliding up,
 * a rose seam drawing across, then the cover splits — top half lifts,
 * bottom half drops — revealing the plum hero underneath.
 */
export default function Preloader({ onReveal }: { onReveal: () => void }) {
  const rootRef = useRef<HTMLDivElement>(null)
  const [done, setDone] = useState(false)
  const lenis = useLenisInstance()
  const lenisRef = useRef(lenis)
  lenisRef.current = lenis

  useGSAP(
    () => {
      const root = rootRef.current!
      const num = root.querySelector('.pl-num') as HTMLElement

      document.body.style.overflow = 'hidden'
      const release = () => {
        document.body.style.overflow = ''
        lenisRef.current?.start()
      }

      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      if (reduced) {
        gsap.timeline({ delay: 0.2 }).to(root, {
          autoAlpha: 0,
          duration: 0.4,
          onStart: onReveal,
          onComplete: () => {
            release()
            setDone(true)
          },
        })
        return
      }

      lenisRef.current?.stop()

      const counter = { v: 0 }
      const boot = gsap.timeline()
      boot
        .from('.pl-script', { autoAlpha: 0, y: 24, duration: 0.8, ease: 'power3.out' }, 0.1)
        .from(
          '.pl-line-inner',
          { yPercent: 112, duration: 1.1, stagger: 0.14, ease: 'power4.out' },
          0.25,
        )
        .from('.pl-meta', { autoAlpha: 0, y: 14, duration: 0.6, stagger: 0.08 }, 0.9)
        .fromTo(
          '.pl-seam',
          { scaleX: 0 },
          { scaleX: 1, duration: 1.6, ease: 'expo.inOut' },
          0.35,
        )
        .to(
          counter,
          {
            v: 100,
            duration: 1.75,
            ease: 'power2.inOut',
            onUpdate: () => {
              num.textContent = String(Math.round(counter.v)).padStart(3, '0')
            },
          },
          0.35,
        )

      const exit = gsap.timeline({
        paused: true,
        onStart: () => {
          release()
          onReveal()
        },
        onComplete: () => setDone(true),
      })
      exit
        .to('.pl-stage', { yPercent: -6, autoAlpha: 0, duration: 0.55, ease: 'power3.in' })
        .to('.pl-seam', { scaleX: 0, transformOrigin: 'right center', duration: 0.4, ease: 'power2.in' }, 0)
        .to('.pl-top', { yPercent: -100, duration: 1.05, ease: 'power4.inOut' }, 0.32)
        .to('.pl-bottom', { yPercent: 100, duration: 1.05, ease: 'power4.inOut' }, 0.32)

      let alive = true
      const bootDone = new Promise<void>((resolve) => {
        boot.eventCallback('onComplete', () => resolve())
      })
      Promise.all([bootDone, document.fonts.ready]).then(() => {
        if (alive) exit.play()
      })

      return () => {
        alive = false
      }
    },
    { scope: rootRef },
  )

  if (done) return null

  return (
    <div ref={rootRef} className="fixed inset-0 z-[110]" aria-hidden="true">
      {/* the split cover */}
      <div className="pl-top absolute inset-x-0 top-0 h-1/2 bg-[#f7ebe4]" />
      <div className="pl-bottom absolute inset-x-0 bottom-0 h-1/2 bg-[#f7ebe4]" />
      <div className="pl-seam absolute top-1/2 right-0 left-0 h-px origin-left bg-[#e0537f]" />

      {/* cover content */}
      <div className="pl-stage absolute inset-0 flex flex-col items-center justify-center px-6 text-center text-[#3a182b]">
        <p className="pl-script face-script text-2xl text-[#e0537f] md:text-4xl">
          the portfolio of
        </p>
        <h1 className="mt-2 md:mt-4">
          <span className="block overflow-hidden py-[0.06em]">
            <span className="pl-line-inner face-wonk block text-[15vw] leading-[0.95] font-semibold italic md:text-[9vw]">
              Deepika
            </span>
          </span>
          <span className="block overflow-hidden py-[0.06em]">
            <span className="pl-line-inner face-poster block text-[15vw] leading-[0.95] font-semibold md:text-[9vw]">
              AGARWAL
            </span>
          </span>
        </h1>
        <div className="mt-6 flex items-center gap-6 font-mono text-[10px] tracking-[0.28em] text-[#a3768c] md:mt-8 md:text-xs">
          <span className="pl-meta">EST. AGRA</span>
          <span className="pl-meta text-[#e0537f]">✿</span>
          <span className="pl-meta">MDI GURGAON</span>
        </div>
      </div>

      {/* counter, bottom corner */}
      <div className="pl-stage absolute right-6 bottom-6 font-mono text-xs tracking-[0.2em] text-[#3a182b] md:right-10 md:bottom-8">
        <span className="pl-num">000</span>
        <span className="text-[#e0537f]"> / 100</span>
      </div>
    </div>
  )
}
