import { ItemEntity } from "../entities/ItemEntity";
import { Equipment } from "./Equipment";
import { Item } from "./Item";

export class Inventory{
    private inventory:Array<Item> = [];
    private equipment:Equipment = new Equipment();

    updateInventory(inventory:Array<number>){
        for(let i = 0; i < inventory.length; i++){
            let itemActual = inventory[i];
            this.inventory.push(Item.getItem(itemActual));
        }
    }

    setEquipment(equipment:Equipment){
        this.equipment = equipment;
    }

    updateEquipment(equipment:Array<number>){
        this.equipment.loadEquipment(equipment);
    }

    getEquipment():Equipment{
        return this.equipment;
    }

    static convertWorldIDInventoryToInventory(inventory:Array<ItemEntity>){
        let result:Array<number> = [];
        for(let i = 0; i < inventory.length; i++){
            result.push(inventory[i].itemId);
        }
        return result;
    }
}