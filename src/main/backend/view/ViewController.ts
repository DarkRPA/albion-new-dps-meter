/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable prettier/prettier */

import { BrowserWindow, ipcMain } from "electron";
import path from "path";
import { findByName, NetworkListerner, reloadEverything } from "../controllers/NetworkListener";
import { Player } from "../models/Player";

export class ViewController{
    private baseWindow:BrowserWindow;

    static instance:ViewController;

    constructor(){
        if(!ViewController.instance) ViewController.instance = this;
        this.baseWindow = new BrowserWindow({width: 800, height: 600, webPreferences: {
          contextIsolation: true,
          preload: path.join(__dirname, "../preload/index.js")
        }});
        this.baseWindow.setMenu(null);
        this.baseWindow.on("ready-to-show", ()=>{
          this.baseWindow.show();
        });
        this.baseWindow.loadFile(path.join(__dirname, "../renderer/index.html"));

        this.initalizeEvents();
    }

    sendMapChanged(){
      this.baseWindow.webContents.send("mapa-cargado", {"data": true});
    }

    sendPlayerAdded(player:Player){
      this.baseWindow.webContents.send("player-added", player.name);
    }

    sendPlayerRemoved(player:Player){
      this.baseWindow.webContents.send("player-removed", player.name);
    }

    sendLocalPlayerLeft(){
      this.baseWindow.webContents.send("localplayer-leave", true);
    }

    initalizeEvents(){
      ipcMain.handle("get-fame", ()=>{
        return NetworkListerner.totalFame;
      });

      ipcMain.handle("get-damage", (_event, name:string)=>{
        const player:Player|undefined = findByName(name);
        if(!player) return undefined;

        let result:any = {
          damage: player.getTotalDamage(),
          dps: Number.isNaN(player.getTotalDPS())?0:player.getTotalDPS()
        }

        return result;
      });

      ipcMain.handle("get-players", (_event)=>{
        return NetworkListerner.playerList;
      })

      ipcMain.on("pause", ()=>{
        NetworkListerner.paused = true;
      });

      ipcMain.on("unpause", ()=>{
        NetworkListerner.paused = false;
      });

      ipcMain.on("reset", ()=>{
        reloadEverything();
      })
    }
}
