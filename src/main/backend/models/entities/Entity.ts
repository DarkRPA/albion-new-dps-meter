export abstract class Entity{
    protected worldId:number = -1;
    //El mapa en el que se encontró esta entidad.
    protected map:string = "";

    constructor(worldId:number = -1, map:string = ""){
        this.worldId = worldId;
        this.map = map;
    }

    
}