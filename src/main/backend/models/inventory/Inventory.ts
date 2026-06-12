
export class Inventory{
    private inventory:Array<number> = [];
    private equipment:Array<number> = []

    updateInventory(inventory:Array<number>){
        this.inventory = inventory;
    }

    updateEquipment(equipment:Array<number>){
        this.equipment = equipment;
    }
}