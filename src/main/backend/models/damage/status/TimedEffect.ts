import { ProgramTime } from "../../ProgramTime";

const DEFAULT_TIMER_CHECK = 500; //ms

export class TimedEffect{
    expirationTime:number;
    expired:boolean = false;

    public constructor(expirationTime:number){
        this.expirationTime = expirationTime;
        this._startTimer();
    }

    public extendExpirationTime(tiempo:number){
        this.expirationTime += tiempo;
    }

    private _startTimer(){
        let interval = setInterval(()=>{
            let ahoraMismo = ProgramTime.getInstance().elapsedTime();
            if(ahoraMismo >= this.expirationTime){
                this.expired = true;
                clearInterval(interval);
            }
        }, DEFAULT_TIMER_CHECK);
    }
}