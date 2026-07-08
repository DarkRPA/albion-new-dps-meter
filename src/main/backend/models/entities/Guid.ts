
/**
 * Clase wrapper para los GUID de los usuarios
 */
export class Guid{
    private guid:Array<number> = [];
    private initialized:boolean = true;

    static PLACEHOLDER_GUID = new Guid([]);
    static {
        Guid.PLACEHOLDER_GUID.initialized = false;
    }
    constructor(guid:Array<number>){
        this.guid = guid;
    }

    /**
     * Comprueba que el GUID proporcionado sea el mismo que este objeto
     * @param anotherGuid el otro guid que usaremos para comprobar
     * @returns si son el mismo o no
     */
    equal(anotherGuid:Guid):boolean{
        if(this.guid.length != anotherGuid.guid.length) return false;
        for(let i = 0; i < this.guid.length; i++){
            if(anotherGuid.guid[i] != this.guid[i]) return false;
        }
        return true;
    }

    isInitialized(){
        return this.initialized;
    }
}