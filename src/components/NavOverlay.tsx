import { useEffect, useRef, useState } from 'react'
import { motion } from 'motion/react'
import { gsap, useGSAP } from '../lib/gsap'
import { useLenisInstance, useScrollTo } from '../hooks/useLenis'
import { navLinks, site } from '../content'
import { Scramble, springSnappy } from './micro'

function useISTClock() {
  const [time, setTime] = useState('')
  useEffect(() => {
    const tick = () =>
      setTime(
        new Date().toLocaleTimeString('en-GB', { timeZone: 'Asia/Kolkata', hour12: false }),
      )
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])
  return time
}

/* per-letter wave — each glyph springs up with a tiny cascade on hover */
function WaveLetters({ text }: { text: string }) {
  return (
    <span aria-label={text}>
      {text.split('').map((c, i) => (
        <motion.span
          key={`${c}-${i}`}
          aria-hidden="true"
          className="inline-block"
          variants={{
            hover: {
              y: '-12%',
              transition: { delay: i * 0.028, type: 'spring', stiffness: 420, damping: 24 },
            },
          }}
        >
          {c}
        </motion.span>
      ))}
    </span>
  )
}

export default function NavOverlay() {
  const rootRef = useRef<HTMLDivElement>(null)
  const tlRef = useRef<gsap.core.Timeline | null>(null)
  const [open, setOpen] = useState(false)
  const lenis = useLenisInstance()
  const scrollTo = useScrollTo()
  const time = useISTClock()

  useGSAP(
    () => {
      const overlay = rootRef.current!.querySelector('.nav-overlay') as HTMLElement
      gsap.set(overlay, { clipPath: 'inset(0% 0% 100% 0%)', pointerEvents: 'none' })

      const tl = gsap.timeline({ paused: true })
      tl.set(overlay, { pointerEvents: 'auto' })
        .to(overlay, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.85, ease: 'expo.inOut' })
        .from(
          '.nav-link-inner',
          { yPercent: 130, duration: 0.8, stagger: 0.06, ease: 'power4.out' },
          '-=0.3',
        )
        .from('.nav-meta', { autoAlpha: 0, y: 18, duration: 0.5, stagger: 0.05 }, '-=0.55')
      tl.eventCallback('onReverseComplete', () =>
        gsap.set(overlay, { pointerEvents: 'none' }),
      )
      tlRef.current = tl
    },
    { scope: rootRef },
  )

  useEffect(() => {
    const tl = tlRef.current
    if (!tl) return
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (open) {
      lenis?.stop()
      tl.timeScale(reduced ? 10 : 1).play()
    } else {
      lenis?.start()
      tl.timeScale(reduced ? 10 : 1.35).reverse()
    }
  }, [open, lenis])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const go = (href: string) => {
    setOpen(false)
    setTimeout(() => scrollTo(href), 250)
  }

  return (
    <div ref={rootRef}>
      {/* top bar */}
      <header className="pointer-events-none fixed top-0 right-0 left-0 z-[85] mix-blend-difference">
        <div className="text-fg flex items-center justify-between px-5 py-4 font-mono text-[10px] tracking-[0.22em] md:px-10 md:text-xs">
          <button
            onClick={() => go('#top')}
            className="pointer-events-auto"
            aria-label="Back to top"
          >
            <Scramble text="DEEPIKA AGARWAL" />
          </button>
          <span className="hidden md:block" suppressHydrationWarning>
            GURGAON — {time} IST
          </span>
          <motion.button
            whileTap={{ scale: 0.9 }}
            transition={springSnappy}
            onClick={() => setOpen((v) => !v)}
            className="pointer-events-auto flex items-center gap-2"
            aria-expanded={open}
            aria-label={open ? 'Close menu' : 'Open menu'}
          >
            <span className={`dot-live ${open ? 'bg-fg' : ''}`} />
            <Scramble text={open ? 'CLOSE' : 'MENU'} />
          </motion.button>
        </div>
      </header>

      {/* full-screen menu */}
      <div className="nav-overlay bg-bg2 fixed inset-0 z-[84]" role="dialog" aria-modal="true">
        <div className="flex h-full flex-col justify-between px-5 pt-24 pb-8 md:px-10 md:pb-12">
          <nav className="flex flex-col items-start gap-1 md:gap-2">
            {navLinks.map((l) => (
              <div key={l.href} className="overflow-hidden">
                <div className="nav-link-inner">
                  <motion.button
                    whileHover="hover"
                    whileTap={{ scale: 0.97 }}
                    onClick={() => go(l.href)}
                    className="group flex items-baseline gap-4 text-left md:gap-7"
                  >
                    <span className="text-rose font-mono text-xs md:text-sm">{l.index}</span>
                    <span className="face-poster text-fg group-hover:text-rose text-[13vw] leading-[1.02] transition-colors duration-300 group-hover:italic md:text-[6.5vw]">
                      <WaveLetters text={l.label} />
                    </span>
                  </motion.button>
                </div>
              </div>
            ))}
          </nav>

          <div className="text-fg-dim flex flex-wrap items-end justify-between gap-4 font-mono text-[10px] tracking-[0.18em] md:text-xs">
            <a href={`mailto:${site.email}`} className="nav-meta link-sweep text-fg">
              {site.email.toUpperCase()}
            </a>
            <span className="nav-meta face-script text-rose text-xl tracking-normal normal-case">
              from Agra, with ambition
            </span>
            <a
              href={site.linkedin}
              target="_blank"
              rel="noreferrer"
              className="nav-meta link-sweep"
            >
              LINKEDIN ↗
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
