import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'
import { ScrambleTextPlugin } from 'gsap/ScrambleTextPlugin'

gsap.registerPlugin(ScrollTrigger, SplitText, ScrambleTextPlugin, useGSAP)

gsap.defaults({ ease: 'power3.out', duration: 1 })

export { gsap, ScrollTrigger, SplitText, useGSAP }

export const SCRAMBLE_CHARS = '▮▲△◆·01$%#'

export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}
