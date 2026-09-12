/** Propuesta pendiente de revisión; todos los valores los calcula main. */
export type Unsubscribe = () => void;
export interface TimeRange {
  /** Incluido, en el reloj de sesión del back-end. */
  fromMs: number;
  /** Excluido, en el mismo reloj. */
  toMs: number;
}
export interface GroupTotals {
  damage: number;
  healing: number;
}
export interface PlayerDeaths {
  count: number;
  events: Array<{ id: string; elapsedMs: number }>;
}
export interface PlayerAbility {
  id: string;
  name: string;
  iconPng: string | null;
  /** null si main no puede identificar los lanzamientos. */
  uses: number | null;
  hits: number;
  damageTotal: number;
  /** Calculada por main; null si no hubo impactos. */
  averageDamagePerHit: number | null;
}
export interface PlayerAbilities {
  /** null para toda la sesión; intervalo concreto para una selección. */
  range: TimeRange | null;
  damageTotal: number;
  averageDpsAtEnd: number;
  abilities: PlayerAbility[];
}
export interface PlayerDpsHistory {
  /** Cursor opaco controlado por main. */
  cursor: string;
  /** true reemplaza la gráfica; false añade puntos e intervalos nuevos. */
  replace: boolean;
  points: Array<{ elapsedMs: number; averageDps: number }>;
  intervals: Array<TimeRange & { id: string }>;
}
export type CombatDataArea =
  | "time"
  | "fame"
  | "creditFame"
  | "players"
  | "damage"
  | "totals"
  | "deaths"
  | "abilities"
  | "history"
  | "controls";
/** Aviso de invalidación: no incluye estadísticas ni jugadores completos. */
export interface CombatDataChanged {
  areas: CombatDataArea[];
  /** Ausente = todos los jugadores afectados. */
  playerNames?: string[];
  /** Permite no volver a pedir intervalos históricos ajenos a este cambio. */
  changedRange?: TimeRange;
  /** Reinicio o cambio de conjunto normal/Boss confirmado por main. */
  reset?: boolean;
}
