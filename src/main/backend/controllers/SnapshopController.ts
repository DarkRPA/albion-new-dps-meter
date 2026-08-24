/* eslint-disable prefer-const */
import { Snapshot, SnapshotType } from "../models/Snapshot";
import {reloadEverything } from "./MainController";

/**
 * Clase Snapshot controller, la clase encargada de gestionar todo lo relacionado con las snapshots
 * en el futuro también, junto con el FileSystemController
 * TODO añadir el FileSystemController para funcionalidad con archivos
 */
export class SnapshotController{
  private snapshots:Array<Snapshot> = [];

  /**
   * Método encargado de buscar la snapshot de tipo NORMAL más reciente, usado para la funcionalidad del modo boss
   * y poder restaurar los datos después del boss
   * @returns La última snapshot normal
   */
  public getLastNormalTypedSnapshot():Snapshot|null{
    if(this.snapshots.length == 0){
      return null;
    }

    for(let i = (this.snapshots.length); i > 0; i--){
      let snap:Snapshot = this.snapshots[i - 1];
      if(snap.getType() == SnapshotType.NORMAL){
        return snap;
      }
    }

    return null;
  }

  /**
   * Metodo encargado de crear una snapshot desde cero, al contrario que otros funcionamientos parecidos a los shards
   * la forma en la que se crean las snapshots es similar a la de una instantanea, se hace un clonado profundo del 
   * estado de la aplicación y se guarda en memoria hasta que se utilice o se exporte
   * @param type El tipo de la snapshot {@link SnapshotType}
   * @param restartData Si el hacer la snapshot debería o no reiniciar el meter
   * @returns El objeto snapshot recien creado
   */
  public startSnapshot(type:SnapshotType, restartData:boolean = true):Snapshot{
    let result = new Snapshot(type);
    this.snapshots.push(result);
    if(restartData){
      this.restartData();
    }

    return result;
  }

  /**
   * Hace una snapshot pero de tipo normal
   * @returns Una snapshot de tipo normal
   */
  public makeNormalSnapshot():Snapshot{
    return this.startSnapshot(SnapshotType.NORMAL);
  }

  /**
   * Hace una snapshot de tipo {@link SnapshotType.BOSS}, como es de ese tipo significa que el boss ha terminado y de paso recargamos
   * la snapshot de tipo normal más reciente.
   * @returns La snapshot de tipo boss
   */
  //Ya ha terminado el boss, restauramos el anterior snapshot
  public makeBossSnapshot():Snapshot{
    let x = this.startSnapshot(SnapshotType.BOSS);

    let lastSnapshot = this.getLastNormalTypedSnapshot();
    if(lastSnapshot != null){
      lastSnapshot.restore();
    }

    return x;
  }

  /**
   * Metodo para reiniciarlo todo
   */
  public restartData():void{
    reloadEverything()
  }
}
