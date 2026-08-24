/* eslint-disable prefer-const */
import { Clonable } from "../Clonable";
import { Entity } from "./Entity";

/**
 * Clase ItemEntity, representa una entidad de tipo Item pues los Items también tienen ID's globales.
 */
export class ItemEntity extends Entity implements Clonable<ItemEntity>{
    /**
     * El id del item
     */
    itemId:number = 0;

    constructor(worldId:number = 0, map:string = "", itemId:number){
        super(worldId, map);
        this.itemId = itemId;
    }
    
  clone(): ItemEntity {
    let p = new ItemEntity(this.worldId, this.map, this.itemId);
    p.itemId = this.itemId;

    return p;
  }
}
