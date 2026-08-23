/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { Clonable } from "../Clonable";
import ITEMS from "./static/items.json";

export enum Type {
    ARMOR = 1,
    MAIN = 2,
    "2H" = 3,
    HEAD = 4,
    SHOES = 5,
    MOUNT = 6,
    CAPE = 7,
    OFFHAND = 8,
    POTION = 9,
    MEAL = 10,
    UNKNOWN = 999
}

export class Item implements Clonable<Item>{
    protected id:number = 0;
    protected tier:number = 0;
    protected enchantment:number = 0;
    protected quality:number = 0;
    protected uniqueName:string = "";
    protected name:string = "";
    protected type:Type = Type.UNKNOWN;
    protected renderUrl:string = "";

    protected constructor(id:number, tier:number, enchantment:number, itemType:Type, uniqueName:string, name:string){
        this.id = id;
        this.tier = tier;
        this.enchantment = enchantment;
        this.uniqueName = uniqueName;
        this.name = name;
        this.type = itemType;
    }
    clone(): Item {
      let c = new Item(this.id, this.tier, this.enchantment, this.type, this.uniqueName, this.name);
      c.renderUrl = this.renderUrl;

      return c;
    }

    private static loadInformation(itemName:string){
        let regex = /(T[0-8])_(HEAD|BAG|CAPEITEM|POTION|OFF|MEAL|SHOES|ARMOR|MOUNT|MAIN|2H)_?(\D[^@]+)?(@?(\d))?_?(\D*)/gm;
        let groups = regex.exec(itemName);
        let data = {
            name: "",
            tier: 0,
            enchantment: 0,
            itemType: Type.UNKNOWN
        }

        if(groups == null) return;

        let tier = groups[1][1];
        let type = groups[2];

        if(type == "MAIN" || type == "2H"){
            data.name = type+"_"+groups[3];
        }else{
            data.name = groups[3];
        }

        data.tier = Number(tier);
        if(!groups[5]) data.enchantment = 0;
        else data.enchantment = Number(groups[5]);

        switch(type){
            case "ARMOR":
                data.itemType = Type.ARMOR;
                break;
            case "HEAD":
                data.itemType = Type.HEAD;
                break;
            case "SHOES":
                data.itemType = Type.SHOES;
                break;
            case "OFF":
                data.itemType = Type.OFFHAND;
                break;
            case "CAPEITEM":
                data.itemType = Type.CAPE;
                break;
            case "POTION":
                data.itemType = Type.POTION;
                break;
            case "MEAL":
                data.itemType = Type.MEAL;
                break;
            case "MOUNT":
                data.itemType = Type.MOUNT;
                break;
            case "MAIN":
                data.itemType = Type.MAIN;
                break;
            case "2H":
                data.itemType = Type["2H"];
                break;
        }

        return data;
    }

    public static getItem(id:number):Item{
        let item = ITEMS[id-1];


        let uniqueName = item["UniqueName"];
        let itemData = Item.loadInformation(uniqueName)!

        if(!itemData){
            return new Item(id, 0, 0, 999, uniqueName, "");
        }

        let newItem:Item = new Item(id, itemData.tier, itemData.enchantment, itemData.itemType, uniqueName, item["LocalizedNames"]["ES-ES"]);
        newItem.renderUrl = `https://render.albiononline.com/v1/item/${uniqueName}.png`;

        return newItem;
    }

    public getRenderUrl(){
        if(this.renderUrl == "") return "https://render.albiononline.com/v1/item/T3_MAIN_AXE.png";
        return this.renderUrl;
    }
}
