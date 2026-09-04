import { EntityController } from "../controllers/EntityController";
import { ENTITY_CONTROLLER, PARTY_CONTROLLER, restoreSnapshot, STATISTIC_CONTROLLER } from "../controllers/MainController";
import { PartyController } from "../controllers/PartyController";
import { StatisticController } from "../controllers/StatisticController";
import { ProgramTime } from "./ProgramTime";

/**
 * Tipo de Snapshot
 */
export enum SnapshotType {
  BOSS, NORMAL
}

/**
 * Clase Snapshot, encargada de hacer una captura del estado de la aplicación en un momento en especifico.
 * Ahora mismo no se permite la exportación pero no se descarta en un futuro cercano
 */
export class Snapshot{
  private startingTime:number = 0;
  private endingTime:number = performance.now();
  private pausedTime:number = 0;
  private partyController:PartyController|null = null;
  private entityController:EntityController|null = null;
  private statisticController:StatisticController|null = null;
  /* No IMPLEMENTADO */
  //private id = Date.now();
  private type:SnapshotType = SnapshotType.NORMAL

  /**
   * Al construir un objeto de la clase snapshot automaticamente se hace la captura del estado
   * que realmente es una clonación profunda de los controladores, habría válido clonar únicamente
   * los objetos y no los controladores completos, si, pero ya lo hice de esta forma
   * @param type El tipo de snapshot
   */
  constructor(type:SnapshotType){
    const PROGRAM_TIME = ProgramTime.getInstance();
    this.startingTime = PROGRAM_TIME.startingTime;
    this.pausedTime = PROGRAM_TIME.totalTimePaused;
    this.endingTime = performance.now();
    
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

  /**
   * Invoca al método NetworkController.restoreSnapshot
   * para restaurar esta snapshot en concreto
   */
  public restore(shallow:boolean = false):void{
    restoreSnapshot(this, shallow);
  }

  public getStartingTime():number{
    return this.startingTime;
  }

  public getEndingTime():number{
    return this.endingTime;
  }

  public getPausedTime():number{
    return this.pausedTime;
  }
}
