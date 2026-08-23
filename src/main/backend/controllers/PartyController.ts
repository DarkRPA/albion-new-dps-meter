/* eslint-disable prefer-const */
import { Clonable } from "../models/Clonable";
import { Guid } from "../models/entities/Guid";
import { Player } from "../models/entities/Player";
import { RawPlayer } from "../models/entities/RawPlayer";
import { ENTITY_CONTROLLER } from "./MainController";

export class PartyController implements Clonable<PartyController>{

    isInParty:boolean = false;
    membersInParty:Array<Player> = [];

  clone(): PartyController {
      let p = new PartyController();
      p.isInParty = this.isInParty;
      for(let i in this.membersInParty){
        p.membersInParty.push(this.membersInParty[i].clone());
      }

      return p;
    }

    public isPlayerInParty(guid:Guid):boolean{
        for(let i = 0; i < this.membersInParty.length; i++){
            if(this.membersInParty[i].getGuid().equal(guid)){
                return true;
            }
        }
        return false;
    }

    public updatePlayerFromRawData(rawPlayer:RawPlayer):void{
        const playerInParty:Array<Player> = this.getPartyMemberFromName(rawPlayer.getName());
        if(playerInParty.length == 0) return;
        const player:Player = playerInParty[0];

        player.setWorldMap(rawPlayer.getWorldMap());
        player.setWorldId(rawPlayer.getWorldId());
        player.inventory.setEquipment(rawPlayer.inventory.getEquipment());
    }

    public getPlayerFromGuid(guid:Guid):Player|undefined{
        if(ENTITY_CONTROLLER.localPlayer)
            if(ENTITY_CONTROLLER.localPlayer.getGuid().equal(guid)) return ENTITY_CONTROLLER.localPlayer;
        for(let i = 0; i < this.membersInParty.length; i++){
            if(this.membersInParty[i].getGuid().equal(guid)){
                return this.membersInParty[i];
            }
        }
        return undefined;
    }

    public localPlayerLeftParty():void{
        this.isInParty = false;
        this.membersInParty = [];
    }

    public addPlayerToParty(player:Player):void{
        if(this.isPlayerInParty(player.getGuid())){
            return;
        }

        this.membersInParty.push(player);
    }

    public removePlayerFromParty(player:Player):boolean{
        if(!this.isPlayerInParty(player.getGuid())) return true;

        for(let i = 0; i < this.membersInParty.length; i++){
            if(this.membersInParty[i].getGuid().equal(player.getGuid())){
                this.membersInParty.splice(i, 1);
                return true;
            }
        }

        return false;
    }

    public getPartyMemberfromID(id:number):Array<Player>{
        if(ENTITY_CONTROLLER.localPlayer)
            if(ENTITY_CONTROLLER.localPlayer?.getWorldId() == id) return [ENTITY_CONTROLLER.localPlayer];
        return this.membersInParty.filter((s) => s.getWorldId() == id);
    }

    public getPartyMemberFromName(name:string):Array<Player>{
        if(ENTITY_CONTROLLER.localPlayer)
            if(ENTITY_CONTROLLER.localPlayer?.getName() == name) return [ENTITY_CONTROLLER.localPlayer];
        return this.membersInParty.filter((s) => s.getName() == name);
    }

    public restartDamage():void{
        if(ENTITY_CONTROLLER.localPlayer)
            ENTITY_CONTROLLER.localPlayer?.restartDmg();

        for(let i = 0; i < this.membersInParty.length; i++){
            this.membersInParty[i].restartDmg();
        }
    }

    public forceRecheckPartyInventory():void{
        for(let i = 0; i < this.membersInParty.length; i++){
            const player = this.membersInParty[i];
            if(player.inventory.getEquipment().mainWeapon == undefined){
                const rawPlayer:Array<RawPlayer> = ENTITY_CONTROLLER.getRawPlayerByName(player.getName());
                if(rawPlayer.length == 0) continue;
                player.inventory = rawPlayer[0].inventory;
            }
        }
    }
}
