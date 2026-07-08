import { useEffect, useState } from 'react'

export function useMedia(query: string): boolean {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches)

  useEffect(() => {
    const mql = window.matchMedia(query)
    const onChange = () => setMatches(mql.matches)
    mql.addEventListener('change', onChange)
    onChange()
    return () => mql.removeEventListener('change', onChange)
  }, [query])

  return matches
}

export const useReducedMotion = () => useMedia('(prefers-reduced-motion: reduce)')
export const useFinePointer = () => useMedia('(pointer: fine)')
