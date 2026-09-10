import {
  Utensils,
  Car,
  ShoppingBag,
  HeartPulse,
  Clapperboard,
  Wrench,
  Banknote,
  MoreHorizontal,
  Music,
  Plane,
  Gift,
  Home,
  Dumbbell,
  Coffee,
  Gamepad2,
  Baby,
  Dog,
  Wallet,
  Smartphone,
  Palette,
  Scissors,
  Stethoscope,
  GraduationCap,
  PiggyBank,
  Briefcase,
  Tag,
  type LucideIcon,
} from 'lucide-react'
import { useCategoryStore } from '../store/categoryStore'

export interface CategoryDef {
  id: string
  label: string
  icon: LucideIcon
  color: string
  isDefault: boolean
}

// El campo `category` de `transactions` guarda el `id` (slug para las default,
// uuid de la fila en Supabase para las personalizadas), no el label.
export const CATEGORIES: CategoryDef[] = [
  { id: 'comida', label: 'Comida', icon: Utensils, color: '#F2A65A', isDefault: true },
  { id: 'transporte', label: 'Transporte', icon: Car, color: '#5AA9E6', isDefault: true },
  { id: 'compras', label: 'Compras', icon: ShoppingBag, color: '#C792EA', isDefault: true },
  { id: 'salud', label: 'Salud', icon: HeartPulse, color: '#F2665F', isDefault: true },
  { id: 'entretenimiento', label: 'Entretenimiento', icon: Clapperboard, color: '#F2C94C', isDefault: true },
  { id: 'servicios', label: 'Servicios', icon: Wrench, color: '#6FCF97', isDefault: true },
  { id: 'sueldo', label: 'Sueldo', icon: Banknote, color: '#35D68C', isDefault: true },
  { id: 'otros', label: 'Otros', icon: MoreHorizontal, color: '#93A89D', isDefault: true },
]

/** Íconos elegibles para categorías personalizadas (Fase 8). La clave es la que se guarda en `categories.icon`. */
export const CUSTOM_ICON_LIBRARY: Record<string, LucideIcon> = {
  music: Music,
  plane: Plane,
  gift: Gift,
  home: Home,
  dumbbell: Dumbbell,
  coffee: Coffee,
  gamepad: Gamepad2,
  baby: Baby,
  dog: Dog,
  wallet: Wallet,
  phone: Smartphone,
  palette: Palette,
  scissors: Scissors,
  health: Stethoscope,
  education: GraduationCap,
  savings: PiggyBank,
  work: Briefcase,
  tag: Tag,
}

const CUSTOM_COLOR_PALETTE = [
  '#5AA9E6',
  '#C792EA',
  '#F2A65A',
  '#F2665F',
  '#6FCF97',
  '#F2C94C',
  '#EF9AC4',
  '#7FD1D9',
]

function hashString(value: string): number {
  let hash = 0
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0
  }
  return hash
}

/** Color determinístico (mismo id → mismo color siempre) para categorías personalizadas. */
export function colorForCustomCategory(id: string): string {
  return CUSTOM_COLOR_PALETTE[hashString(id) % CUSTOM_COLOR_PALETTE.length]
}

export function getIconComponent(iconName: string | null | undefined): LucideIcon {
  if (!iconName) return Tag
  return CUSTOM_ICON_LIBRARY[iconName] ?? Tag
}

/**
 * Busca una categoría por id, primero entre las default (hardcodeadas) y
 * luego entre las personalizadas del usuario actual (cacheadas en
 * categoryStore por useCategories). Si no se encuentra (ej. la categoría
 * personalizada fue eliminada), cae de vuelta a "Otros" para no romper la UI.
 */
export function getCategory(id: string): CategoryDef {
  const builtIn = CATEGORIES.find((c) => c.id === id)
  if (builtIn) return builtIn

  const custom = useCategoryStore.getState().customCategories.find((c) => c.id === id)
  if (custom) return custom

  return CATEGORIES[CATEGORIES.length - 1]
}
