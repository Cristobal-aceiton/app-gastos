export interface NotificationPrefs {
  user_id: string
  /** Avisar 2-3 días antes de que se cobre una suscripción automática. */
  subscriptions_reminder: boolean
  /** Avisar cuando una categoría con límite llega al 80% de su tope. */
  category_limit_alert: boolean
  /** Avisar cuando una meta de ahorro está cerca de su fecha límite y monto. */
  savings_goal_reminder: boolean
  updated_at: string
}

/** Valores por defecto (todo activado) para un usuario que nunca guardó preferencias. */
export const DEFAULT_NOTIFICATION_PREFS: Pick<
  NotificationPrefs,
  'subscriptions_reminder' | 'category_limit_alert' | 'savings_goal_reminder'
> = {
  subscriptions_reminder: true,
  category_limit_alert: true,
  savings_goal_reminder: true,
}
