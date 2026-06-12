export abstract class Entity{
    protected worldId:number = -1;
    //El mapa en el que se encontró esta entidad.
    protected map:string = "";
    //Es posible que la entidad no este en el mundo, por ejemplo, un usuario de la party que no está en el mapa, en ese
    //caso tanto el worldId como el mapa serán nulos
    public entityFound:boolean = false;

    constructor(worldId:number = -1, map:string = ""){
        this.worldId = worldId;
        this.map = map;
    }

    isWorldId(id:number){
        return this.worldId == id;
    }

    getWorldId(){
        return this.worldId;
    }

    getWorldMap(){
        return this.map;
    }

    setWorldId(id:number){
        this.worldId = id;
    }

    setWorldMap(map:string){
        this.map = map;
    }
}