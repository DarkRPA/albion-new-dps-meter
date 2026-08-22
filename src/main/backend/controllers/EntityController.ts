/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { Entity } from "../models/entities/Entity";
import { ItemEntity } from "../models/entities/ItemEntity";
import { Player } from "../models/entities/Player";
import { RawPlayer } from "../models/entities/RawPlayer";

/**
 * Clase encargada de gestionar eventos relacionados con entidades
 */
export class EntityController{
    public localPlayer:Player|undefined;
    public playerEntityList:Array<RawPlayer> = [];
    public equipmentEntityList:Array<ItemEntity> = [];

    /**
     * Añade un usuario un relevante al cual vamos a trackear en caso de que entre en la party
     * en un futuro
     * @param player Un usuario no relevante
     */
    // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
    public addRawPlayer(player:RawPlayer){
        this.addEntityToEntityList(this.playerEntityList, player);
    }
    /**
     * Añade la entidad de un item de equipamiento a la lista de items de equipamiento.
     * @param item Un item
     */
    // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
    public addItemEntity(item:ItemEntity){
        this.addEntityToEntityList(this.equipmentEntityList, item);
    }

    /**
     * Mete la entidad a la lista especificada asegurandose de que no haya repetidos
     * @param entityList La lista a la que se va a meter la entidad
     * @param entity La entidad
     */
    private addEntityToEntityList(entityList:Array<Entity>, entity:Entity){
        const findingId:number = this.getPositionFromEntityList(this.playerEntityList, entity.getWorldId());
        if(findingId != -1){
           entityList[findingId] = entity;
        }else{
           entityList.push(entity);
        }
    }

    /**
     * Busca una entidad con el ID especificado en la lista especificada y devuelve su posicion
     * @param entityList La lista de la entidad
     * @param id El id de la entidad
     * @returns La posicion de la entidad en la lista o -1 si no se ha encontrado.
     */
    private getPositionFromEntityList(entityList:Array<Entity>, id:number):number{
        for(let i = 0; i < entityList.length; i++){
            if(entityList[i].isWorldId(id)) return i;
        }

        return -1;
    }

    /**
     * Actualiza el usuario local
     * @param player El usuario local
     */
    public loadLocalPlayer(player:Player){
        this.localPlayer = player;
    }

    /**
     * Dado un ID itera la lista de usuario no relevantes hasta encontrar con el correcto, si no hay ninguno
     * la lista estará vacia
     * @param id El id del usuario no relevante
     * @returns Una lista con todas las coincidencias, puede estar vacia
     */
    public getRawPlayerById(id:number):Array<RawPlayer>{
        return this.playerEntityList.filter((p)=>p.isWorldId(id));
    }
    /**
     * Dado un ID itera la lista de usuario no relevantes hasta encontrar con el correcto, si no hay ninguno
     * la lista estará vacia
     * @param id El id del usuario no relevante
     * @returns Una lista con todas las coincidencias, puede estar vacia
     */
    public getRawPlayerByName(name:string):Array<RawPlayer>{
        return this.playerEntityList.filter((p)=>p.getName() == name);
    }

    public getEquipmentById(id:number):Array<ItemEntity>{
        return this.equipmentEntityList.filter((p)=>p.isWorldId(id));
    }

    public reset(){
        this.playerEntityList = [];
        this.equipmentEntityList = [];
    }
}
