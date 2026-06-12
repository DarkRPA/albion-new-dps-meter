import { Item } from "./Item";

/**
 * Clase equipamiento para tener controlados los objetos que tiene cada usuario
 */
export class Equipment{
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

    loadEquipment(equipment:Array<number>){
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