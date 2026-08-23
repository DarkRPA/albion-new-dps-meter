/* eslint-disable prefer-const */
import { Snapshot, SnapshotType } from "../models/Snapshot";
import {reloadEverything } from "./MainController";

export class SnapshotController{
  private snapshots:Array<Snapshot> = [];

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

  public startSnapshot(type:SnapshotType, restartData:boolean = true):Snapshot{
    let result = new Snapshot(type);
    this.snapshots.push(result);
    if(restartData){
      this.restartData();
    }

    return result;
  }

  public makeNormalSnapshot():Snapshot{
    return this.startSnapshot(SnapshotType.NORMAL);
  }

  //Ya ha terminado el boss, restauramos el anterior snapshot
  public makeBossSnapshot():Snapshot{
    let x = this.startSnapshot(SnapshotType.BOSS);

    let lastSnapshot = this.getLastNormalTypedSnapshot();
    if(lastSnapshot != null){
      lastSnapshot.restore();
    }

    return x;
  }

  public restartData():void{
    reloadEverything()
  }
}
