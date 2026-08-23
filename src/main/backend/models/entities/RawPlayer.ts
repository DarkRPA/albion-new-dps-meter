/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { Clonable } from "../Clonable";
import { Inventory } from "../inventory/Inventory";
import { Entity } from "./Entity";
import { Guid } from "./Guid";

export class RawPlayer extends Entity implements Clonable<RawPlayer>{
    protected name:string = "";
    protected guid:Guid = Guid.PLACEHOLDER_GUID;
    public inventory:Inventory = new Inventory();

    constructor(worldId:number = -1, map:string = "", name:string, guid:Guid){
        super(worldId, map);
        this.name = name;
        this.guid = guid;
    }
  clone(): RawPlayer {
    const p = new RawPlayer(this.worldId, this.map, this.name, this.guid);

    p.inventory = this.inventory.clone();

    return p;
  }

    getName(){
        return this.name;
    }

    getGuid(){
        return this.guid;
    }

    setGuid(guid:Guid){
        this.guid = guid;
    }
}
