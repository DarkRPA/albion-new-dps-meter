import { Snapshot } from "./Snapshot";

export class ProgramTime{
    private static instance:ProgramTime;

    public programStarted:boolean = false;
    public startingTime:number = -1;
    public paused:boolean = false;
    public pausedAt:number = 0;
    public unpausedAt:number = 0;
    public totalTimePaused:number = 0;

    static {
        this.instance = new ProgramTime();
    }

    static getInstance(){
        return this.instance;
    }

    restoreSnapshot(snapshot:Snapshot){
        this.startingTime = snapshot.getStartingTime();
        this.paused = false;
        this.totalTimePaused = snapshot.getPausedTime();
    }

    pause(){
        this.pausedAt = performance.now();
        this.paused = true;
    }

    unpause(){
        this.unpausedAt = performance.now();
        this.totalTimePaused += this.unpausedAt - this.pausedAt;
        this.paused = false;
    }

    elapsedTime(){
        return (performance.now() - this.startingTime) - this.totalTimePaused;
    }

    resetTimings(){
        this.startingTime = performance.now();
        this.totalTimePaused = 0;
        this.pausedAt = 0;
        this.unpausedAt = 0;
    }
}