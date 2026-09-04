/* eslint-disable prefer-const */
import { Clonable } from "../Clonable";
import { ItemEntity } from "../entities/ItemEntity";
import { Equipment } from "./Equipment";
import { Item } from "./Item";

/**
 * Clase Inventory, representa el inventario de un jugador de Albion Online
 */
export class Inventory implements Clonable<Inventory>{

    //Instanciamos un array de Item que representará nuestro inventario como tal y un objeto de tipo Equipamiento
    //para lo que llevamos equipado
    private inventory:Array<Item> = [];
    private equipment:Equipment = new Equipment();

    /**
     * 
     * @param inventory Un array de numeros, usualmente el que recibimos por parte de Albion Online en la captura de paquetes
     */
    updateInventory(inventory:Array<number>):void{
        for(let i = 0; i < inventory.length; i++){
            let itemActual = inventory[i];
            //TODO: Esta linea de aquí seguramente dará problemas de objetos duplicados en el futuro
            //por que no se está comprobando que el item ya esté en el inventario.
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
