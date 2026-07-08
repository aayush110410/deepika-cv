import { useRef, useState } from 'react'
import { gsap, useGSAP, SCRAMBLE_CHARS } from '../lib/gsap'
import { useLenisInstance } from '../hooks/useLenis'
import { site } from '../content'

const FEED = ['NSE ▲ 0.94%', 'SIF/NFO OPEN', 'AUM ₹ 68.4L CR', 'LRDI 99.06', 'EQUITY · DERIVATIVES', 'MDI GURGAON']

/**
 * Boot sequence: a ledger counts to 100 while the market feed scrambles,
 * then a two-layer curtain (mint flash under ink) lifts into the hero.
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
      const feed = root.querySelector('.pl-feed') as HTMLElement
      const bar = root.querySelector('.pl-bar') as HTMLElement
      const inner = root.querySelector('.pl-inner') as HTMLElement
      const inkPane = root.querySelector('.pl-ink') as HTMLElement
      const mintPane = root.querySelector('.pl-mint') as HTMLElement

      document.body.style.overflow = 'hidden'
      const release = () => {
        document.body.style.overflow = ''
        lenisRef.current?.start()
      }

      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      if (reduced) {
        const t = gsap.timeline({ delay: 0.2 })
        t.to(root, {
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

      boot.to(counter, {
        v: 100,
        duration: 2.1,
        ease: 'power2.inOut',
        onUpdate: () => {
          num.textContent = String(Math.round(counter.v)).padStart(3, '0')
        },
      })
      boot.to(bar, { scaleX: 1, duration: 2.1, ease: 'power2.inOut' }, 0)

      // market feed flickers through scrambled lines while we count
      FEED.forEach((line, i) => {
        boot.to(
          feed,
          { duration: 0.34, scrambleText: { text: line, chars: SCRAMBLE_CHARS, speed: 2 }, ease: 'none' },
          i * 0.35,
        )
      })

      const exit = gsap.timeline({
        paused: true,
        onStart: () => {
          release()
          onReveal()
        },
        onComplete: () => setDone(true),
      })
      exit
        .to(inner, { yPercent: -18, autoAlpha: 0, duration: 0.6, ease: 'power3.in' })
        .to(inkPane, { yPercent: -100, duration: 0.95, ease: 'power4.inOut' }, 0.18)
        .to(mintPane, { yPercent: -100, duration: 0.95, ease: 'power4.inOut' }, 0.3)

      // lift the curtain only once the count is done AND webfonts are in,
      // so the hero SplitText measures the real glyphs
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
      <div className="pl-mint bg-mint absolute inset-0" />
      <div className="pl-ink bg-ink absolute inset-0" />
      <div className="pl-inner absolute inset-0 flex flex-col justify-between p-5 md:p-10">
        <div className="text-ivory-dim flex items-center justify-between font-mono text-[10px] tracking-[0.25em] md:text-xs">
          <span>{site.name.toUpperCase()} — PORTFOLIO</span>
          <span className="hidden md:block">{site.metaLine}</span>
          <span>{site.year}</span>
        </div>

        <div className="flex items-end justify-between gap-6">
          <div className="text-muted mb-2 font-mono text-[10px] tracking-[0.2em] md:mb-4 md:text-xs">
            <span className="dot-live mr-3 align-middle" />
            <span className="pl-feed">OPENING THE LEDGER</span>
          </div>
          <div className="face-poster text-ivory flex items-start leading-none">
            <span className="pl-num text-[22vw] font-semibold md:text-[11rem]">000</span>
            <span className="text-mint mt-[2vw] font-mono text-sm md:mt-6">%</span>
          </div>
        </div>
      </div>
      <div className="pl-bar bg-mint absolute bottom-0 left-0 h-[2px] w-full origin-left scale-x-0" />
    </div>
  )
}
