import { useRef, useState } from 'react'
import { MotionConfig } from 'motion/react'
import { LenisContext, useLenis } from './hooks/useLenis'
import { useFinePointer, useReducedMotion } from './hooks/useMedia'
import { gsap, ScrollTrigger, useGSAP } from './lib/gsap'
import { ACTS, type Act } from './lib/theme'
import GrainOverlay from './components/GrainOverlay'
import CustomCursor from './components/CustomCursor'
import ScrollProgress from './components/ScrollProgress'
import Preloader from './components/Preloader'
import NavOverlay from './components/NavOverlay'
import Hero from './sections/Hero'
import About from './sections/About'
import Experience from './sections/Experience'
import Education from './sections/Education'
import Projects from './sections/Projects'
import Leadership from './sections/Leadership'
import Vision from './sections/Vision'
import Footer from './sections/Footer'

export default function App() {
  const reduced = useReducedMotion()
  const finePointer = useFinePointer()
  const lenis = useLenis(!reduced)
  const [ready, setReady] = useState(false)
  const mainRef = useRef<HTMLElement>(null)

  /* the page morphs between the night (plum) and day (blush) acts on scroll */
  useGSAP(
    () => {
      let current: Act = 'night'
      const morph = (act: Act) => {
        if (act === current) return
        current = act
        gsap.to(document.documentElement, {
          ...ACTS[act],
          duration: reduced ? 0 : 0.9,
          ease: 'power2.inOut',
          overwrite: 'auto',
        })
      }

      gsap.utils.toArray<HTMLElement>('[data-act]').forEach((el) => {
        const act = el.dataset.act as Act
        ScrollTrigger.create({
          trigger: el,
          start: 'top 55%',
          end: 'bottom 55%',
          onToggle: (self) => self.isActive && morph(act),
        })
      })
    },
    { scope: mainRef, dependencies: [reduced] },
  )

  return (
    <MotionConfig reducedMotion="user">
      <LenisContext.Provider value={lenis}>
        {finePointer && !reduced && <CustomCursor />}
        <GrainOverlay />
        <ScrollProgress />
        <Preloader
          onReveal={() => {
            setReady(true)
            ScrollTrigger.refresh()
          }}
        />
        <NavOverlay />
        <main ref={mainRef}>
          <Hero ready={ready} />
          <About />
          <Experience />
          <Education />
          <Projects />
          <Leadership />
          <Vision />
          <Footer />
        </main>
      </LenisContext.Provider>
    </MotionConfig>
  )
}
