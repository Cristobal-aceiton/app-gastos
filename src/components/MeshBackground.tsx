/**
 * Fondo "mesh gradient" animado: 4 blobs de color muy difuminados que se
 * desplazan lentamente detrás del contenido. Puramente decorativo — vive en
 * position:absolute detrás de todo (z-index 0) y nunca intercepta clicks
 * (pointer-events: none), así que puede montarse una sola vez por shell
 * (AppLayout / AuthShell) sin afectar la interacción ni el scroll.
 *
 * Las animaciones son CSS puras (@keyframes mesh-drift-*) en vez de Framer
 * Motion: son continuas e infinitas, así que no tiene sentido pagar el
 * costo de JS por frame para esto, y así respetan `prefers-reduced-motion`
 * automáticamente vía la media query en index.css.
 */
export default function MeshBackground() {
  return (
    <div className="mesh-bg" aria-hidden="true">
      <div className="mesh-blob mesh-blob--mint" />
      <div className="mesh-blob mesh-blob--cyan" />
      <div className="mesh-blob mesh-blob--violet" />
      <div className="mesh-blob mesh-blob--pink" />
      <div className="noise-overlay" />
    </div>
  )
}
