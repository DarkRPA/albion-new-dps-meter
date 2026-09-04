/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { Clonable } from "../Clonable";
import ITEMS from "./static/items.json";

/**
 * Icono predeterminado en caso de que no haya cargado el render del item
 */
export const DEFAULT_ITEM_RENDER_NOT_FOUND_ICON = "https://render.albiononline.com/v1/item/T3_MAIN_AXE.png";

/**
 * Los tipos de equipamiento que hay en un inventario de Albion Online
 */
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

/**
 * Clase Item, representa una abstracción de un Item de Albion Online, cualquier Item y trae metodos
 * utiles para su uso
 */
export class Item implements Clonable<Item>{
    protected id:number = 0;
    protected tier:number = 0;
    protected enchantment:number = 0;
    protected quality:number = 0;
    protected uniqueName:string = "";
    protected name:string = "";
    protected type:Type = Type.UNKNOWN;
    protected renderUrl:string = "";

    
    /**
     * Para hacer un objeto de la clase item deberemos de utilizar el metodo getItem() que buscará en
     * el archivo Items.json el ID del mismo y lo cargará en memoria
     * @param id El ID del Item
     * @param tier El tier del mismo
     * @param enchantment Su Encantamiento
     * @param itemType que tipo de item es
     * @param uniqueName su nombre único
     * @param name y su nombre localizado
     */
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

    /**
     * Metodo encargado de revisar el archivo Items.json en busca del item que se ha especificado, sintetizar sus
     * propiedades y devolverlas.
     * @param itemName El nombre del Item
     * @returns Un array con los datos del item
     */
    private static loadInformation(itemName:string){
        //Usamos un regex que nos permitirá dividir el tipo de item, tier, etc
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

        //Hacemos un switch para utilizar el enum Types dependiendo del tipo de objeto
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

    /**
     * Si queremos instanciar un objeto de la clase Item primero deberemos de llamar a este método, pues
     * el se encargará de recoger su información y colocarla en las propiedades asignadas
     * @param id El ID del objeto, que hemos recibido en ao-network-revitalized
     * @returns Un objeto de la clase Item con sus caracteristicas
     */
    public static getItem(id:number):Item{
        let item = ITEMS[id-1];

        if(!item){
            return new Item(id, 0, 0, 999, "", "");
        }


        let uniqueName = item["UniqueName"];
        let itemData = Item.loadInformation(uniqueName)!

        if(!itemData){
            return new Item(id, 0, 0, 999, uniqueName, "");
        }

        let newItem:Item = new Item(id, itemData.tier, itemData.enchantment, itemData.itemType, uniqueName, item["LocalizedNames"]["ES-ES"]);
        newItem.renderUrl = `https://render.albiononline.com/v1/item/${uniqueName}.png`;

        return newItem;
    }

    /**
     * Devuelve el icono del item o el placeholder en caso de que por alguna razon no tenga, o que por ejemplo, no se haya equipado nada
     * @returns La URL del icono del item
     */
    public getRenderUrl(){
        if(this.renderUrl == "") return DEFAULT_ITEM_RENDER_NOT_FOUND_ICON;
        return this.renderUrl;
    }
}
