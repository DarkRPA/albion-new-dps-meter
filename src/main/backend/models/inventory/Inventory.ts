/* eslint-disable prefer-const */
import { Clonable } from "../Clonable";
import { ItemEntity } from "../entities/ItemEntity";
import { Equipment } from "./Equipment";
import { Item } from "./Item";

export class Inventory implements Clonable<Inventory>{

    private inventory:Array<Item> = [];
    private equipment:Equipment = new Equipment();

    updateInventory(inventory:Array<number>):void{
        for(let i = 0; i < inventory.length; i++){
            let itemActual = inventory[i];
            this.inventory.push(Item.getItem(itemActual));
        }
    }

    clone(): Inventory {
      let i = new Inventory();
      for(let x in this.inventory){
        i.inventory.push(this.inventory[x].clone());
      }

      i.equipment = this.equipment.clone();

      return i;
    }

    setEquipment(equipment:Equipment):void{
        this.equipment = equipment;
    }

    updateEquipment(equipment:Array<number>):void{
        this.equipment.loadEquipment(equipment);
    }

    getEquipment():Equipment{
        return this.equipment;
    }

    static convertWorldIDInventoryToInventory(inventory:Array<ItemEntity>):Array<number>{
        let result:Array<number> = [];
        for(let i = 0; i < inventory.length; i++){
            result.push(inventory[i].itemId);
        }
        return result;
    }
}
