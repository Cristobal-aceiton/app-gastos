GASTOS - claude.md
Versión 3.3 (Fases 8-9-10 + Integración Premium visible en Dashboard + Fases 11-14: seguridad de pagos reales, testing/offline, notificaciones/CRUD y pulido final)

📜 REGLAS OBLIGATORIAS DEL PROYECTO
Este archivo (claude.md) es el cerebro del proyecto.

❌ Prohibido eliminarlo o reescribirlo desde cero.

✅ Solo se permite modificar la sección de "Checklist de Fases" al final de cada entrega, marcando con [x] lo terminado o añadiendo notas de PENDIENTE si algo falla.

Entregas: Al finalizar cada fase, debes empaquetar el proyecto en un archivo .zip y proporcionar:
- Instrucciones de configuración (variables de entorno, clave de Supabase).
- Pasos para correrlo localmente (npm install, npm run dev).

Tecnología principal: React + Vite + TypeScript. Backend obligatorio: Supabase (Auth + Database + Storage). No se usará IndexedDB como fuente primaria, solo para caché ligera si acaso.

---

1. DESCRIPCIÓN GENERAL
"Gastos" es una PWA para gestión financiera. Conectada a Supabase para sincronizar datos entre dispositivos. Ofrece registro de ingresos/gastos, estadísticas, y plan Premium con metas, límites y suscripciones automáticas.

**Principio de diseño**: Las funcionalidades Premium (metas de ahorro, límites por categoría, suscripciones automáticas) deben estar visibles en el Dashboard y en las secciones principales, no escondidas en un menú de perfil. Si el usuario es gratuito, esos módulos aparecerán con un bloqueo visual y un botón para mejorar a Premium.

---

2. STACK TECNOLÓGICO (ACTUALIZADO)
Frontend: React 18, TypeScript, Vite.

Estilos: Tailwind CSS + Framer Motion (animaciones).

Estado: Zustand (para UI y caché local) + React Query (@tanstack/react-query) para sincronizar con Supabase.

Base de Datos y Auth: Supabase (@supabase/supabase-js).

Rutas: React Router v6.

Gráficos: Recharts.

PWA: vite-plugin-pwa.

Pagos: Stripe (opcional: Mercado Pago) para suscripciones Premium.

---

3. FLUJO DE AUTENTICACIÓN Y ONBOARDING (NUEVO)
3.1. Registro / Login
Pantallas de Sign Up (Correo + Contraseña) y Sign In.

NO hay botón de "Continue with Google". Solo email/contraseña tradicional.

3.2. Onboarding (Primer ingreso)
Cuando un usuario inicia sesión por primera vez, la app detecta que no tiene datos de perfil completos y redirige a una pantalla de Personalización:

- ¿Cómo te llamas? (Campo de texto, obligatorio).
- ¿Para qué usarás la app? (Selector visual: "Ahorrar para un viaje", "Controlar gastos del día a día", "Administrar mi negocio/freelance", "Solo curiosidad").
- Tipo de Ingreso:
  - Opción A: "Tengo sueldo fijo" -> Input para ingresar el monto mensual (este será tu ingreso base cada mes).
  - Opción B: "Mis ingresos son variables" -> Explicación emergente: "Tranquilo, no necesitas poner un monto ahora. A medida que registres tus ingresos manualmente (ej: cobro de proyectos), la app los sumará automáticamente y los considerará tu 'Sueldo Dinámico' del mes."

3.3. Pantalla de Bienvenida a Premium (Post-Onboarding)
Justo después de guardar la personalización, se muestra un Pop-up o pantalla completa (estilo modal atractivo) con:
- Título llamativo: "🚀 Lleva tus finanzas al siguiente nivel".
- Beneficios Premium listados: Metas de ahorro, Límites por categoría, Alertas tempranas, Descuento automático de suscripciones.
- Precio: $1.500 CLP / mes (~ $1.60 USD).
- Botón principal: "Adquirir Premium ahora - $1.60 USD" (abre un mock de pago o redirige a web de pago).
- Botón secundario: "No, gracias. Usar versión gratuita" (cierra el modal y lleva al Dashboard).

---

4. DISEÑO Y UI/UX (TEMÁTICA VISUAL — REFRESH CON DEGRADADOS VIBRANTES)
Basado en las imágenes de referencia (interfaz "Spendly"), la aplicación debe adoptar una estética moderna, limpia y oscura, con los siguientes lineamientos:

- **Paleta de colores**:
  - Fondo principal: `#0a0a0f` (negro azulado profundo) con sutiles texturas o gradientes sutiles de fondo.
  - **Acentos vibrantes (VERDES ACTIVOS)**:
    - Verde esmeralda brillante: `#00d4aa` (para totales, botones primarios, iconos).
    - Verde menta: `#34d399` (para ingresos, badges positivos).
    - Verde oscuro: `#065f46` (para fondos de tarjetas en modo glassmorphism).
    - Gradientes principales:
      - Balance card: `linear-gradient(135deg, #00d4aa 0%, #059669 50%, #065f46 100%)` con efecto de brillo.
      - Botón primario: `linear-gradient(135deg, #00d4aa, #34d399)` con sombra verde.
      - Fondo de secciones: `linear-gradient(180deg, rgba(0,212,170,0.08) 0%, transparent 100%)` para dar profundidad.
  - Textos: blancos (`#ffffff`) y grises claros (`#a0aec0`) para legibilidad.
  - Tarjetas: glassmorphism con `background: rgba(255,255,255,0.05)`, `backdrop-filter: blur(12px)`, `border: 1px solid rgba(255,255,255,0.08)`.

- **Tipografía**: Fuente sans-serif moderna (Inter, Poppins o similar) con pesos variables para establecer jerarquías visuales.

- **Componentes clave (con estilo renovado)**:
  - **Tarjeta de Balance**: Ubicada en la parte superior, con **fondo degradado verde vibrante** (emerald → teal), sombra exterior con glow verde, mostrando el balance total, ingresos y gastos del mes. Efecto de "brillo" sutil en los bordes.
  - **Botones redondeados**: Con bordes suaves, sombras y efecto hover/active. El botón primario usa el gradiente verde con glow al hover.
  - **Lista de transacciones**: Cada ítem incluye ícono de categoría (con fondo circular de color sutil), título, monto (negativo en rojo coral `#f87171`, positivo en verde menta `#34d399`) y fecha, con alineación a la izquierda y detalles secundarios.
  - **Filtros por categoría**: Tabs horizontales con indicador activo (subrayado o cambio de color al verde brillante).
  - **Pantallas de autenticación**: Campos de entrada con bordes redondeados y fondo oscuro, botón primario llamativo con gradiente verde y glow.

- **Efectos y animaciones**:
  - Transiciones suaves entre pantallas (Framer Motion) con `AnimatePresence`.
  - Microinteracciones: escalado al presionar botones (`scale: 0.95`), feedback háptico en dispositivos táctiles.
  - **Efecto de brillo pulsante** en la tarjeta de balance (animación de glow).
  - Entrada de números con animación de conteo (`AnimatedCounter`).
  - Confetti o checkmark al guardar transacciones.

- **Layout general**:
  - Navegación inferior (Bottom Nav) con íconos para las secciones principales (Dashboard, Transacciones, Estadísticas, Perfil).
  - Cabecera superior: saludo personalizado (ej. "Good evening, [nombre]") con avatar o inicial del usuario, y un pequeño indicador de estado Premium (corona o badge verde).

- **Visibilidad de funciones Premium**:
  - En el Dashboard, justo debajo del resumen de gastos, se mostrarán tres módulos horizontales (o en cuadrícula):
    - "Metas de ahorro" (muestra la meta más cercana o un botón para crear una si es Premium; si no, muestra un candado y "Desbloquea con Premium").
    - "Límites por categoría" (muestra el límite de una categoría con barra de progreso; si no es Premium, bloqueado).
    - "Suscripciones" (muestra el próximo cobro; si no es Premium, bloqueado).
  - Al hacer clic en cualquiera de estos módulos bloqueados, se abre un modal de upgrade a Premium (con los mismos beneficios y botón de pago).
  - En la pantalla de Estadísticas, también se puede mostrar un indicador de límites y metas si el usuario es Premium.

Se debe priorizar la claridad de la información financiera y la facilidad de uso, manteniendo una experiencia de usuario fluida y atractiva, con una identidad visual vibrante y moderna.

---

5. ESTRUCTURA DE BASE DE DATOS (SUPABASE)
Crear las siguientes tablas en SQL (se proporciona el esquema para ejecutar en el SQL Editor de Supabase):

```sql
-- Usuarios (extiende el auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  name TEXT NOT NULL,
  purpose TEXT,
  income_type TEXT CHECK (income_type IN ('fixed', 'variable')),
  fixed_salary NUMERIC DEFAULT 0,
  is_premium BOOLEAN DEFAULT FALSE,
  premium_since DATE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Transacciones
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('income', 'expense')),
  category TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Categorías (con soporte para categorías personalizadas)
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  icon TEXT,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Suscripciones (Premium)
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  billing_day INT NOT NULL, -- día del mes (1-31)
  category TEXT DEFAULT 'Servicios',
  active BOOLEAN DEFAULT TRUE
);

-- Metas de ahorro (Premium)
CREATE TABLE savings_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  target_amount NUMERIC NOT NULL,
  saved_amount NUMERIC DEFAULT 0,
  deadline DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Límites por categoría (Premium)
CREATE TABLE category_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  limit_amount NUMERIC NOT NULL,
  month_year DATE NOT NULL -- primer día del mes (ej: 2026-09-01)
);
Políticas de Seguridad (RLS): Todas las tablas tienen FOR ALL habilitado solo para el user_id = auth.uid().

Datos iniciales para categorías predeterminadas (ejecutar tras crear la tabla):

sql
INSERT INTO categories (id, name, icon, is_default, user_id)
VALUES
  (gen_random_uuid(), 'Comida', 'utensils', TRUE, '00000000-0000-0000-0000-000000000000'),
  (gen_random_uuid(), 'Transporte', 'bus', TRUE, '00000000-0000-0000-0000-000000000000'),
  (gen_random_uuid(), 'Compras', 'shopping-bag', TRUE, '00000000-0000-0000-0000-000000000000'),
  (gen_random_uuid(), 'Salud', 'heart-pulse', TRUE, '00000000-0000-0000-0000-000000000000'),
  (gen_random_uuid(), 'Entretenimiento', 'film', TRUE, '00000000-0000-0000-0000-000000000000'),
  (gen_random_uuid(), 'Servicios', 'wifi', TRUE, '00000000-0000-0000-0000-000000000000'),
  (gen_random_uuid(), 'Sueldo', 'briefcase', TRUE, '00000000-0000-0000-0000-000000000000'),
  (gen_random_uuid(), 'Otros', 'more-horizontal', TRUE, '00000000-0000-0000-0000-000000000000');
FASES DE CONSTRUCCIÓN (ROADMAP)

📦 FASE 0: CIMENTACIÓN Y SUPABASE

Inicializar proyecto Vite con React-ts.

Instalar dependencias: @supabase/supabase-js, @tanstack/react-query, framer-motion, react-router-dom, zustand, recharts, lucide-react, vite-plugin-pwa.

Configurar el cliente de Supabase en /src/lib/supabase.ts (usando variables de entorno).

Configurar PWA básica (manifest.json, service worker).

Crear layout raíz con navegación inferior (Bottom Nav) para: Dashboard, Transacciones, Estadísticas, Perfil.

Criterio de entrega: Que al hacer npm run dev no dé errores y se vea el esqueleto de la app.

📦 FASE 1: AUTENTICACIÓN Y ONBOARDING

Pantallas de Login y SignUp (email + password) con validación.

Lógica de Zustand para manejar sesión (setear usuario al login).

Crear ProtectedRoute para redirigir al login si no hay sesión.

Onboarding:

Al registrarse, guardar en profiles solo el id (trigger automático desde Supabase).

Al loguearse, verificar si name está vacío. Si lo está, redirigir a /onboarding.

Pantalla /onboarding con los 3 pasos (Nombre, Propósito, Tipo de ingreso).

Al guardar, hacer UPDATE en profiles y redirigir al modal de Premium.

Modal Premium Upsell: Diseño llamativo (glassmorphism). Botones funcionales (solo guardan preferencia is_premium = true mockeado o false).

📦 FASE 2: DASHBOARD PRINCIPAL (HOME)

Conectar con Supabase para traer:

Total ingresos del mes actual.

Total gastos del mes actual.

Balance (Ingresos - Gastos).

Últimas 5 transacciones.

Mostrar datos con AnimatedCounter (microinteracción).

Resumen de gastos por categoría en pequeñas barras (sin gráfico aún).

Botón flotante "+" (Add) para navegar a /add-transaction.

Nuevo: Sección de módulos Premium (metas, límites, suscripciones) visibles en el Dashboard (bloqueados si no es Premium, con botón de upgrade).

📦 FASE 3: AGREGAR TRANSACCIONES (CRUD)

Pantalla /add-transaction.

Toggle Income / Expense con animación.

Grid de categorías predefinidas (Comida, Transporte, Compras, Salud, Entretenimiento, Servicios, Sueldo, Otros) con íconos de Lucide.

Selector de fecha (DatePicker nativo).

Campo de monto (formateado) y nota opcional.

Al guardar, insertar en Supabase tabla transactions y refrescar el Dashboard automáticamente (React Query invalidate).

Animación de éxito (confetti o checkmark).

📦 FASE 4: LISTA COMPLETA Y FILTROS

Pantalla /transactions con scroll infinito (usando react-infinite-scroll o useInfiniteQuery de TanStack).

Tabs horizontales: "Todos", "Comida", "Transporte", etc. (filtra por categoría).

Cada ítem tiene swipe para eliminar (o botón de eliminar con confirmación).

Conectar con Supabase (filtrado por user_id y date).

📦 FASE 5: ESTADÍSTICAS (GRÁFICOS)

Pantalla /stats.

Gráfico de Dona (Recharts) mostrando porcentaje de gastos por categoría (basado en el mes actual).

Lista con porcentaje exacto y barra horizontal animada.

Selector para cambiar de mes (DatePicker de mes/año).

Nuevo: Si es Premium, mostrar límites de categoría y metas en esta misma pantalla.

📦 FASE 6: FUNCIONALIDADES PREMIUM (BACKEND Y LÓGICA) - Integradas en el Dashboard

Metas de ahorro: CRUD de metas. La meta más cercana se muestra en el Dashboard con barra de progreso circular; al hacer clic, se abre una vista detallada (gestión de metas).

Límites por categoría: El usuario asigna un tope a una categoría. En el Dashboard, si el gasto actual supera el 80%, la categoría se muestra en amarillo; al 100%, en rojo con animación de "shake". Además, se muestra un resumen de límites en el Dashboard.

Suscripciones automáticas:

El usuario añade "Netflix - $10 - Día 15".

Al abrir la app, se ejecuta una función que revisa si hoy es día de cobro y si no existe ya una transacción de ese servicio en el mes actual. Si no existe, la crea automáticamente.

En el Dashboard, se muestra el próximo cobro (fecha y monto).

Acceso a gestión: Desde los módulos del Dashboard, se puede navegar a pantallas de gestión de metas, límites y suscripciones (rutas /goals, /limits, /subscriptions). Estas pantallas solo son accesibles si el usuario es Premium; si no, redirigen al modal de upgrade.

📦 FASE 7: PULIDO FINAL, TESTING Y GENERACIÓN DE APK

Revisar todas las microinteracciones: transiciones entre páginas (usar AnimatePresence), efectos hápticos en botones.

Probar en móvil (responsive obligatorio).

Construir el proyecto (npm run build).

Generar assets para PWA (íconos de distintos tamaños).

Empaquetar en .zip con instrucciones para subir a PWA Builder y generar el APK.

📦 FASE 8: PERFIL, CONFIGURACIÓN Y GESTIÓN DE CATEGORÍAS (NUEVA)
Objetivo: Dotar al usuario de un centro de control para su perfil, preferencias financieras y categorías personalizadas.

8.1. Pantalla de Perfil (/profile)

Mostrar información del usuario: avatar (inicial), nombre, email.

Badge de estado Premium (corona dorada o verde) si es_premium = true.

Acceso a Configuración (botón de engranaje).

Opción para cerrar sesión.

8.2. Pantalla de Configuración (/settings)

Sección "Datos Personales":

Campo para cambiar nombre (input + botón "Guardar").

Confirmación con toast de éxito.

Sección "Ingresos":

Selector: "Tipo de ingreso" (Fijo / Variable).

Si es "Fijo": input para actualizar el monto del sueldo fijo mensual.

Si es "Variable": mensaje informativo de que los ingresos se suman automáticamente.

Botón "Actualizar sueldo" que hace UPDATE en profiles.

Sección "Plan Premium":

Mostrar estado actual: "Gratuito" o "Premium" con fecha de inicio.

Botón "Gestionar suscripción" (abre el flujo de pago, Fase 9).

Si es Premium: botón "Cancelar suscripción" (redirige a Stripe Customer Portal o mock).

Nota: La gestión de metas, límites y suscripciones NO está en esta pantalla, sino que se accede desde los módulos del Dashboard (para mantenerlas visibles y accesibles).

8.3. Gestión de Categorías (/settings/categories)

Listado de todas las categorías disponibles para el usuario (default + personalizadas).

Categorías predeterminadas: muestran un ícono de candado 🔒 y no tienen botón de eliminar. Solo se pueden ver.

Categorías personalizadas: muestran ícono de "X" o papelera para eliminar. Al eliminar, se confirma con un modal y se borra de la tabla categories (solo si is_default = FALSE).

Botón "Agregar categoría" -> abre un modal con:

Campo de texto para nombre (obligatorio).

Selector de ícono (grid de Lucide icons para elegir).

Botón "Crear" -> inserta en categories con user_id = auth.uid() y is_default = FALSE.

Al guardar/eliminar, invalidar la query de categorías para que se refleje en toda la app.

Impacto en Transacciones: Si se elimina una categoría personalizada, las transacciones que la usen pasan a categoría "Otros" (o se les asigna un fallback). Se debe mostrar un mensaje de advertencia.

8.4. Integración con el flujo de agregar transacción

En /add-transaction, el grid de categorías debe mostrar TANTO las default como las personalizadas del usuario.

Las categorías personalizadas se cargan desde Supabase en tiempo real con React Query.

📦 FASE 9: INTEGRACIÓN DE PAGOS PARA PREMIUM (NUEVA)
Objetivo: Implementar un flujo de pago real (o mock funcional) para que los usuarios adquieran la suscripción Premium.

9.1. Elección de Gateway de Pago

Opción recomendada: Stripe (por su facilidad de integración con Supabase Edge Functions y soporte para CLP).

Alternativa: Mercado Pago (popular en Latinoamérica).

Para el MVP: se puede implementar un mock de pago que simule el éxito y actualice is_premium = TRUE, pero dejando la estructura lista para Stripe.

9.2. Flujo de Suscripción

Desde el modal de upsell (Fase 1) o desde Configuración -> "Gestionar suscripción", o desde cualquier módulo bloqueado en el Dashboard:

Se invoca una Edge Function de Supabase que crea un Checkout Session de Stripe.
El usuario es redirigido a la página de pago de Stripe (o se abre un WebView).
Tras el pago exitoso, Stripe redirige a un callback URL de la app (ej: /premium-success).
En esa página, se verifica el estado de la suscripción y se actualiza profiles.is_premium = TRUE y premium_since = NOW().
Se muestra un mensaje de éxito con confeti y se redirige al Dashboard.
9.3. Webhooks de Stripe (para manejar renovaciones y cancelaciones)

Configurar un endpoint en Supabase Edge Functions que reciba eventos de Stripe:

invoice.paid -> renovar suscripción.

customer.subscription.deleted -> desactivar Premium (is_premium = FALSE).

Actualizar profiles con stripe_customer_id y stripe_subscription_id.

9.4. Mock de pago (para pruebas sin Stripe)

Si no se cuenta con Stripe, implementar un modal que simule el proceso:

Input de tarjeta de prueba (estilo visual).

Botón "Pagar $1.500 CLP" que tras 2 segundos muestra "¡Pago exitoso!".

Actualiza is_premium = TRUE en Supabase directamente.

Esto permite probar el flujo Premium sin depender de un gateway real.

9.5. Actualización de UI según estado Premium

Si is_premium = FALSE: los módulos de metas, límites y suscripciones en el Dashboard se muestran con un overlay de bloqueo (candado) y un botón "Mejorar a Premium". Al hacer clic, se abre el modal de upsell.

Si is_premium = TRUE: los módulos se desbloquean y muestran datos reales, con opciones de gestión.

📦 FASE 10: REFRESH VISUAL Y PULIDO (NUEVA)
Objetivo: Transformar la interfaz actual en una experiencia vibrante y moderna, inspirada en Spendly, con degradados verdes activos y microinteracciones pulidas.

10.1. Implementación de la nueva paleta visual

Aplicar el gradiente verde vibrante a la tarjeta de Balance (linear-gradient(135deg, #00d4aa, #059669, #065f46)).

Agregar efecto de glow pulsante alrededor de la tarjeta de balance (sombra con animación CSS).

Fondo general: #0a0a0f con un gradiente sutil radial en el centro (radial-gradient(circle at 50% 0%, rgba(0,212,170,0.05), transparent 70%)).

Botones primarios con gradiente verde y glow al hover (sombra 0 0 20px rgba(0,212,170,0.4)).

Tarjetas de transacciones y estadísticas con glassmorphism (backdrop-filter: blur(12px), background: rgba(255,255,255,0.04)).

10.2. Animaciones y microinteracciones

Entrada de la tarjeta de balance: animación de fade-in desde abajo con escala ligera (initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }).

Conteo animado: usar AnimatedCounter para que los totales (balance, ingresos, gastos) suban desde 0 al cargar la página.

Efecto "shimmer" en el fondo de la tarjeta de balance (un resplandor que se mueve).

Botón flotante "+": con pulso suave (animación de latido) para llamar la atención.

Transiciones entre pestañas: usar AnimatePresence con motion.div para que el contenido entre con fade y slide.

Feedback táctil: en dispositivos móviles, usar navigator.vibrate(10) en botones importantes.

10.3. Mejoras en la lista de transacciones

Agregar un ícono circular con fondo de color suave (según categoría) a la izquierda de cada ítem.

Montos negativos en rojo coral (#f87171) y positivos en verde menta (#34d399).

Fecha con formato legible ("Hoy", "Ayer", o "12 Abr 2026").

10.4. Mejoras en el Dashboard

Mostrar un pequeño indicador de progreso de gastos por categoría (barras horizontales con color verde) debajo del resumen.

Si el usuario es Premium, mostrar la meta de ahorro más cercana con barra circular, los límites de categoría y la próxima suscripción.

Si no es Premium, mostrar esos módulos bloqueados con el botón de upgrade.

10.5. Revisión de tipografía y espaciado

Usar Inter o Poppins con pesos 400, 500, 600, 700.

Aumentar el espaciado entre secciones para dar respiración.

Tamaños de fuente consistentes: títulos grandes (24px), subtítulos (18px), cuerpo (14px), detalles (12px).

10.6. Testing de la nueva UI

Probar en diferentes tamaños de pantalla (móvil, tablet, escritorio).

Verificar que el contraste sea adecuado (WCAG AA).

Asegurar que las animaciones no afecten el rendimiento (usar will-change y transform para hardware acceleration).

📦 FASE 11: SEGURIDAD DE PREMIUM Y PAGOS REALES (NUEVA — LA MÁS COMPLEJA)
Objetivo: Cerrar el hueco de seguridad heredado del mock de la Fase 9 (el propio cliente marca `is_premium = TRUE` en Supabase, así que cualquiera puede activarlo gratis desde las herramientas de desarrollador) y, sobre esa base ya segura, conectar por fin un cobro real — resolviendo primero la decisión pendiente sobre qué pasarela usar dado que Stripe no opera cuentas de comerciante en Chile de forma directa.

11.1. Bloquear la escritura directa de `is_premium` desde el cliente

Crear una política RLS adicional (o una función `SECURITY DEFINER`) que impida que un `UPDATE` desde el cliente autenticado modifique las columnas `is_premium`, `premium_since`, `stripe_customer_id`, `stripe_subscription_id`. Solo el `service_role` (usado por las Edge Functions) puede tocarlas.

11.2. Mover la activación del mock a una Edge Function

Nueva función `activate-premium-mock` en `supabase/functions/`: recibe el `user_id` de la sesión (via JWT), valida que sea el mismo que hace la llamada, y ahí sí ejecuta el `UPDATE` con `service_role`. `Onboarding.tsx`, `Premium.tsx` y `MockPaymentModal.tsx` dejan de llamar a `supabase.from('profiles').update(...)` directamente y llaman a esta función. Mismo criterio para "Cancelar suscripción" en `/settings`.

11.3. Auditoría de RLS del resto de tablas

Revisar `transactions`, `subscriptions`, `savings_goals` y `category_limits`: confirmar que ningún campo sensible (ej. montos ya cobrados por una suscripción automática) pueda ser alterado libremente por el usuario de forma que rompa la integridad de sus propios datos históricos.

11.4. Decisión de pasarela de pago real

Evaluar entre: (a) constituir una LLC en EE.UU. (Stripe Atlas u otro agente) para usar Stripe, o (b) integrar Mercado Pago, que sí opera nativo en Chile. Documentar la decisión y el motivo en el README.

11.5. Implementación de la pasarela elegida

Si es Mercado Pago: replicar el mismo patrón ya usado para Stripe (capa de pagos abstraída en `src/lib/payments.ts`, Edge Function que crea la preferencia de pago, Edge Function/endpoint que recibe el webhook de notificación). Si es Stripe: seguir la guía ya documentada en el README ("Activar pagos reales con Stripe").

11.6. Despliegue, prueba y retiro del mock

Desplegar las Edge Functions correspondientes y probar el flujo completo en modo sandbox/test (incluyendo renovación mensual y cancelación) antes de pasar a producción. Una vez verificado, `MockPaymentModal` queda solo como fallback de desarrollo (ej. detrás de `VITE_PAYMENT_PROVIDER=mock`), nunca visible en producción.

11.7. Criterio de entrega

Verificar manualmente (con la consola del navegador logueado como usuario gratuito) que `supabase.from('profiles').update({ is_premium: true })` ya NO funciona y devuelve un error de política RLS. Verificar además un ciclo completo de cobro real en modo test: alta, primer pago, renovación simulada y cancelación.

📦 FASE 12: TESTING, ROBUSTEZ DE DATOS Y MODO OFFLINE (NUEVA)
Objetivo: Cubrir con pruebas automatizadas la lógica que maneja dinero real de los usuarios (hoy sin ningún test) y hacer que la app sea utilizable en modo lectura sin conexión, usando IndexedDB solo como caché — tal como ya permite `claude.md` en su sección de reglas.

12.1. Configuración de testing

Instalar Vitest + Testing Library. Configurar scripts `npm run test` y `npm run test:watch`.

12.2. Prioridad de cobertura (de más a menos crítico)

- `useDashboardData`: cálculo de balance, ingresos, gastos y desglose por categoría.
- `useSubscriptionRunner` / `shouldChargeToday` (`lib/premium.ts`): la lógica de "clamping" de días de cobro (ej. día 31 en febrero) es fácil de romper y afecta dinero real.
- `useDeleteCategory`: que la reasignación a "Otros" de las transacciones huérfanas funcione siempre.
- `getLimitStatus` (`lib/premium.ts`): los umbrales de 80%/100% para las alertas de límite.

12.3. Tests de integración ligeros

Con un cliente de Supabase mockeado (o una base de datos de test), cubrir al menos el flujo de agregar transacción → se refleja en el Dashboard, y alta/baja de categoría personalizada.

12.4. CI

Configurar que `npm run test` y `npm run lint` corran automáticamente en cada push (GitHub Actions u otro), para no depender de correrlos manualmente antes de cada entrega.

12.5. Caché de solo lectura para modo offline

Persistir en IndexedDB (o `localStorage` si el volumen de datos es bajo) la última respuesta exitosa de `useDashboardData`, `useTransactionsList` y `useStatsData`, para poder mostrarla si la app abre sin red. Mostrar un banner sutil ("Sin conexión — mostrando datos guardados") cuando se estén usando datos de caché.

12.6. Cola de escritura diferida (opcional, evaluar necesidad real)

Si se decide permitir agregar transacciones sin conexión, encolarlas localmente y sincronizarlas con Supabase al recuperar la red, con manejo de conflictos simple (last-write-wins es suficiente para este caso de uso).

12.7. Criterio de entrega

`npm run test` pasa en verde cubriendo los puntos de 12.2. Probar en el navegador con la pestaña de red en modo "Offline": el Dashboard debe seguir mostrando el último balance conocido en vez de una pantalla en blanco o un error.

📦 FASE 13: NOTIFICACIONES Y CRUD COMPLETO DE TRANSACCIONES (NUEVA)
Objetivo: Avisar al usuario antes de que ocurran los eventos financieros relevantes (no solo mostrarlos cuando abre la app) y completar el CRUD de transacciones, que hoy solo permite Crear y Eliminar.

13.1. Notificaciones push (Web Push API + Service Worker)

Configurar el permiso de notificaciones y el registro de push en el service worker ya existente (`vite-plugin-pwa`). Requiere una función backend (Edge Function con cron, o Supabase Cron) que revise diariamente qué usuarios necesitan un aviso.

13.2. Casos a notificar

- Una suscripción se cobrará en los próximos 2-3 días.
- Una categoría con límite asignado llega al 80% de su tope.
- Una meta de ahorro está cerca de su fecha límite y del monto objetivo.

13.3. Preferencias de notificación

Sección nueva en `/settings` para activar/desactivar cada tipo de notificación por separado.

13.4. Editar una transacción

Desde `/transactions`, al tocar una fila (no el swipe de eliminar) se abre `/add-transaction` en modo edición, precargada con los datos existentes. Al guardar, hace `UPDATE` en vez de `INSERT` e invalida las mismas queries que la creación.

13.5. Búsqueda y filtro por fecha

Campo de búsqueda en `/transactions` que filtra por descripción y categoría (client-side sobre lo ya cargado, o vía `.ilike()` de Supabase para buscar en todo el historial). Adicional a los tabs por categoría: selector de rango de fechas (ej. "Últimos 7 días", "Este mes", "Personalizado").

13.6. Criterio de entrega

Probar que las notificaciones lleguen incluso con la app cerrada, tanto en Android (vía TWA) como en navegador de escritorio. Confirmar que editar una transacción actualiza correctamente Dashboard, Estadísticas y el propio listado sin recargar la página.

📦 FASE 14: EXPORTACIÓN, VISTA HISTÓRICA Y PULIDO FINAL (NUEVA — LA MÁS SENCILLA)
Objetivo: Cerrar los pendientes de menor esfuerzo — sacar los datos de la app, dar contexto histórico en el Dashboard, y los detalles cosméticos y de verificación que quedaron abiertos al terminar la Fase 10.

14.1. Exportar a CSV

Botón en `/transactions` o `/settings` que genera un CSV con todas las transacciones del usuario (o de un rango de fechas elegido) y dispara la descarga en el navegador.

14.2. Exportar a PDF (opcional, evaluar demanda real)

Reporte simple en PDF con el resumen mensual (balance, ingresos, gastos, desglose por categoría) para un mes o rango elegido, generado en el cliente sin necesitar backend adicional.

14.3. Selector de mes en el Dashboard

Reutilizar `MonthSelector` (ya existe para `/stats`) en el Dashboard, para que el balance, ingresos, gastos y últimos movimientos correspondan al mes elegido, no siempre al actual.

14.4. Comparación simple con el mes anterior

Mostrar junto al balance un indicador pequeño ("+12% vs. mes anterior") para dar contexto inmediato sin tener que hacer el cálculo mental.

14.5. Auditoría de contraste WCAG AA

Correr Lighthouse o axe DevTools sobre el despliegue real y corregir cualquier combinación de texto/fondo que no pase el estándar AA, especialmente sobre el degradado de la tarjeta de Balance.

14.6. Testing en dispositivos reales

Probar la app en al menos un teléfono Android de gama baja, un iPhone (Safari) y una pantalla de escritorio ancha, verificando que el layout `max-w-md` centrado se vea intencional en pantallas grandes.

14.7. Aplicar `.section-glow-bg`

La clase ya existe en `src/index.css` desde la Fase 10 pero no se aplicó a ninguna sección todavía; usarla detrás de al menos una sección del Dashboard para el efecto de profundidad que describe `claude.md` en el punto 4 ("Fondo de secciones").

CHECKLIST DE FASES (MODIFICAR AQUÍ AL FINALIZAR CADA UNA)

Fase 0: [x] Cimentación y Supabase
Fase 1: [x] Autenticación y Onboarding (con Premium upsell)
Fase 2: [x] Dashboard principal
Fase 3: [x] Agregar transacciones
Fase 4: [x] Lista y filtros
Fase 5: [x] Estadísticas y gráficos
Fase 6: [x] Funcionalidades Premium (metas, límites, suscripciones) - Integradas en Dashboard
Fase 7: [x] Pulido y generación de APK
Fase 8: [x] Perfil, Configuración y Gestión de Categorías
Fase 9: [x] Integración de Pagos para Premium (PENDIENTE: reemplazar el mock por Stripe real cuando haya cuenta/credenciales — Chile no está en los países soportados por Stripe para abrir cuenta, requiere LLC en EE.UU., ver README — Edge Functions ya escritas en supabase/functions/)
Fase 10: [x] Refresh Visual y Pulido (degradados verdes, glassmorphism, animaciones) - Paleta exacta del spec aplicada (#00d4aa/#059669/#065f46), glow pulsante + shimmer en la tarjeta de Balance, fondo radial sutil, botones y FAB con gradiente + glow/latido, glassmorphism en listas de transacciones y estadísticas, fecha con formato "12 Abr 2026". (PENDIENTE: testing manual en tablet/escritorio real y auditoría de contraste WCAG AA con una herramienta dedicada — ver README)

Fase 11: [x] Seguridad de Premium y Pagos Reales — bloqueo de is_premium desde el cliente hecho (trigger `protect_premium_columns` en schema.sql + Edge Functions `activate-premium-mock`/`cancel-premium-mock` con service_role, ver README) (PENDIENTE: 11.4-11.6 — decisión y conexión de una pasarela de pago real; misma traba de la Fase 9, Chile no está en los países soportados por Stripe para abrir cuenta)
Fase 12: [x] Testing, Robustez de Datos y Modo Offline — Vitest + Testing Library configurados (`npm run test`/`test:watch`), 36 tests cubriendo `useDashboardData`, `shouldChargeToday`/`getLimitStatus` (`lib/premium.ts`), `useSubscriptionRunner` y `useDeleteCategory` (12.2), más 2 tests de integración ligeros (12.3: alta de transacción → Dashboard, alta/baja de categoría). CI en GitHub Actions corriendo lint + typecheck + test + build en cada push/PR (12.4). Caché de solo lectura en IndexedDB (`src/lib/offlineCache.ts`) para `useDashboardData`, `useStatsData` y la primera página de `useTransactionsList`, con banner "Sin conexión — mostrando datos guardados" en Dashboard/Estadísticas/Movimientos (12.5). (PENDIENTE: 12.6 — se evaluó la cola de escritura offline y se decidió NO implementarla por ahora; ver justificación en README. 12.7 — la prueba automatizada del criterio de entrega vive en `useDashboardData.test.ts`; falta la verificación manual en un navegador real con la pestaña de Red en "Offline")
Fase 13: [ ] Notificaciones y CRUD Completo de Transacciones (push + editar/buscar movimientos) — 13.1-13.3 (notificaciones push, casos a notificar, preferencias) completas, ver README. PENDIENTE: 13.4 (editar transacción) y 13.5 (búsqueda y filtro por fecha) — no forman parte de esta entrega.
Fase 14: [ ] Exportación, Vista Histórica y Pulido Final (CSV/PDF, selector de mes en Dashboard, WCAG AA)

Ejemplo de modificación permitida:
Fase 8: [ ] Perfil, Configuración y Gestión de Categorías (PENDIENTE: definir íconos para selector de categorías)

📌 NOTAS ADICIONALES PARA EL DESARROLLADOR

Categorías personalizadas: La tabla categories usa user_id para asociarlas al usuario. Las default tienen user_id = '00000000-0000-0000-0000-000000000000' para distinguirlas.

Eliminación de categorías: Al eliminar una categoría personalizada, se debe hacer un UPDATE en transactions para cambiar su categoría a 'Otros' (o un fallback configurable).

Pagos: Si se usa Stripe, las Edge Functions de Supabase deben estar configuradas con la clave secreta de Stripe. Las variables de entorno serán VITE_STRIPE_PUBLISHABLE_KEY y SUPABASE_EDGE_FUNCTION_URL.

Visual: La paleta de colores verde es el corazón de la identidad visual. Mantener consistencia en todos los componentes.

Rendimiento: Usar React.memo en componentes que se renderizan frecuentemente (lista de transacciones) y useCallback para funciones.

Visibilidad Premium: Los módulos Premium deben estar siempre presentes en el Dashboard (no ocultos), mostrando su estado (bloqueado/desbloqueado) para incentivar la conversión.

¡Manos a la obra con las Fases 8, 9 y 10, integrando Premium de forma visible en el Dashboard! 🚀