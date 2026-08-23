/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-empty-function */
import { contextBridge, ipcRenderer } from 'electron'



// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.

contextBridge.exposeInMainWorld('mainApi', {
  onMapLoad: (callback: (data:any)=>void) => {
    ipcRenderer.on("mapa-cargado", (_event, data)=> callback(data));
  },
  getFame: () => ipcRenderer.invoke("get-fame"),
  getDamageAndDPS: (name:string) => ipcRenderer.invoke("get-damage", name),
  onPlayerAdded: (callback: (data:any)=>void) => {
    ipcRenderer.on("player-added", (_event, data)=> callback(data));
  },
  onPlayerRemoved: (callback: (data:any)=>void) => {
    ipcRenderer.on("player-removed", (_event, data)=> callback(data));
  },
  onLocalPlayerLeave: (callback: (data:any)=>void) => {
    ipcRenderer.on("localplayer-leave", (_event, data)=> callback(data));
  },
  getPlayers: () => ipcRenderer.invoke("get-players"),
  getLocalPlayer: () => ipcRenderer.invoke("get-localplayer"),
  sendReset: () => ipcRenderer.send("reset"),
  sendPause: () => ipcRenderer.send("pause"),
  sendUnpause: () => ipcRenderer.send("unpause"),
  onGetVersion: (callback: (data:any)=>void)=>{
    ipcRenderer.on("version", (_event, data)=>callback(data));
  },
  sendBossMode: (active: boolean) => ipcRenderer.send('boss-mode', active)
});
