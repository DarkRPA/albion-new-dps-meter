/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable prettier/prettier */

import { BrowserWindow, ipcMain } from "electron";
import path from "path";
import { ENTITY_CONTROLLER, PARTY_CONTROLLER, reloadEverything, SNAPSHOT_CONTROLLER, STATISTIC_CONTROLLER } from "../controllers/MainController";
import { Player } from "../models/entities/Player";
import { version } from "../../../../package.json";
import { ProgramTime } from "../models/ProgramTime";

export class ViewController{
    private baseWindow:BrowserWindow;

    static instance:ViewController;

    static getInstance(){
      if(!ViewController.instance){
          ViewController.instance = new ViewController();
      }
      return ViewController.instance;
    }

    private constructor(){
        if(!ViewController.instance) ViewController.instance = this;
        this.baseWindow = new BrowserWindow({width: 800, height: 600, webPreferences: {
          contextIsolation: true,
          preload: path.join(__dirname, "../preload/index.js")
        }});
        this.baseWindow.setIcon(path.join(__dirname, "../../resources/icon.png"));
        //this.baseWindow.setMenu(null);
        this.baseWindow.on("ready-to-show", ()=>{
          this.baseWindow.show();
          this.baseWindow.title = `Albion New Dps Meter - V${version}`;
        });
        this.baseWindow.loadFile(path.join(__dirname, "../renderer/index.html"));

        this.initalizeEvents();
    }

    sendMapChanged(){
      this.baseWindow.webContents.send("mapa-cargado", {"data": true});
    }

    sendPlayerAdded(player:Player){
      this.baseWindow.webContents.send("player-added", player.getName());
    }

    sendPlayerRemoved(player:Player){
      this.baseWindow.webContents.send("player-removed", player.getName());
    }

    sendLocalPlayerLeft(){
      this.baseWindow.webContents.send("localplayer-leave", true);
    }

    initalizeEvents(){
      ipcMain.handle("get-fame", ()=>{
        return STATISTIC_CONTROLLER.totalFame;
      });

      ipcMain.handle("get-fame-per-hour", ()=>{
        return STATISTIC_CONTROLLER.totalFame / ProgramTime.getInstance().elapsedTime();
      });

      ipcMain.handle("get-credi-fame", ()=>{
        return STATISTIC_CONTROLLER.totalCrediFame;
      });

      ipcMain.handle("get-damage", (_event, name:string)=>{
        let partyPlayer:Array<Player> = PARTY_CONTROLLER.getPartyMemberFromName(name);
        if(partyPlayer.length <= 0) return undefined;
        const player:Player|undefined = partyPlayer[0];

        let result:any = {
          damage: player.getTotalDamage(),
          healing: player.getTotalHealing(),
          hps: Number.isNaN(player.getTotalHPS())?0:player.getTotalHPS(),
          dps: Number.isNaN(player.getTotalDPS())?0:player.getTotalDPS(),
          idFound: ENTITY_CONTROLLER.getRawPlayerByName(player.getName())[0] || undefined,
          weaponImage: player.inventory.getEquipment().mainWeapon?.getRenderUrl() || "https://render.albiononline.com/v1/item/T3_MAIN_AXE.png",
        }

        return result;
      });

      ipcMain.handle("get-players", (_event)=>{
        return PARTY_CONTROLLER.membersInParty;
      })

      ipcMain.handle("get-localplayer", (_event)=>{
        return ENTITY_CONTROLLER.localPlayer;
      })

      ipcMain.handle("get-program-timing", (_event)=>{
        return ProgramTime.getInstance().elapsedTime();
      }),

      ipcMain.handle("is-paused", (_event)=>{
        return ProgramTime.getInstance().paused;
      })

      ipcMain.on("pause", ()=>{
        ProgramTime.getInstance().pause();
      });

      ipcMain.on("unpause", ()=>{
        ProgramTime.getInstance().unpause();
      });

      ipcMain.on("reset", ()=>{
        reloadEverything();
      })

      ipcMain.on("boss-mode", (_state, data)=>{
        if(data){
          SNAPSHOT_CONTROLLER.makeNormalSnapshotShallowCopy();
        }else{
          SNAPSHOT_CONTROLLER.makeBossSnapshotShallowCopy();
        }
      })
    }
}
