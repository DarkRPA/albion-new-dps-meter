import { Main } from "../..";

export class StatisticController{
    totalFame:number = 0;

    public getFamePerHour(){
        let momentoActual = performance.now()
        let diff = (momentoActual - Main.StartingTime) / 1000
        let famePerHour = (this.totalFame / diff) * 3600
        return famePerHour
    }

    public addFame(fame:number){
        this.totalFame += fame;
    }
}