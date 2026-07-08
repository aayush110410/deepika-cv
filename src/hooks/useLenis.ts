import { createContext, useContext, useEffect, useState } from 'react'
import Lenis from 'lenis'
import { gsap, ScrollTrigger } from '../lib/gsap'

export const LenisContext = createContext<Lenis | null>(null)

export function useLenisInstance() {
  return useContext(LenisContext)
}

/** Smooth scroll driven by the GSAP ticker, kept in sync with ScrollTrigger. */
export function useLenis(enabled: boolean) {
  const [lenis, setLenis] = useState<Lenis | null>(null)

  useEffect(() => {
    if (!enabled) return

    const instance = new Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    })

    instance.on('scroll', ScrollTrigger.update)
    const raf = (time: number) => instance.raf(time * 1000)
    gsap.ticker.add(raf)
    gsap.ticker.lagSmoothing(0)
    setLenis(instance)

    return () => {
      gsap.ticker.remove(raf)
      instance.destroy()
      setLenis(null)
    }
  }, [enabled])

  return lenis
}

/** Scroll to an anchor — through Lenis when active, natively otherwise. */
export function useScrollTo() {
  const lenis = useLenisInstance()
  return (target: string) => {
    if (lenis) {
      lenis.scrollTo(target, { duration: 1.6 })
    } else {
      document.querySelector(target)?.scrollIntoView({ behavior: 'auto' })
    }
  }
}
