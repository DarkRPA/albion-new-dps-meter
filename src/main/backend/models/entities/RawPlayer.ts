import { Inventory } from "../inventory/Inventory";
import { Entity } from "./Entity";
import { Guid } from "./Guid";

export class RawPlayer extends Entity{
    protected name:string = "";
    protected guid:Guid = Guid.PLACEHOLDER_GUID;
    public inventory:Inventory = new Inventory();

    constructor(worldId:number = -1, map:string = "", name:string, guid:Guid){
        super(worldId, map);
        this.name = name;
        this.guid = guid;
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