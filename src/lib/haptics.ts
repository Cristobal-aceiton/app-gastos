/**
 * Feedback háptico (vibración) para microinteracciones.
 *
 * Se degrada en silencio en navegadores/dispositivos sin soporte para
 * `navigator.vibrate` (iOS Safari, desktop, etc.) — nunca lanza ni rompe la UI.
 * En el APK generado con PWA Builder (Trusted Web Activity) sí se respeta,
 * porque corre sobre Chrome para Android.
 */
function vibrate(pattern: number | number[]) {
  if (typeof window === 'undefined') return
  if (!('vibrate' in navigator)) return
  try {
    navigator.vibrate(pattern)
  } catch {
    // Algunos navegadores lanzan si se llama fuera de un gesto directo del usuario.
    // No es crítico: simplemente no vibra.
  }
}

export const haptics = {
  /** Toque ligero: selección de opción, cambio de tab, tap de navegación. */
  light: () => vibrate(10),
  /** Toque medio: acción confirmada (swipe completo, guardar). */
  medium: () => vibrate(20),
  /** Éxito: transacción guardada, meta cumplida, cobro automático aplicado. */
  success: () => vibrate([15, 40, 15]),
  /** Advertencia: se abre una confirmación, se alcanza un límite. */
  warning: () => vibrate([25, 30, 25, 30, 25]),
  /** Acción destructiva ejecutada (eliminar). */
  error: () => vibrate(35),
}
