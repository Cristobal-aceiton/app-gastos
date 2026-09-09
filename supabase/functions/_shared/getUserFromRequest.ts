// Fase 11 — helper compartido por las Edge Functions "*-premium-mock".
//
// Regla de seguridad clave: el usuario a activar/cancelar SIEMPRE se saca
// del JWT de la sesión (Authorization: Bearer ...), nunca de un `user_id`
// que venga en el body de la petición. Si se confiara en el body, cualquier
// persona logueada podría activar (o cancelar) Premium de OTRA cuenta con
// solo cambiar ese id — el JWT es lo único que no se puede falsificar desde
// el cliente.
//
// deno-lint-ignore-file no-explicit-any
import { createClient } from 'jsr:@supabase/supabase-js@2'

export async function getUserFromRequest(req: Request) {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return { user: null, error: 'Falta el header Authorization.' }
  }

  const jwt = authHeader.replace(/^Bearer\s+/i, '')

  // Cliente con la anon key + el JWT del usuario: solo sirve para preguntar
  // "¿de quién es este token?", no para leer ni escribir datos.
  const anonClient = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: authHeader } },
  })

  const { data, error } = await anonClient.auth.getUser(jwt)
  if (error || !data?.user) {
    return { user: null, error: 'Token inválido o expirado.' }
  }

  return { user: data.user, error: null }
}
