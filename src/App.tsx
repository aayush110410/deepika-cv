import { useState } from 'react'
import { MotionConfig } from 'motion/react'
import { LenisContext, useLenis } from './hooks/useLenis'
import { useFinePointer, useReducedMotion } from './hooks/useMedia'
import { ScrollTrigger } from './lib/gsap'
import GrainOverlay from './components/GrainOverlay'
import CustomCursor from './components/CustomCursor'
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

  return (
    <MotionConfig reducedMotion="user">
      <LenisContext.Provider value={lenis}>
        {finePointer && !reduced && <CustomCursor />}
      <GrainOverlay />
      <Preloader
        onReveal={() => {
          setReady(true)
          ScrollTrigger.refresh()
        }}
      />
      <NavOverlay />
      <main>
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
