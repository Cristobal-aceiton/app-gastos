# Gastos

PWA de gestión financiera personal. React + Vite + TypeScript, con Supabase como backend (Auth, Database, Storage).

## Estado actual

✅ **Fase 0 — Cimentación y Supabase**: completa.
✅ **Fase 1 — Autenticación y Onboarding**: completa.
✅ **Fase 2 — Dashboard principal**: completa.
✅ **Fase 3 — Agregar transacciones (CRUD)**: completa.
✅ **Fase 4 — Lista completa y filtros**: completa.
✅ **Fase 5 — Estadísticas (gráficos)**: completa.
✅ **Fase 6 — Funcionalidades Premium**: completa.
✅ **Fase 7 — Pulido final, testing y generación de APK**: completa.
✅ **Fase 8 — Perfil, Configuración y Gestión de Categorías**: completa.
✅ **Fase 9 — Integración de pagos para Premium**: completa como mock funcional, con la estructura lista para Stripe real (pendiente solo de cuenta/credenciales; ver la salvedad sobre Chile en la sección "Activar pagos reales con Stripe").
✅ **Fase 10 — Refresh visual y pulido**: completa (paleta de gradientes verdes exacta del spec, glow pulsante y shimmer en la tarjeta de Balance, fondo radial sutil, glassmorphism, microinteracciones y FAB con pulso).
🔶 **Fase 11 — Seguridad de Premium y pagos reales**: la parte de seguridad está completa (ver detalle abajo); la conexión a una pasarela de pago real sigue pendiente de la misma decisión de cuenta/LLC que ya bloqueaba la Fase 9.
✅ **Fase 12 — Testing, robustez de datos y modo offline**: completa (ver detalle abajo). Pendiente solo la verificación manual en un navegador real con la pestaña de Red en "Offline" (12.7); la lógica ya está cubierta por un test automatizado equivalente.
🔶 **Fase 13 — Notificaciones y CRUD completo de transacciones**: solo 13.1-13.3 (notificaciones push, casos a notificar, preferencias) completas en esta entrega (ver detalle abajo). Pendiente 13.4 (editar transacción) y 13.5 (búsqueda y filtro por fecha) — no se pidieron en este alcance.

- Login y registro con email/contraseña (sin Google), con recuperación de contraseña.
- Sesión manejada con Zustand (`src/store/authStore.ts`), persistida por Supabase Auth.
- `ProtectedRoute` redirige a `/login` sin sesión, y a `/onboarding` si el perfil no tiene nombre todavía.
- Onboarding de 3 pasos (nombre, propósito, tipo de ingreso fijo/variable) que actualiza la tabla `profiles`.
- Modal de bienvenida Premium al terminar el onboarding, con botones que marcan `is_premium` (mock, sin cobro real todavía — eso llega en la Fase 6).
- Dashboard conectado a Supabase (`src/hooks/useDashboardData.ts`): balance, ingresos y gastos del mes actual con contador animado, desglose de gastos por categoría en barras, y las últimas 5 transacciones.
- Categorías centralizadas en `src/lib/categories.ts` (Comida, Transporte, Compras, Salud, Entretenimiento, Servicios, Sueldo, Otros) — se reutilizan en Add Transaction (Fase 3) y en la lista completa (Fase 4). **Importante**: la columna `category` de `transactions` guarda el *id/slug* de la categoría (ej. `comida`), no el label en español.

- Pantalla `/add-transaction` (`src/pages/AddTransaction.tsx`): toggle Gasto/Ingreso animado (`TypeToggle`), grid de categorías con íconos (`CategoryPicker`, filtrado según el tipo: Sueldo/Otros para ingresos, el resto para gastos), campo de monto con separador de miles en vivo (`AmountField` en `fields.tsx`), selector de fecha nativo (no permite fechas futuras) y nota opcional.
- Al guardar, inserta en `transactions` vía Supabase, invalida la query `['dashboard', userId]` de React Query (el Dashboard se refresca solo, sin recargar) y muestra una animación de éxito (`SuccessOverlay`, checkmark con Framer Motion) antes de volver al Dashboard.

- Pantalla `/transactions` (`src/pages/Transactions.tsx`): scroll infinito con `useInfiniteQuery` de TanStack Query (paginación de 20 en 20 vía `.range()` de Supabase, disparada por un `IntersectionObserver` al llegar al final de la lista), tabs horizontales por categoría (`CategoryTabs`, incluye "Todos") y cada ítem (`SwipeableTransactionRow`) se desliza hacia la izquierda para revelar un botón de eliminar, con diálogo de confirmación (`ConfirmDialog`) antes de borrar. Al eliminar se invalidan tanto la lista como el Dashboard.

- Pantalla `/stats` (`src/pages/Stats.tsx`): selector de mes/año con flechas (`MonthSelector`, no deja avanzar más allá del mes actual), gráfico de dona con Recharts (`ExpenseDonut`, con el gasto total del mes en el centro) y debajo el desglose por categoría (`StatsCategoryRow`) con ícono, monto, porcentaje exacto (ej. `32.4%`) y una barra horizontal que se anima de 0 al valor real cada vez que cambias de mes. Los datos son solo de gastos (`type = 'expense'`) del mes seleccionado.

- Pantalla `/premium` (`src/pages/Premium.tsx`): si el usuario no es Premium, muestra un bloque inline (`PremiumLock`) con los beneficios y el botón para "adquirirlo" — mismo mock de la Fase 1 (marca `is_premium = true` y `premium_since` en `profiles`, sin cobro real). Si ya es Premium, muestra 3 tabs:
  - **Metas** (`savings_goals`): crear meta (nombre, monto objetivo, fecha límite), agregar fondos manualmente (el aporte nunca supera el monto objetivo) y eliminar. Cada meta se ve como una tarjeta con barra de progreso (`GoalCard`).
  - **Límites** (`category_limits`): asignar un tope mensual a una categoría de gasto (no incluye "Sueldo", que es ingreso). Se guarda con `upsert` sobre `(user_id, category, month_year)` — hay una constraint única para esto (ver `supabase/schema.sql`, sección Fase 6). El progreso de cada límite se calcula contra el gasto real del mes actual (mismo dato que Estadísticas).
  - **Suscripciones** (`subscriptions`): agregar un servicio recurrente (nombre, monto, día de cobro 1-31, categoría), activar/desactivar con un switch, y eliminar.
- **Alertas de límite** (`src/components/LimitBar.tsx`): la barra se pone amarilla al llegar al 80% del límite y roja con una animación de "shake" al llegar al 100%. Se muestra tanto en `/premium` como en el Dashboard.
- **Descuento automático de suscripciones** (`src/hooks/useSubscriptionRunner.ts`): al montar la app (en `AppLayout`, una sola vez por sesión), si el usuario es Premium se revisan sus suscripciones activas. Si hoy coincide con el `billing_day` de alguna (con el día "clampado" al último día del mes, ej. día 31 en febrero cobra el 28) y todavía no existe una transacción con la descripción `Suscripción: {nombre}` en el mes actual, se crea automáticamente como gasto y se refrescan Dashboard/Movimientos/Estadísticas.
- **Dashboard** (`src/pages/Dashboard.tsx`): para usuarios Premium, agrega un carrusel horizontal de metas de ahorro (`GoalMiniCard`, con anillo de progreso circular) y la sección "Límites del mes" con `LimitBar` para cada límite configurado.
- **Perfil** (`src/pages/Profile.tsx`): deja de ser un placeholder — muestra el nombre, el estado de la cuenta (gratuita/Premium ✨) y una tarjeta que enlaza a `/premium`.

### Fase 13 — Notificaciones push (13.1-13.3)

**Alcance de esta entrega**: solo 13.1 (notificaciones push), 13.2 (los 3 casos a notificar) y 13.3 (preferencias). 13.4 (editar transacción) y 13.5 (búsqueda y filtro por fecha) quedan para una próxima entrega — son un CRUD/UI independiente de la parte de notificaciones y no se pidieron en este alcance.

**13.1 — Notificaciones push (Web Push API + Service Worker)**:

- El service worker pasó de generarse automáticamente (`generateSW`, estrategia por defecto de `vite-plugin-pwa`) a la estrategia **`injectManifest`**, que permite escribirlo a mano en `src/sw.ts` en vez de que Workbox lo genere completo — necesario para poder agregarle los listeners `push` y `notificationclick` (`generateSW` no los admite). `vite-plugin-pwa` sigue precacheando los assets igual que antes (`precacheAndRoute(self.__WB_MANIFEST)`, con el manifest inyectado en build time); lo único nuevo es el manejo de push. `src/sw.ts` tiene su propio `tsconfig.sw.json` (lib `WebWorker`) porque no puede compartir el `lib: ["DOM"]` del resto de `src/` — un mismo archivo no puede tener ambas libs a la vez.
- **Cliente** (`src/lib/push.ts`): pide el permiso de `Notification`, crea la `PushSubscription` del navegador con `pushManager.subscribe()` (usando la clave pública VAPID, `VITE_VAPID_PUBLIC_KEY`) y la guarda en la tabla `push_subscriptions` de Supabase (`upsert` por `endpoint`, así que reabrir la app en el mismo navegador no crea una fila duplicada). Un mismo usuario puede tener varias filas — una por dispositivo/navegador donde activó las notificaciones.
- **Backend con cron** (`supabase/functions/check-notifications/`): Edge Function que revisa **diariamente** (programada con `pg_cron` + `pg_net`, ver el comentario al inicio del archivo para el SQL exacto) los 3 casos de 13.2 para cada usuario Premium y envía el Web Push correspondiente con la librería `web-push` (protegida con un secreto compartido, `CRON_SECRET`, distinto del JWT de sesión que usan las funciones de la Fase 11 — quien la llama es el scheduler, no una persona logueada).
- Requiere generar un par de claves VAPID una sola vez (`npx web-push generate-vapid-keys`): la pública va en `VITE_VAPID_PUBLIC_KEY` (`.env`) y en el secret `VAPID_PUBLIC_KEY` de la función; la privada **solo** como secret (`VAPID_PRIVATE_KEY`), nunca en el cliente. Ver "Configuración", paso 6, para el detalle completo de despliegue.

**13.2 — Casos a notificar**: los mismos tres que pide `claude.md`, evaluados por `check-notifications` en cada corrida del cron:

- **Suscripción por cobrar**: `willChargeSoon()` (`src/lib/premium.ts`, con su espejo en la Edge Function — Deno no puede importar con confianza fuera de `supabase/functions/`, así que la fórmula está duplicada y cubierta por los mismos tests) avisa si el cobro cae dentro de los próximos 2-3 días, respetando el mismo clamping de fin de mes que `shouldChargeToday` (Fase 12).
- **Límite de categoría al 80%**: mismo cálculo que ya usa `LimitBar`/`getLimitStatus` (gasto real del mes / `limit_amount`), evaluado por la función en vez de esperar a que el usuario abra el Dashboard.
- **Meta de ahorro por vencer**: `isGoalNearDeadline()` avisa una vez si faltan 7 días o menos para la fecha límite y la meta todavía no llegó al monto objetivo (una meta ya cumplida no genera aviso aunque la fecha esté cerca).
- **Sin duplicados**: la tabla `notifications_log` (sin políticas RLS — solo la Edge Function con `service_role` la toca) registra qué se avisó y cuándo, con una constraint única `(user_id, kind, ref_id, period_key)`. Suscripciones y límites se re-evalúan mes a mes (`period_key` = `"YYYY-MM"`); una meta se avisa una única vez en total (`period_key = "once"`), no todos los días que caiga dentro de la ventana de 7 días.
- Si el envío a un endpoint falla con 404/410 (el navegador dio de baja esa suscripción — se desinstaló la PWA, se borraron datos del sitio, etc.), la función borra esa fila de `push_subscriptions` para no seguir intentando en cada corrida.

**13.3 — Preferencias de notificación**: sección nueva "Notificaciones" en `/settings` (`src/hooks/useNotificationPrefs.ts` + `src/hooks/usePushSubscription.ts`):

- Un switch maestro activa/desactiva las notificaciones push del dispositivo actual (pide permiso del navegador la primera vez).
- Tres switches independientes — uno por caso de 13.2 — que se guardan en `notification_prefs` (una fila por usuario, `upsert` por `user_id`). Si el usuario nunca los tocó, se asumen todos activados (`DEFAULT_NOTIFICATION_PREFS` en `src/types/notifications.ts`) tanto en el cliente como en `check-notifications`, así que no hace falta sembrar una fila al crear la cuenta.
- Los tres switches quedan deshabilitados si el dispositivo no tiene las notificaciones push activadas (no tendría efecto guardarlos sin nada a qué avisarle).

**Pendiente real de esta fase** (no es código, es verificación manual — mismo tipo de pendiente que otras fases de este README): confirmar en un dispositivo real, con la PWA instalada y **cerrada**, que la notificación llega igual (tanto Android/TWA como escritorio) y que tocarla abre la app en la pantalla correcta (`/premium`).

### Fase 12 — Testing, robustez de datos y modo offline

**12.1-12.2 — Testing de la lógica que maneja dinero real**: se instaló **Vitest + Testing Library** (`npm run test` corre una vez, `npm run test:watch` queda escuchando cambios). Antes de esta fase, ninguna de estas funciones tenía cobertura:

- `src/lib/premium.test.ts`: `getLimitStatus` (umbrales 80%/100%) y, sobre todo, el **clamping** de `effectiveBillingDay`/`shouldChargeToday`/`nextChargeLabel` — una suscripción con `billing_day = 31` debe cobrar el 28 (o 29 en bisiesto) de febrero, el 30 en abril/junio/septiembre/noviembre, etc. Es la lógica más fácil de romper con un `off-by-one` y la que más directamente mueve dinero real del usuario.
- `src/hooks/useDashboardData.test.ts`: cálculo de balance/ingresos/gastos/desglose por categoría, casos sin transacciones, y que un error de Supabase se propague como error de la query (no como datos vacíos silenciosos).
- `src/hooks/useSubscriptionRunner.test.ts`: que el cobro automático se dispare el día correcto, que **no cobre dos veces** si ya existe una transacción de esa suscripción este mes, y que respete el mismo clamping.
- `src/hooks/useCategories.test.ts` (`useDeleteCategory`): que la reasignación a `"otros"` de las transacciones huérfanas se haga **antes** de borrar la categoría, y que si esa reasignación falla, la categoría NO se borre (para no dejar transacciones apuntando a un id que ya no existe).

Para poder testear hooks que llaman a Supabase sin una base de datos real, se armó un mock reutilizable del query builder de `@supabase/supabase-js` en `src/test/supabaseMock.ts` (cadenas `.from().select().eq()...` que resuelven a un `{ data, error }` configurable por tabla, con cola FIFO para cuando un mismo hook llama dos veces a `.from()` de la misma tabla, como `useSubscriptionRunner`).

**12.3 — Tests de integración ligeros** (`src/hooks/integration.test.ts`): en vez de montar las pantallas completas (`AddTransaction`, `CategoriesSettings` — eso arrastraría router, Framer Motion y estilos sin proteger lógica adicional), se ejercita el contrato real que comparten esas pantallas: el mismo `QueryClient`, las mismas `queryKey` y la invalidación cruzada entre hooks. Cubre: insertar una transacción e invalidar `["dashboard", userId]` recalcula los totales del Dashboard; y crear/eliminar una categoría personalizada se refleja en `useCustomCategories` (incluida la reasignación a "Otros" al eliminar).

**12.4 — CI** (`.github/workflows/ci.yml`): en cada push/PR a `main` corre, en orden, `npm run lint` (oxlint), chequeo de tipos (`tsc -b --noEmit`), `npm run test` y `npm run build`. De paso se detectó y corrigió un hueco previo: **faltaba un `.gitignore`** en el proyecto, así que `oxlint` escaneaba `node_modules` completo (40 mil+ advertencias irrelevantes). Ya se agregó uno estándar de Vite/Node.

**12.5 — Caché de solo lectura para modo offline** (`src/lib/offlineCache.ts`): usa **IndexedDB** (no `localStorage`, por el volumen y forma de los datos) exclusivamente como caché — la fuente primaria sigue siendo Supabase, tal como exige la regla del stack en este mismo archivo. El patrón (`resolveWithOfflineCache`) es el mismo en los tres hooks que lo usan:

1. Intenta el fetch real contra Supabase. Si tiene éxito, guarda la respuesta en IndexedDB bajo una key con namespace (`dashboard:{userId}`, `stats:{userId}:{año}-{mes}`, `transactions:{userId}:{categoryId|todos}`) y la devuelve normalmente (`fromCache: false`).
2. Si el fetch falla (sin red, Supabase caído, etc.), busca esa key en IndexedDB. Si hay algo guardado, lo devuelve marcado `fromCache: true` en vez de dejar que la query falle. Si no hay nada guardado (primera vez que se abre la app, sin conexión), se relanza el error original — no hay nada que mostrar, así que la UI cae al estado de error que ya tenía.

Aplicado a `useDashboardData`, `useStatsData` y **solo la primera página** de `useTransactionsList` (ver justificación abajo). Cuando `fromCache` es `true`, `Dashboard.tsx`, `Stats.tsx` y `Transactions.tsx` muestran un banner sutil (`src/components/OfflineBanner.tsx`): "Sin conexión — mostrando datos guardados".

- **Por qué solo la primera página de Transacciones**: cachear "página 2 del scroll infinito" no tiene un fallback razonable — si el usuario hace scroll sin red después de la primera pantalla, simplemente no hay más que mostrar todavía, así que se deja que esa página falle normalmente (React Query conserva las páginas ya cargadas, no las borra).
- Los tests usan `fake-indexeddb` (dependencia de desarrollo) para poder ejercitar `offlineCache.ts` dentro de jsdom sin un navegador real; ver el caso "Fase 12.5" en `useDashboardData.test.ts`.

**12.6 — Cola de escritura diferida: evaluada y descartada por ahora**. La fase la marca como opcional ("evaluar necesidad real"). Se decidió **no implementarla** en esta entrega:

- El caso de uso principal del modo offline es "abrí la app en el metro y quiero ver mi balance", no "quiero seguir registrando gastos sin señal por horas" — Chile tiene cobertura de datos móviles razonablemente buena para una PWA de bolsillo, y el riesgo de UX de una escritura que "parece guardada" pero en realidad está en una cola local (con los conflictos de last-write-wins que eso implica) no compensa frente a un caso de uso poco frecuente.
- Además, agregar una transacción hoy depende de datos que también deberían estar frescos (categorías personalizadas del usuario, límites del mes) — construir bien el caso "agregar offline y sincronizar después" es un trabajo bastante mayor al de una cola simple, y easy de hacer mal (ej. una suscripción que ya se cobró automáticamente al reconectar, duplicando un cargo que el `useSubscriptionRunner` ya había hecho con la fecha de hoy).
- Si más adelante se decide implementarla, el punto de partida ya está: `resolveWithOfflineCache`/`writeCache`/`readCache` en `src/lib/offlineCache.ts` se pueden reusar para una cola de mutaciones pendientes (`pending-writes:{userId}`), y `useOnlineStatus` (`src/hooks/useOnlineStatus.ts`) ya expone cuándo la app recupera la red para disparar el flush.

**12.7 — Criterio de entrega**: `npm run test` pasa en verde (36/36) cubriendo los puntos de 12.2, incluyendo un test que reproduce exactamente el escenario del criterio (Supabase falla → se sirve el último balance conocido desde el caché, no una pantalla en blanco). **Falta la verificación manual** en un navegador real con la pestaña de Red en modo "Offline" — el comportamiento está probado a nivel de hook/IndexedDB, pero no se confirmó visualmente que el banner y el Dashboard se vean bien en Chrome/Safari con la red cortada de verdad.

### Fase 11 — Seguridad de Premium y pagos reales

Hasta la Fase 9, `Onboarding.tsx`, `Premium.tsx` y "Cancelar suscripción" en `Settings.tsx` activaban/desactivaban Premium con un `supabase.from('profiles').update({ is_premium: true }, ...)` directo desde el cliente. Eso significaba que cualquiera podía abrir la consola del navegador logueado y activarse Premium gratis con esa misma línea, sin pasar por `MockPaymentModal` ni por ningún pago (ni siquiera simulado). Esta fase cierra ese hueco:

- **Trigger de Postgres que bloquea la escritura directa** (`supabase/schema.sql`, sección "Fase 11"): RLS en Postgres es a nivel de *fila*, no de columna — la política existente de `profiles` (`auth.uid() = id`) ya dejaba pasar cualquier `UPDATE` a la fila propia, incluidos `is_premium` y los campos de Stripe. Se agregó un trigger `BEFORE UPDATE` (`protect_premium_columns`) que compara `NEW` contra `OLD` y **rechaza la consulta con una excepción** si alguno de `is_premium`, `premium_since`, `stripe_customer_id`, `stripe_subscription_id` o `stripe_last_payment_id` cambió y quien ejecuta la consulta no es el `service_role`. El resto de columnas de `profiles` (`name`, `purpose`, `income_type`, `fixed_salary`) sigue totalmente editable por el cliente, como hasta ahora.
- **Dos Edge Functions nuevas en `supabase/functions/`** que sí corren con `service_role` y son las únicas que ahora pueden tocar esos campos:
  - `activate-premium-mock`: marca `is_premium = true` y `premium_since` (sin pisarla si ya existía) para el usuario dueño del JWT que llama.
  - `cancel-premium-mock`: marca `is_premium = false` para el usuario dueño del JWT.
  - Ambas usan un helper compartido (`supabase/functions/_shared/getUserFromRequest.ts`) que resuelve el usuario **desde el JWT de la sesión** (`Authorization: Bearer ...`), nunca desde un `user_id` que venga en el body — así nadie puede activar o cancelar Premium de otra cuenta pasando un id ajeno.
  - Siguen siendo un *mock*: no verifican ningún pago real, solo simulan que ya se pagó — igual que antes, solo que ahora la escritura la hace el backend en vez del cliente. El día que se conecte una pasarela real, es el webhook de esa pasarela (`stripe-webhook`, ya escrito) el que debe marcar `is_premium`, con la misma Service Role Key.
- **Cliente actualizado** (`src/lib/payments.ts`: `activatePremiumMock()` / `cancelPremiumMock()`): reciben el `access_token` de la sesión activa y llaman a esas Edge Functions vía `fetch` con `Authorization: Bearer`. `Onboarding.tsx`, `Premium.tsx` y `Settings.tsx` ya no importan `supabase` para tocar `is_premium` — llaman a estas dos funciones y muestran un error legible (`PremiumUpsell`/`PremiumLock` ahora aceptan un prop `error`, y "Cancelar suscripción" usa el `Toast` existente) si la Edge Function todavía no está desplegada o falla.
- **Auditoría del resto de tablas (`transactions`, `subscriptions`, `savings_goals`, `category_limits`)**: sus políticas RLS (`auth.uid() = user_id`) ya restringen cada fila a su dueño, y a diferencia de `profiles` ninguna de estas tablas tiene una columna que el cliente pueda alterar para "ganar" algo (no hay cobros reales todavía — las suscripciones y límites son solo recordatorios/cálculos internos, no mueven dinero). No se encontró necesidad de bloquear columnas adicionales aquí.

> ⚠️ **Importante si vienes de la Fase 9 (o antes) con datos reales en Supabase**: después de correr la sección "Fase 11" de `supabase/schema.sql` (el trigger), el checkout mock deja de funcionar hasta que despliegues las dos Edge Functions nuevas — el `UPDATE` directo que hacía el cliente antes ahora es rechazado a propósito. Para desplegarlas:
> ```bash
> supabase functions deploy activate-premium-mock
> supabase functions deploy cancel-premium-mock
> ```
> (Sin `--no-verify-jwt` en ninguna de las dos: a diferencia de `stripe-webhook`, estas SÍ necesitan el JWT de sesión del usuario — es la base de su seguridad, ver el comentario en cada `index.ts`.) No hace falta configurar secrets nuevos: `SUPABASE_URL`, `SUPABASE_ANON_KEY` y `SUPABASE_SERVICE_ROLE_KEY` ya se inyectan automáticamente en toda función de Supabase.

**Pendiente real de esta fase** (no es código, es la misma decisión de negocio que ya frenaba la Fase 9): elegir y contratar una pasarela de pago real (LLC + Stripe, o Mercado Pago nativo en Chile — ver la sección "Activar pagos reales con Stripe" más abajo) y, una vez ahí, reemplazar `activatePremiumMock`/`cancelPremiumMock` por el flujo real (`createStripeCheckoutSession` + `stripe-webhook`, ya escritos, o el equivalente de Mercado Pago) y retirar el mock de producción (dejarlo solo detrás de `VITE_PAYMENT_PROVIDER=mock` para desarrollo).

### Fase 10 — Refresh visual y pulido

Lo que describía `claude.md` para esta fase eran en gran parte ajustes puntuales sobre una base que ya existía desde la Fase 0 (paleta oscura con acentos verdes, `AnimatedCounter`, `PageTransition`, haptics, `LimitBar` con shake). El trabajo de esta fase fue llevar esos valores a los exactos del spec y agregar los efectos que faltaban:

- **Paleta actualizada** (`src/index.css`, bloque `@theme`): los tokens de color ahora usan los valores exactos del spec — `--color-mint: #00d4aa` (esmeralda brillante, para totales/botones/íconos), `--color-income: #34d399` (verde menta), `--color-mint-deep: #065f46` (verde oscuro para glassmorphism), `--color-expense: #f87171` (coral) y `--color-bg: #0a0a0f`.
- **Tarjeta de Balance** (`.glass-balance` + `.balance-hero` en `index.css`, aplicada en `Dashboard.tsx`): gradiente `linear-gradient(135deg, #00d4aa 0%, #059669 50%, #065f46 100%)`, con un `glow-pulse` (sombra que respira cada 3.5s) y un `shimmer` (barrido de brillo diagonal cada 5s) como capas de animación CSS separadas de la base `glass-balance` — así los modales de Premium (`PremiumUpsell`, `PremiumLock`, `MockPaymentModal`), que comparten la misma base visual, no quedan con el fondo animándose todo el tiempo mientras el usuario lee o llena un formulario de pago. La tarjeta también entra con `framer-motion` (`opacity: 0, y: 20 → opacity: 1, y: 0`).
- **Fondo general** (`.app-shell-bg`, aplicada en `AppLayout` y `AuthShell`): `radial-gradient(circle at 50% 0%, rgba(0,212,170,0.05), transparent 70%)` sobre el fondo sólido, en vez de un negro plano.
- **Botones y FAB** (`.btn-gradient-primary` en `index.css`, usada por `PrimaryButton` y el botón "+" del `BottomNav`): gradiente `linear-gradient(135deg, #00d4aa, #34d399)` con glow (`box-shadow` verde) al hover/tap. El FAB además tiene `.fab-pulse`, un anillo detrás del botón que "late" (escala + fade) en loop suave para llamar la atención, tal como pide el spec.
- **Glassmorphism en listas** (`.card-glass` en `index.css`): aplicado a la lista de "Últimos movimientos" del Dashboard y a las tarjetas de la dona/desglose en Estadísticas (`background: rgba(255,255,255,0.04)`, `backdrop-filter: blur(12px)`). Las filas de transacciones (`TransactionRow`, `StatsCategoryRow`) ya traían desde fases anteriores el ícono circular con fondo de color suave por categoría y los montos en coral/menta según sean gasto o ingreso.
- **Fecha legible** (`src/lib/format.ts`, `dateLabel`): sigue mostrando "Hoy"/"Ayer" para los últimos dos días, y ahora incluye el año en el resto de los casos (`12 Abr 2026`, como pide el spec) en vez de solo día y mes.
- **Accesibilidad de movimiento**: todas las animaciones en loop (glow, shimmer, latido del FAB) se desactivan bajo `@media (prefers-reduced-motion: reduce)`; las transiciones puntuales (entrada de tarjetas, contadores, barras de progreso) no se tocaron porque son una sola vez, no un loop continuo.
- **Interpretación de una ambigüedad del spec**: en 10.4 se pide "barras horizontales con color verde" para el progreso de gastos por categoría del Dashboard. Se mantuvo el comportamiento ya existente desde la Fase 2 (`CategoryBar`), donde cada barra usa el color propio de su categoría en vez de un verde uniforme — es consistente con `ExpenseDonut` y `StatsCategoryRow` en Estadísticas, y permite distinguir categorías de un vistazo. Si se prefiere el verde uniforme literal del spec, es un cambio de una línea en `CategoryBar.tsx` (fijar el color en vez de leerlo de `getCategory`).
- **Pendiente real** (no es código, es verificación manual): probar en dispositivos/tamaños físicos distintos y correr una auditoría de contraste WCAG AA con una herramienta dedicada (ej. Lighthouse o axe DevTools) sobre el despliegue real. El layout ya es mobile-first con `max-w-md` y se revisó a ojo que el texto blanco/gris sobre los fondos oscuros y sobre el gradiente de la tarjeta de Balance mantenga buen contraste, pero no se corrió una herramienta automatizada de accesibilidad.

### Fase 9 — Integración de pagos para Premium

- **Sin cuenta de Stripe todavía**, así que "Adquirir Premium" (en el modal post-onboarding, en `/premium` y en "Gestionar suscripción" de `/settings`) ahora abre un **checkout simulado** (`src/components/MockPaymentModal.tsx`) en vez de activar Premium con un solo clic como hasta la Fase 8: pide número de tarjeta/vencimiento/CVV (puramente visuales, sin validar contra ningún banco), simula ~1.8s de "procesando" (`runMockCheckout` en `src/lib/payments.ts`) y termina con la misma animación de éxito que usa Add Transaction (`SuccessOverlay`).
- **Capa de pagos abstraída** (`src/lib/payments.ts`): todo lo que hoy llama al mock (`runMockCheckout`) está aislado ahí, con `createStripeCheckoutSession()` ya escrita al lado como el reemplazo cuando haya credenciales — así activar el cobro real es cambiar quién se llama, no reescribir las pantallas.
- **Edge Functions de Supabase ya escritas pero no desplegadas** (`supabase/functions/`):
  - `create-checkout-session`: crea una **Stripe Checkout Session en modo suscripción** (Premium es mensual, no un pago único) para el usuario y devuelve la URL de pago.
  - `stripe-webhook`: recibe los webhooks de Stripe (`checkout.session.completed`, `invoice.paid`, `customer.subscription.deleted`) y es quien realmente marca `is_premium = true/false` en Supabase — nunca lo hace el cliente directamente, para que no se pueda "activar Premium" solo editando el frontend.
- **Columnas nuevas en `profiles`** (`supabase/schema.sql`, sección Fase 9): `stripe_customer_id`, `stripe_subscription_id`, `stripe_last_payment_id` — quedan `NULL` mientras la activación es mock; se llenan solo cuando la suscripción viene de Stripe real.
- **Cancelar suscripción** (`/settings`) ahora pide confirmación (`ConfirmDialog`, reutilizado) antes de desactivar Premium; el comentario en el código deja explícito que, con Stripe real, ese botón conviene reemplazarlo por un link al **Customer Portal** hospedado de Stripe (no hay que construir esa pantalla) y que es el webhook el que confirma la baja, no el cliente.
- **Importante para este proyecto**: Stripe no opera cuentas de comerciante en Chile de forma directa (no está en su lista de países soportados para abrir cuenta) — ver el detalle y la alternativa en la sección de abajo.
- Cómo obtener la cuenta y activar todo esto de verdad: ver la sección **"Activar pagos reales con Stripe"** más abajo.

### Fase 8 — Perfil, Configuración y Gestión de Categorías

- **Categorías dinámicas**: hasta la Fase 7 las 8 categorías (Comida, Transporte, etc.) estaban hardcodeadas en `src/lib/categories.ts` y eran las únicas que existían en toda la app. Desde la Fase 8 conviven dos fuentes:
  - Las **8 categorías default** siguen hardcodeadas ahí mismo (mismo id/ícono/color de siempre) — decisión de diseño para que su apariencia nunca dependa de datos sembrados en Supabase y no requerir tocar las políticas RLS para exponer filas de un usuario "sentinel" a todos los demás.
  - Las **categorías personalizadas** de cada usuario viven en la tabla `categories` de Supabase (`is_default = false`, RLS ya restringe a `user_id = auth.uid()`) y se cargan en tiempo real con React Query (`src/hooks/useCategories.ts`: `useCustomCategories`, `useAllCategories`, `useCreateCategory`, `useDeleteCategory`).
  - Para que componentes "hoja" como `TransactionRow`, `LimitBar`, `ExpenseDonut` o `SubscriptionCard` puedan seguir resolviendo `getCategory(id)` de forma síncrona (como ya lo hacían) sin convertirlos a consumidores de la query, `useCustomCategories` sincroniza sus resultados en un store de Zustand (`src/store/categoryStore.ts`) que `getCategory()` consulta como *fallback* después de las default.
  - Selector de íconos: `CUSTOM_ICON_LIBRARY` en `lib/categories.ts` expone ~18 íconos de Lucide elegibles al crear una categoría; el color se asigna de forma determinística (hash del id sobre una paleta fija), así una misma categoría siempre se ve igual.
  - `AddTransaction`, las tabs de `/transactions` y los selectores de categoría de `/premium` (límites y suscripciones) ahora usan `useAllCategories` en vez del arreglo estático, así las categorías personalizadas aparecen en todos los flujos existentes.

- **Perfil** (`src/pages/Profile.tsx`): ahora muestra también el email de la cuenta y un badge de corona junto al nombre si es Premium, además de un botón de engranaje (y una tarjeta) que llevan a `/settings`.

- **Configuración** (`src/pages/Settings.tsx`, ruta `/settings`):
  - *Datos personales*: cambiar el nombre, con toast de confirmación (`src/components/Toast.tsx`, nuevo — pill que se autooculta, reutilizable para cualquier confirmación futura).
  - *Ingresos*: cambiar entre sueldo fijo/variable y actualizar el monto (mismo componente `OptionCard` que usa el Onboarding).
  - *Plan Premium*: estado actual y fecha de inicio si es Premium, botón "Gestionar suscripción" (lleva a `/premium`) y, si ya es Premium, "Cancelar suscripción" — mock que pone `is_premium = false` directamente (el Customer Portal real de Stripe llega en la Fase 9).
  - La gestión de metas/límites/suscripciones sigue sin estar aquí a propósito (vive en `/premium`, accesible desde los módulos del Dashboard), tal como pide `claude.md`.

- **Gestión de categorías** (`src/pages/CategoriesSettings.tsx`, ruta `/settings/categories`): lista las categorías default (con un ícono de candado, sin botón de eliminar) y las personalizadas del usuario (con botón de papelera). "Agregar categoría" abre `AddCategoryModal.tsx` (nombre + grid de íconos). Al eliminar una categoría personalizada se pide confirmación (`ConfirmDialog`, reutilizado) y `useDeleteCategory` reasigna a `'otros'` cualquier transacción que la usara antes de borrar la fila — así ninguna transacción queda apuntando a una categoría inexistente.

### Fase 7 — Pulido final, testing y generación de APK

- **Transiciones entre pantallas** (`src/components/PageTransition.tsx`): el contenido dentro del tab bar (Dashboard, Movimientos, Estadísticas, Perfil, Premium) usa `AnimatePresence` en `AppLayout` para hacer fade + slide sutil al cambiar de ruta, sin desmontar el `BottomNav`. Las pantallas de autenticación (`AuthShell`: Login, Sign Up, Forgot password) tienen la misma transición de entrada. El Onboarding ya traía su propio `AnimatePresence` entre pasos desde la Fase 1.
- **Feedback háptico** (`src/lib/haptics.ts`): utilidad sobre `navigator.vibrate` con niveles `light` / `medium` / `success` / `warning` / `error`, que se degrada en silencio si el dispositivo/navegador no lo soporta (ej. iOS Safari, escritorio). Conectada en: botones primarios, tabs y FAB del `BottomNav`, selección de categoría/opciones, toggle de Gasto-Ingreso, apertura y confirmación de `ConfirmDialog` (eliminar transacción/meta/límite/suscripción), toggle de suscripciones activas, aporte a una meta, swipe-to-delete, y overlay de éxito al guardar. `LimitBar` dispara un aviso háptico solo la vez que un límite pasa a estado "superado" (no en cada render).
- **Code-splitting por ruta** (`src/App.tsx`): cada página se carga con `React.lazy` + `Suspense`, con un fallback del color de fondo (sin parpadeo blanco). Esto bajó el bundle inicial de ~972 KB a ~382 KB y eliminó la advertencia de "chunk demasiado grande" en el build de producción.
- **Responsive**: layout mobile-first ya validado en las fases anteriores (contenedor `max-w-md`, grids fluidos, `overflow-x-auto` en carruseles, `env(safe-area-inset-bottom)` en el `BottomNav`); se revisó que no queden anchos fijos que puedan desbordar en pantallas angostas (320–360px).
- **Build de producción verificado**: `npm run build` (tsc + vite build) y `npm run lint` (oxlint) corren sin errores ni advertencias.
- **Íconos PWA reales**: se generaron `public/icons/icon-192.png`, `icon-512.png`, `icon-512-maskable.png` (zona segura para máscaras de Android) y `apple-touch-icon.png`, a partir del logo de `favicon.svg`. `index.html` ahora referencia el `apple-touch-icon` y el `theme-color` quedó alineado con el fondo real de la app (`#0a100d`).

## Configuración

1. Instala dependencias:
   ```bash
   npm install
   ```

2. Copia `.env.example` a `.env` y completa con tus credenciales de Supabase (Project Settings → API):
   ```bash
   cp .env.example .env
   ```
   ```
   VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
   VITE_SUPABASE_ANON_KEY=tu-anon-key-publica
   ```

3. En el SQL Editor de tu proyecto de Supabase, ejecuta `supabase/schema.sql`. Esto crea las tablas (`profiles`, `transactions`, `categories`, `subscriptions`, `savings_goals`, `category_limits`, `push_subscriptions`, `notification_prefs`, `notifications_log`), el trigger que crea el perfil automáticamente al registrarse, las políticas RLS para que cada usuario solo vea sus propios datos, y (Fase 11) el trigger que bloquea que el cliente escriba `is_premium` y los campos de Stripe directamente.

4. Habilita el proveedor **Email** en Authentication → Providers de Supabase (login es solo email/contraseña, sin Google en esta versión).

5. Instala la CLI de Supabase (`npm install -g supabase`), haz login (`supabase login`) y link a tu proyecto (`supabase link --project-ref tu-proyecto`), y despliega las dos Edge Functions que activan/cancelan Premium (ver Fase 11 más abajo para el detalle):
   ```bash
   supabase functions deploy activate-premium-mock
   supabase functions deploy cancel-premium-mock
   ```
   Sin esto, el checkout mock de Premium no funciona: el trigger del paso 3 rechaza a propósito el `UPDATE` directo que hacía el cliente hasta la Fase 9.

6. **Notificaciones push (Fase 13.1)** — opcional, sin esto la app funciona igual, solo sin avisos push:
   1. Genera un par de claves VAPID una sola vez: `npx web-push generate-vapid-keys`.
   2. Agrega la clave pública a tu `.env`: `VITE_VAPID_PUBLIC_KEY=la-que-imprimió-el-comando`.
   3. Configura los secrets de la Edge Function del cron (la privada **nunca** va en `.env` ni en ningún archivo del cliente):
      ```bash
      supabase secrets set VAPID_PUBLIC_KEY=... VAPID_PRIVATE_KEY=... VAPID_SUBJECT=mailto:tu@correo.com
      supabase secrets set CRON_SECRET=$(openssl rand -hex 32)
      supabase functions deploy check-notifications --no-verify-jwt
      ```
   4. Programa el cron diario con `pg_cron` + `pg_net` — ver el SQL exacto (y por qué `--no-verify-jwt` sigue siendo seguro gracias a `CRON_SECRET`) en el comentario al inicio de `supabase/functions/check-notifications/index.ts`.

## Correr localmente

```bash
npm install
npm run dev
```

Abre `http://localhost:5173`.

## Tests y CI

```bash
npm run test        # corre toda la suite una vez (Vitest)
npm run test:watch  # modo watch, útil mientras se desarrolla
npm run lint         # oxlint
```

`.github/workflows/ci.yml` corre lint + chequeo de tipos + tests + build en cada push/PR a `main`. Ver la sección "Fase 12" más arriba para qué cubre cada archivo de test.

## Build de producción

```bash
npm run build
npm run preview
```

## Stack

- React 18 + TypeScript + Vite
- Tailwind CSS v4 (config CSS-first en `src/index.css`, tokens de diseño en `@theme`)
- Framer Motion (animaciones)
- Zustand (sesión/estado de UI) + TanStack Query (datos de Supabase)
- React Router v6
- Recharts (gráficos, se usan desde la Fase 5)
- Supabase (`@supabase/supabase-js`)
- vite-plugin-pwa
- Vitest + Testing Library (tests, desde la Fase 12) + `fake-indexeddb` (solo en tests, para simular el caché offline)

## Generar el APK con PWA Builder

La app ya cumple los requisitos de una PWA instalable (manifest, service worker, íconos 192/512/maskable). Para convertirla en un `.apk`:

1. **Desplegar la build de producción en una URL pública con HTTPS.** PWA Builder necesita auditar la PWA ya publicada (no funciona sobre `localhost`). Opciones rápidas y gratuitas: [Vercel](https://vercel.com), [Netlify](https://netlify.com) o GitHub Pages. Configuración típica:
   - Comando de build: `npm run build`
   - Carpeta de salida: `dist`
   - No olvides definir `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` como variables de entorno en el panel del hosting elegido (son públicas, van al bundle del cliente — la seguridad real la dan las políticas RLS de Supabase, no el secreto de estas claves).
2. Entra a **[pwabuilder.com](https://www.pwabuilder.com)** e ingresa la URL pública de tu despliegue.
3. PWA Builder analiza el manifest y el service worker; deberías ver un puntaje alto ya que todo lo necesario (`name`, `icons`, `theme_color`, `display: standalone`, `start_url`) está configurado en `vite.config.ts`.
4. En la pestaña **Android**, genera el paquete. Puedes elegir entre:
   - **TWA (Trusted Web Activity)**: el APK abre tu PWA dentro de una vista de Chrome sin barra de navegador — es la opción recomendada, liviana y mantiene el service worker/offline.
   - Firma el paquete con una keystore (PWA Builder puede generarte una de prueba, o puedes subir la tuya si ya tienes una de Google Play).
5. Descarga el `.apk` (o `.aab` si vas a subirlo a Google Play) e instálalo en un dispositivo Android para probarlo (`adb install nombre.apk`, o simplemente transfiriéndolo al teléfono).

> Nota: los efectos hápticos (`navigator.vibrate`, ver `src/lib/haptics.ts`) sí funcionan dentro del TWA porque corre sobre Chrome para Android — no funcionarán si alguien abre la misma PWA en iOS Safari, ahí simplemente no vibra (degradación silenciosa, no rompe nada).

## Activar pagos reales con Stripe

Hoy Premium se activa con un checkout simulado (`MockPaymentModal`, ver Fase 9 más arriba). Cuando quieras cobrar de verdad, esto es lo que falta — dividido en "conseguir la cuenta" y "conectarla a la app".

> ⚠️ **Antes de empezar**: Stripe no tiene a Chile en su lista de países donde se puede abrir una cuenta de comerciante directamente (sí puedes cobrar en CLP a clientes chilenos, pero para *recibir* el dinero Stripe necesita que la cuenta esté registrada en uno de sus países soportados). La forma habitual de salvar esto es constituir una LLC en EE.UU. (servicios como Stripe Atlas, o cualquier agente de formación de empresas) con un EIN y una cuenta bancaria estadounidense (fintechs como Mercury o Wise Business la ofrecen sin pisar EE.UU.), y usar esa entidad para la cuenta de Stripe. Es una vuelta adicional real, no un trámite de 10 minutos — tenlo presente antes de invertir tiempo en el resto de esta sección. Si en algún momento prefieres evitarte eso, Mercado Pago opera nativo en Chile y el mismo patrón de este proyecto (capa de pagos abstraída + Edge Functions + webhook) se replica igual de fácil para esa pasarela.

### 1. Crear tu cuenta y obtener las credenciales

1. Resuelve el punto de la LLC/cuenta bancaria en EE.UU. de la advertencia de arriba (o decide seguir sin activar el cobro real todavía — el mock sigue funcionando mientras tanto).
2. Crea tu cuenta en [dashboard.stripe.com/register](https://dashboard.stripe.com/register) con esa entidad.
3. En el Dashboard, activa el **modo de prueba** (toggle "Test mode" arriba a la derecha) mientras integras — así puedes probar todo con [tarjetas de prueba de Stripe](https://docs.stripe.com/testing) sin mover dinero real.
4. Crea el producto de la suscripción: **Product catalog -> Add product** — nombre "Gastos Premium", y en "Pricing" elige **Recurring**, monto **1.500**, moneda **CLP**, período **Monthly**. Guarda y copia el **Price ID** (`price_...`) que te muestra — es el `STRIPE_PRICE_ID` que vas a necesitar.
5. Obtén tus API keys en **Developers -> API keys**: la **Secret key** (`sk_test_...` en modo prueba, `sk_live_...` en producción) es la que usan las Edge Functions — nunca va en el cliente ni se sube a git.
6. Cuando todo funcione en modo prueba, repite los pasos 4-5 en modo producción (activa tu cuenta con los datos reales de tu LLC que Stripe te va a pedir) y usa esas credenciales `_live_`.

### 2. Configurar el proyecto

1. En Supabase, corre la parte de "Fase 9" de `supabase/schema.sql` si todavía no ejecutaste el schema completo (agrega las columnas `stripe_customer_id`, `stripe_subscription_id`, `stripe_last_payment_id` a `profiles`).
2. Instala la CLI de Supabase si no la tienes (`npm install -g supabase`), haz login (`supabase login`) y link a tu proyecto (`supabase link --project-ref tu-proyecto`).
3. Despliega las dos Edge Functions ya escritas en `supabase/functions/`:
   ```bash
   supabase functions deploy create-checkout-session
   supabase functions deploy stripe-webhook --no-verify-jwt
   ```
   (`stripe-webhook` necesita `--no-verify-jwt` porque a esa URL la llama Stripe directamente, sin el JWT de sesión de Supabase.)
4. Configura los secrets que `create-checkout-session` necesita (con tus credenciales del paso 1):
   ```bash
   supabase secrets set STRIPE_SECRET_KEY=sk_test_tu-secret-key
   supabase secrets set STRIPE_PRICE_ID=price_tu-price-id
   supabase secrets set STRIPE_SUCCESS_URL=https://tu-dominio.com/premium-success
   supabase secrets set STRIPE_CANCEL_URL=https://tu-dominio.com/premium
   ```
5. En el Dashboard de Stripe (**Developers -> Webhooks -> Add endpoint**), registra la URL pública de `stripe-webhook`: `https://tu-proyecto.supabase.co/functions/v1/stripe-webhook`, escuchando los eventos `checkout.session.completed`, `invoice.paid` y `customer.subscription.deleted`. Stripe te va a mostrar un **Signing secret** (`whsec_...`) al crearlo:
   ```bash
   supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_tu-signing-secret
   supabase secrets set STRIPE_SECRET_KEY=sk_test_tu-secret-key
   ```
6. En el `.env` del frontend, agrega:
   ```
   VITE_PAYMENT_PROVIDER=stripe
   VITE_SUPABASE_FUNCTIONS_URL=https://tu-proyecto.supabase.co/functions/v1
   ```
7. Reemplaza, en `Premium.tsx` y `Onboarding.tsx`, la apertura de `<MockPaymentModal />` por una llamada a `createStripeCheckoutSession(userId)` (ya está escrita en `src/lib/payments.ts`) y redirige a `url` en vez de mostrar el modal. `stripe-webhook` es quien va a marcar `is_premium = true` cuando Stripe confirme el primer pago — no hace falta (ni conviene) que el cliente lo haga.
8. Opcional pero recomendado: para "Cancelar suscripción" en `/settings`, en vez de mantener el mock, crea una tercera Edge Function chica que llame a `stripe.billingPortal.sessions.create({ customer: stripe_customer_id })` y redirige ahí — es la pantalla hospedada de Stripe donde el usuario cancela o cambia su tarjeta sin que tengas que construir nada de esa UI.

## Próximos pasos

Con las Fases 0 a 12 completas (Fase 9 y Fase 11 con el mock ya asegurado por Edge Functions + trigger, pero sin pasarela real conectada todavía), quedan por delante las Fases 13-14 de `claude.md`:

- **Fase 13** — Notificaciones push (suscripción próxima a cobrarse, límite al 80%, meta cerca de su fecha) y completar el CRUD de transacciones (editar, buscar, filtrar por fecha).
- **Fase 14** — Exportar a CSV/PDF, selector de mes en el Dashboard, comparación con el mes anterior, auditoría de contraste WCAG AA y aplicar `.section-glow-bg`.

Y lo que sigue pendiente de fases anteriores:
- La verificación manual de la Fase 10 (testing en dispositivos reales y auditoría de contraste con una herramienta dedicada).
- La verificación manual de la Fase 12 (probar el modo offline en un navegador real con la pestaña de Red en "Offline"; ver 12.7).
- La decisión, opcional y evaluada, de la cola de escritura offline de la Fase 12.6 (se decidió no implementarla por ahora — ver justificación en la sección Fase 12).
- La decisión de pasarela de pago real de las Fases 9/11 (LLC + Stripe vs. Mercado Pago) y, una vez tomada, reemplazar el mock por el cobro real.
