import { Entity } from "./Entity";

export class ItemEntity extends Entity{
    itemId:number = 0;

    constructor(worldId:number = 0, map:string = "", itemId:number){
        super(worldId, map);
        this.itemId = itemId;
    }
}