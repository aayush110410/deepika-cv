import { motion, useScroll, useSpring } from 'motion/react'

/** Rose thread across the very top — Framer Motion useScroll driving a spring. */
export default function ScrollProgress() {
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 26, mass: 0.3 })

  return (
    <motion.div
      aria-hidden="true"
      className="fixed top-0 right-0 left-0 z-[95] h-[2px] origin-left"
      style={{
        scaleX,
        background: 'linear-gradient(90deg, var(--color-rose), var(--color-gold))',
      }}
    />
  )
}
