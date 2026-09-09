import { useEffect, useRef, useState } from 'react'
import { animate } from 'framer-motion'
import { formatCLP } from '../lib/format'

export default function AnimatedCounter({
  value,
  formatter = formatCLP,
}: {
  value: number
  formatter?: (n: number) => string
}) {
  const [display, setDisplay] = useState(0)
  const prevValue = useRef(0)

  useEffect(() => {
    const controls = animate(prevValue.current, value, {
      duration: 0.6,
      ease: 'easeOut',
      onUpdate: (v) => setDisplay(v),
    })
    prevValue.current = value
    return () => controls.stop()
  }, [value])

  return <span className="tabular-nums">{formatter(display)}</span>
}
