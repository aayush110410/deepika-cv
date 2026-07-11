import { useRef, useState } from 'react'
import { MotionConfig } from 'motion/react'
import { LenisContext, useLenis } from './hooks/useLenis'
import { useFinePointer, useReducedMotion } from './hooks/useMedia'
import { gsap, ScrollTrigger, useGSAP } from './lib/gsap'
import { ACTS } from './lib/theme'
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

  /* The page blends between the night (plum) and day (blush) acts, scrubbed
     across a tall scroll window so the change washes in gradually. */
  useGSAP(
    () => {
      const keys = Object.keys(ACTS.night) as (keyof (typeof ACTS)['night'])[]
      const root = document.documentElement
      const blend = (p: number) => {
        // p: 0 = night, 1 = day
        keys.forEach((k) => {
          root.style.setProperty(k, gsap.utils.interpolate(ACTS.night[k], ACTS.day[k], p))
        })
      }

      // dawn: hero → profile
      ScrollTrigger.create({
        trigger: '#profile',
        start: 'top 98%',
        end: 'top 15%',
        scrub: true,
        onUpdate: (self) => blend(self.progress),
      })
      // dusk: education → selected work
      ScrollTrigger.create({
        trigger: '#work',
        start: 'top 98%',
        end: 'top 20%',
        scrub: true,
        onUpdate: (self) => blend(1 - self.progress),
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
