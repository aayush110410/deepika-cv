import { useMemo } from 'react'
import { motion, useReducedMotion } from 'motion/react'

const HUES = ['rgb(224 83 127 / 0.20)', 'rgb(207 154 82 / 0.16)', 'rgb(184 155 230 / 0.16)']

/** Soft petal-bokeh drifting in the background — pure Framer Motion loops. */
export default function Petals({ count = 7 }: { count?: number }) {
  const reduced = useReducedMotion()
  const petals = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        size: 90 + ((i * 97) % 160),
        left: (i * 137.5) % 100,
        top: (i * 61.8) % 100,
        hue: HUES[i % HUES.length],
        dur: 9 + ((i * 3.7) % 8),
        drift: 30 + ((i * 23) % 50),
      })),
    [count],
  )

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {petals.map((p) => (
        <motion.div
          key={p.id}
          className="petal"
          style={{
            width: p.size,
            height: p.size,
            left: `${p.left}%`,
            top: `${p.top}%`,
            background: p.hue,
          }}
          animate={
            reduced
              ? undefined
              : {
                  y: [0, -p.drift, 0],
                  x: [0, p.drift / 2, 0],
                  scale: [1, 1.15, 1],
                  opacity: [0.7, 1, 0.7],
                }
          }
          transition={{ duration: p.dur, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}
    </div>
  )
}
