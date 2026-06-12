import { Guid } from "../models/entities/Guid";
import { Player } from "../models/entities/Player";
import { ENTITY_CONTROLLER } from "./NetworkListener";

export class PartyController{
    isInParty:boolean = false;
    membersInParty:Array<Player> = [];

    public isPlayerInParty(guid:Guid):boolean{
        for(let i = 0; i < this.membersInParty.length; i++){
            if(this.membersInParty[i].getGuid().equal(guid)){
                return true;
            }
        }
        return false;
    }

    public getPlayerFromGuid(guid:Guid):Player|undefined{
        if(ENTITY_CONTROLLER.localPlayer?.getGuid().equal(guid)) return ENTITY_CONTROLLER.localPlayer;
        for(let i = 0; i < this.membersInParty.length; i++){
            if(this.membersInParty[i].getGuid().equal(guid)){
                return this.membersInParty[i];
            }
        }
        return undefined;
    }

    public localPlayerLeftParty(){
        this.isInParty = false;
        this.membersInParty = [];
    }

    public addPlayerToParty(player:Player){
        if(this.isPlayerInParty(player.getGuid())){
            return;
        }

        this.membersInParty.push(player);
    }

    public removePlayerFromParty(player:Player){
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
        if(ENTITY_CONTROLLER.localPlayer?.getWorldId() == id) return [ENTITY_CONTROLLER.localPlayer];
        return this.membersInParty.filter((s) => s.getWorldId() == id);
    }

    public getPartyMemberFromName(name:string):Array<Player>{
        if(ENTITY_CONTROLLER.localPlayer?.getName() == name) return [ENTITY_CONTROLLER.localPlayer];
        return this.membersInParty.filter((s) => s.getName() == name);
    }

    public restartDamage(){
        ENTITY_CONTROLLER.localPlayer?.restartDmg();
        for(let i = 0; i < this.membersInParty.length; i++){
            this.membersInParty[i].restartDmg();
        }
    }
}