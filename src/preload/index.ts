/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-empty-function */
import { contextBridge, ipcRenderer, type IpcRendererEvent } from "electron";
import type {
  CombatDataChanged,
  GroupTotals,
//  PlayerAbilities,
//  PlayerDeaths,
  PlayerDpsHistory,
  TimeRange,
  Unsubscribe,
} from "./combat.types";
import { Spell } from "../main/backend/models/damage/Spell";

function subscribe<T>(
  channel: string,
  callback: (data: T) => void,
): Unsubscribe {
  const listener = (_event: IpcRendererEvent, data: T): void => callback(data);
  ipcRenderer.on(channel, listener);
  return () => {
    ipcRenderer.removeListener(channel, listener);
  };
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.

export const mainApi = {
  onMapLoad: (callback: (data: any) => void): Unsubscribe =>
    subscribe("mapa-cargado", callback),
  getFame: () => ipcRenderer.invoke("get-fame"),
  getCrediFame: () => ipcRenderer.invoke("get-credi-fame"),
  getFamePerHour: () => ipcRenderer.invoke("get-fame-per-hour"),
  getDamageAndDPS: (name: string) => ipcRenderer.invoke("get-damage", name),
  onPlayerAdded: (callback: (data: any) => void): Unsubscribe =>
    subscribe("player-added", callback),
  onPlayerRemoved: (callback: (data: any) => void): Unsubscribe =>
    subscribe("player-removed", callback),
  onLocalPlayerLeave: (callback: (data: any) => void): Unsubscribe =>
    subscribe("localplayer-leave", callback),
  getPlayers: () => ipcRenderer.invoke("get-players"),
  getLocalPlayer: () => ipcRenderer.invoke("get-localplayer"),
  getProgramTiming: () => ipcRenderer.invoke("get-program-timing"),
  isPaused: () => ipcRenderer.invoke("is-paused"),
  sendReset: () => ipcRenderer.send("reset"),
  sendPause: () => ipcRenderer.send("pause"),
  sendUnpause: () => ipcRenderer.send("unpause"),
  onGetVersion: (callback: (data: any) => void): Unsubscribe =>
    subscribe("version", callback),
  sendBossMode: (active: boolean) => ipcRenderer.send("boss-mode", active),

  // Estado: al iniciar o cambiar controles, no al dibujar.
  isMapLoaded: (): Promise<boolean> => ipcRenderer.invoke("is-map-loaded"),
  isBossMode: (): Promise<boolean> => ipcRenderer.invoke("is-boss-mode"),

  // Solo mientras el resumen del grupo está visible.
  getGroupTotals: (): Promise<GroupTotals | null> =>
    ipcRenderer.invoke("get-group-totals"),

  // Solo para el jugador seleccionado en Vista avanzada.
  getPlayerDeaths: (name: string): Promise<any | null> =>
    ipcRenderer.invoke("get-player-deaths", name),
  getPlayerDpsHistory: (
    name: string,
    cursor?: string,
  ): Promise<PlayerDpsHistory | null> =>
    ipcRenderer.invoke("get-player-dps-history", name, cursor),
  getPlayerAbilities: (
    name: string,
    range?: TimeRange,
  ): Promise<Spell | null> =>
    ipcRenderer.invoke("get-player-abilities", name, range),

  // Aviso de QUÉ ha cambiado, sin enviar el contenido del recurso.
  onCombatDataChanged: (
    callback: (data: CombatDataChanged) => void,
  ): Unsubscribe => subscribe("combat-data-changed", callback),
};

contextBridge.exposeInMainWorld("mainApi", mainApi);
