import { Inventory } from "../inventory/Inventory";
import { Entity } from "./Entity";
import { Guid } from "./Guid";

export class RawPlayer extends Entity{
    protected name:string = "";
    protected guid:Guid = Guid.PLACEHOLDER_GUID;
    protected inventory:Inventory = new Inventory();
}