/* eslint-disable prefer-const */
import { Main } from "../..";
import { Clonable } from "../models/Clonable";

export class StatisticController implements Clonable<StatisticController>{


    totalFame:number = 0;

    clone(): StatisticController {
      let e = new StatisticController();

      e.totalFame = this.totalFame;

      return e;
    }


    public getFamePerHour():number{
        let momentoActual:number = performance.now()
        let diff:number = (momentoActual - Main.StartingTime) / 1000
        let famePerHour:number = (this.totalFame / diff) * 3600
        return famePerHour
    }

    public addFame(fame:number):void{
        this.totalFame += fame;
    }
}
