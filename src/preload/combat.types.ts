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
/** Campos propios de Muerte que Electron serializa; no incluye métodos ni getters. */
export interface PlayerDeath {
  /** Milisegundos del reloj de sesión de ProgramTime. */
  timestamp: number;
  causanteId: number;
  causanteNombre: string;
}
export type PlayerDeaths = PlayerDeath[];
export interface PlayerAbility {
  localization: string;
  urlIcon: string | null;
  /** Paquetes de daño registrados por main; no cuenta lanzamientos. */
  ticks: number;
  damage: number;
}
/** Resumen global indexado por el uniqueName de cada habilidad. */
export type PlayerAbilities = Record<string, PlayerAbility>;
export interface PlayerDpsHistory {
  /** Cursor opaco controlado por main. */
  cursor: string;
  /** true reemplaza la gráfica; false añade puntos nuevos. */
  replace: boolean;
  points: Array<{ elapsedMs: number; averageDps: number }>;
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
