/* eslint-disable prefer-const */
import { Clonable } from "../models/Clonable";
import { Guid } from "../models/entities/Guid";
import { Player } from "../models/entities/Player";
import { RawPlayer } from "../models/entities/RawPlayer";
import { ENTITY_CONTROLLER } from "./MainController";

/**
 * Controlador encargado de gestionar todo lo relacionado con la party
 */
export class PartyController implements Clonable<PartyController>{

    /**
     * Indica si el usuario local está en una party o no
     */
    isInParty:boolean = false;
    /**
     * Array de miembros de la party
     */
    membersInParty:Array<Player> = [];

    clone(): PartyController {
      let p = new PartyController();
      p.isInParty = this.isInParty;
      for(let i in this.membersInParty){
        p.membersInParty.push(this.membersInParty[i].clone());
      }

      return p;
    }

    /**
     * Comprueba si un player está en la party actualmente
     * @param guid El {@link Guid} del jugador que vamos a buscar en la party
     * @returns true o false dependiendo de si está o no
     */
    public isPlayerInParty(guid:Guid):boolean{
        for(let i = 0; i < this.membersInParty.length; i++){
            if(this.membersInParty[i].getGuid().equal(guid)){
                return true;
            }
        }
        return false;
    }

    /**
     * Actualiza la informacion de un player con el RawPlayer que recibimos por Albion Online, utilizado para actualizar la información
     * del player en la party directamente
     * @param rawPlayer Un objeto RAW de un player
     * @returns 
     */
    public updatePlayerFromRawData(rawPlayer:RawPlayer):void{
        //Comprobamos que el player realmente está en la party
        const playerInParty:Array<Player> = this.getPartyMemberFromName(rawPlayer.getName());
        if(playerInParty.length == 0) return;
        const player:Player = playerInParty[0];

        //Actualizamos sus datos
        player.setWorldMap(rawPlayer.getWorldMap());
        player.setWorldId(rawPlayer.getWorldId());
        player.inventory.setEquipment(rawPlayer.inventory.getEquipment());
    }

    /**
     * Metodo encargado de buscar al player proporcionado en los miembros de la party del jugador local
     * @param guid El {@link Guid} del player
     * @returns Un objeto de tipo {@link Player} si está en la party o undefined si no
     */
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

    /**
     * Método encargado de reiniciar el PartyController en caso de que el jugador local se salga de la party
     */
    public localPlayerLeftParty():void{
        this.isInParty = false;
        this.membersInParty = [];
    }

    /**
     * Añade un jugador a la lista de la party
     * @param player El player a añadir
     * @returns void
     */
    public addPlayerToParty(player:Player):void{
        if(this.isPlayerInParty(player.getGuid())){
            return;
        }

        this.membersInParty.push(player);
    }

    /**
     * 
     * @param player El jugador a eliminar
     * @returns boolean Intenta borrar el jugador de la party, si no está o se borra, devuelve true, si ocurre cualquier otra cosa, false
     */
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

    /**
     * Busca un usuario por su ID global
     * @param id El ID GLOBAL del usuario
     * @returns Un array de longitud 1 con el usuario que tenga ese ID o longitud 0 si no encontró nada
     * @see {@link RawPlayer.worldId} 
     */
    public getPartyMemberfromID(id:number):Array<Player>{
        if(ENTITY_CONTROLLER.localPlayer)
            if(ENTITY_CONTROLLER.localPlayer?.getWorldId() == id) return [ENTITY_CONTROLLER.localPlayer];
        return this.membersInParty.filter((s) => s.getWorldId() == id);
    }

    /**
     * Busca un usuario por su nombre
     * @param name El nombre del usuario
     * @returns Un array de longitud 1 con el usuario que tenga ese nombre o longitud 0 si no encontró nada
     */
    public getPartyMemberFromName(name:string):Array<Player>{
        if(ENTITY_CONTROLLER.localPlayer)
            if(ENTITY_CONTROLLER.localPlayer?.getName() == name) return [ENTITY_CONTROLLER.localPlayer];
        return this.membersInParty.filter((s) => s.getName() == name);
    }

    /**
     * Metodo encargado de reiniciar el daño de todos los miembros de la party
     */
    public restartDamage():void{
        if(ENTITY_CONTROLLER.localPlayer)
            ENTITY_CONTROLLER.localPlayer?.restartDmg();

        for(let i = 0; i < this.membersInParty.length; i++){
            this.membersInParty[i].restartDmg();
        }
    }

    /**
     * Metodo encargada de forzar un recheck de los inventarios de los members de la party pues puede ocurrir que por X o por Y se desfase
     */
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
