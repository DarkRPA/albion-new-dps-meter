/* eslint-disable prefer-const */
import { Clonable } from "../Clonable";
import { Entity } from "./Entity";

export class ItemEntity extends Entity implements Clonable<ItemEntity>{
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
