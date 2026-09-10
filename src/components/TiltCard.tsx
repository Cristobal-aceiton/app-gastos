import type { ReactNode } from 'react'
import { useRef } from 'react'
import { motion, useMotionTemplate, useSpring } from 'framer-motion'

/**
 * Card con glassmorphism + borde con gradiente + un tilt 3D muy sutil que
 * sigue al mouse (desktop) y se resetea limpio al salir el cursor.
 *
 * Notas de performance / por qué es seguro dejarlo en producción:
 * - Solo anima `rotateX` / `rotateY` (transform) — nunca top/left/width, así
 *   que nunca dispara layout ni paint, solo compositing.
 * - Usa useSpring en vez de setState + rAF manual: el valor vive fuera de
 *   React así que mover el mouse no re-renderiza el componente.
 * - En touch (sin `hover: hover`) el listener de mousemove simplemente no
 *   dispara casi nunca, así que el costo en mobile es ~nulo; no hace falta
 *   una rama de código separada.
 */
export default function TiltCard({ children, className = '' }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const rotateX = useSpring(0, { stiffness: 300, damping: 25 })
  const rotateY = useSpring(0, { stiffness: 300, damping: 25 })
  const transform = useMotionTemplate`perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = ref.current?.getBoundingClientRect()
    if (!rect) return
    const px = (e.clientX - rect.left) / rect.width - 0.5
    const py = (e.clientY - rect.top) / rect.height - 0.5
    rotateY.set(px * 10)
    rotateX.set(py * -10)
  }

  function handleMouseLeave() {
    rotateX.set(0)
    rotateY.set(0)
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ transform, willChange: 'transform' }}
      whileHover={{ scale: 1.01 }}
      className={`border-gradient card-glass rounded-2xl ${className}`}
    >
      {children}
    </motion.div>
  )
}
