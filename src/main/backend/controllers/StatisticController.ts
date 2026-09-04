/* eslint-disable prefer-const */
import { Clonable } from "../models/Clonable";
import { ProgramTime } from "../models/ProgramTime";
const PROGRAM_TIME = ProgramTime.getInstance();

/**
 * Controlador de las estadisticas, es el componente encargado de registrar y manejar las estadisticas de los players
 * actualmente solo la fama.
 */
export class StatisticController implements Clonable<StatisticController>{


    totalFame:number = 0;
    totalCrediFame:number = 0;

    clone(): StatisticController {
      let e = new StatisticController();

      e.totalFame = this.totalFame;

      return e;
    }

    /**
     * Devuelve la fama por hora desde el inicio del programa.
     * @returns La fama por hora
     */
    public getFamePerHour():number{
        let elapsed = PROGRAM_TIME.elapsedTime();
        let famePerHour:number = (this.totalFame / elapsed) * 3600
        return famePerHour
    }

    /**
     * Añade la cantidad de fama especificada
     * @param fame La cantidad de fama a añadir
     */
    public addFame(fame:number):void{
        this.totalFame += fame;
    }

    public addCrediFame(crediFame:number):void{
        this.totalCrediFame += crediFame;
    }
}
