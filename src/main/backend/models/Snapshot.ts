import { Main } from "../..";
import { EntityController } from "../controllers/EntityController";
import { ENTITY_CONTROLLER, PARTY_CONTROLLER, restoreSnapshot, STATISTIC_CONTROLLER } from "../controllers/MainController";
import { PartyController } from "../controllers/PartyController";
import { StatisticController } from "../controllers/StatisticController";

export enum SnapshotType {
  BOSS, NORMAL
}

export class Snapshot{
  private startingTime:number = 0;
  private endingTime:number = performance.now();
  private partyController:PartyController|null = null;
  private entityController:EntityController|null = null;
  private statisticController:StatisticController|null = null;
  /* No IMPLEMENTADO */
  //private id = Date.now();
  private type:SnapshotType = SnapshotType.NORMAL

  constructor(type:SnapshotType){
    this.startingTime = Main.StartingTime;
    this.type = type;
    this.partyController = PARTY_CONTROLLER.clone();
    this.entityController = ENTITY_CONTROLLER.clone();
    this.statisticController = STATISTIC_CONTROLLER.clone();
  }

  public getPartyController():PartyController|null{
    if(this.partyController != null)
      return this.partyController.clone();
    return null;
  }

  public getEntityController():EntityController|null{
    if(this.entityController != null)
      return this.entityController.clone();
    return null;
  }

  public getStatisticController():StatisticController|null{
    if(this.statisticController != null)
      return this.statisticController.clone();
    return null;
  }

  public getType():SnapshotType{
    return this.type;
  }

  public restore():void{
    restoreSnapshot(this);
  }

  public getStartingTime():number{
    return this.startingTime;
  }

  public getEndingTime():number{
    return this.endingTime;
  }
}
