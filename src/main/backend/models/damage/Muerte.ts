import { Clonable } from "../Clonable";
import { ProgramTime } from "../ProgramTime";

export class Muerte implements Clonable<Muerte>{
    private timestamp:number;
    private causanteId:number;
    private causanteNombre:string;

    constructor(id:number, nombre:string){
        this.timestamp = ProgramTime.getInstance().elapsedTime();
        this.causanteId = id;
        this.causanteNombre = nombre;
    }

    get causante(){
        return this.causanteId;
    }

    get nombre(){
        return this.causanteNombre;
    }

    clone(): Muerte {
        let muerte = new Muerte(this.causanteId, this.causanteNombre);
        muerte.timestamp = this.timestamp;
        return muerte;
    }
}