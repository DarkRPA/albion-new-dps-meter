import { Clonable } from "../Clonable";
import { Item } from "./Item";

/**
 * Clase equipamiento para tener controlados los objetos que tiene cada usuario
 */
export class Equipment implements Clonable<Equipment>{

    mainWeapon:Item | undefined;
    offhand:Item | undefined;
    helmet:Item | undefined;
    chest:Item | undefined;
    shoes:Item | undefined;
    cape:Item | undefined;
    food:Item | undefined;
    potion:Item | undefined;
    backpack:Item | undefined;
    mount:Item | undefined;

    clone(): Equipment {
      const newEquipment:Equipment = new Equipment();

      if(this.mainWeapon){
        newEquipment.mainWeapon = this.mainWeapon.clone();
      }

      if(this.offhand){
        newEquipment.offhand = this.offhand.clone();
      }

      if(this.helmet){
        newEquipment.helmet = this.helmet.clone();
      }

      if(this.chest){
        newEquipment.chest = this.chest.clone();
      }

      if(this.shoes){
        newEquipment.shoes = this.shoes.clone();
      }

      if(this.cape){
        newEquipment.cape = this.cape.clone();
      }

      if(this.food){
        newEquipment.food = this.food.clone();
      }

      if(this.potion){
        newEquipment.potion = this.potion.clone();
      }

      if(this.backpack){
        newEquipment.backpack = this.backpack.clone();
      }

      if(this.mount){
        newEquipment.mount = this.mount.clone();
      }

      return newEquipment;
    }

    loadEquipment(equipment:Array<number>):void{
        for(let i = 0; i < equipment.length; i++){
            if(equipment[i] == 0) continue;
            switch(i){
                case 0:
                    this.mainWeapon = Item.getItem(equipment[i]);
                    break;
                case 1:
                    this.offhand = Item.getItem(equipment[i]);
                    break;
                case 2:
                    this.helmet = Item.getItem(equipment[i]);
                    break;
                case 3:
                    this.chest = Item.getItem(equipment[i]);
                    break;
                case 4:
                    this.shoes = Item.getItem(equipment[i]);
                    break;
                case 6:
                    this.cape = Item.getItem(equipment[i]);
                    break;
                case 9:
                    this.food = Item.getItem(equipment[i]);
                    break;
                case 8:
                    this.potion = Item.getItem(equipment[i]);
                    break;
                case 5:
                    this.backpack = Item.getItem(equipment[i]);
                    break;
                case 7:
                    this.mount = Item.getItem(equipment[i]);
                    break;

            }
        }
    }
}
