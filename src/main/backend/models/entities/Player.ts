/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-non-null-asserted-optional-chain */
/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-wrapper-object-types */
import { Shard } from '../damage/Shard.js'
import { DamagePacket } from '../damage/DamagePacket.js'
import { RawPlayer } from './RawPlayer.js';
import { Guid } from './Guid.js';
import { Clonable } from '../Clonable.js';

export const GLOBAL_PULL_TIME = 6;

export class Player extends RawPlayer implements Clonable<Player>{
  shardList: Array<Shard> = [];
  activeShard: Shard | null = null;
  averageTimeBetweenPulls: number = 6;
  isLocalPlayer: boolean = false;

  constructor(worldId:number = -1, map:string = "", name:string, guid:Guid) {
    super(worldId, map, name, guid);
    //this.id = Math.floor((Math.random()*10))
    //this.startTest();
  }
  clone(): Player {
    let p = new Player(this.worldId, this.map, this.name, this.guid);
    for(let i in this.shardList){
      p.shardList.push(this.shardList[i].clone());
    }
    if(this.activeShard != null){
      p.activeShard = this.activeShard;
    }

    p.averageTimeBetweenPulls = this.averageTimeBetweenPulls;
    p.isLocalPlayer = this.isLocalPlayer;

    return p;
  }

  private addRandomPacket() {
    this.addPacket(new DamagePacket(Math.floor(Math.random() * 100)))
  }

  startTest() {
    setInterval(() => {
      this.addRandomPacket()
      this.addRandomPacket()
      this.addRandomPacket()
      this.addRandomPacket()
      this.addRandomPacket()
      this.addRandomPacket()
      this.addRandomPacket()

    }, Math.random() * 30)
  }

  addPacket(DamagePacket: DamagePacket) {
    if (this.activeShard == null) {
      this.activeShard = new Shard(this)
      this.shardList.push(this.activeShard)
    }
    let code = this.activeShard.addPacket(DamagePacket)
    if (code == -1) {
      this.activeShard = new Shard(this)
      this.shardList.push(this.activeShard)
      this.activeShard.addPacket(DamagePacket)
    }
  }

  getAverageTimeBetweenPulls() {
    let totalWaitingTime = 0
    if (this.shardList.length <= 1) return this.averageTimeBetweenPulls
    for (let i = 1; i < this.shardList.length; i++) {
      let shard = this.shardList[i]
      let previousShard = this.shardList[i - 1]

      totalWaitingTime += shard?.shardStart! - previousShard?.shardEnd!
    }

    //return (totalWaitingTime / (this.shardList.length - 1))/1000
    return 6;
  }

  getTotalDamage(heal = false): number{
    let result = 0;
    for(let i = 0; i < this.shardList.length; i++){
      let shard = this.shardList[i];
      result += heal?shard.getTotalHealing():shard.getTotalDamage();
    }

    return result;
  }

  getTotalHealing():number{
    return this.getTotalDamage(true);
  }

  getTotalDPS(heal = false): number{
    let result = 0;
    for(let i = 0; i < this.shardList.length; i++){
      let shard = this.shardList[i];
      result += shard.getElapsedTime();
    }

    let totalDPS = 0;

    if(!heal){
      totalDPS = this.getTotalDamage()/result;
    }else{
      totalDPS = this.getTotalHealing()/result;
    }

    return totalDPS;
  }

  getTotalHPS():number{
    return this.getTotalDPS(true);
  }

  restartDmg(){
    this.activeShard = null;
    this.shardList = [];
  }
}
