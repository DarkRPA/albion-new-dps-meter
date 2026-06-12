/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-non-null-asserted-optional-chain */
/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-wrapper-object-types */
import { Shard } from '../damage/Shard.js'
import { DamagePacket } from '../damage/DamagePacket.js'
import { Item } from '../inventory/Item.js';
import { NetworkListerner } from '../../controllers/NetworkListener.js';
import { Entity } from './Entity.js';

export const GLOBAL_PULL_TIME = 6;

export class Player extends Entity{
  guid: Array<Number> = [];
  name: string = '';
  shardList: Array<Shard> = [];
  activeShard: Shard | null = null;
  averageTimeBetweenPulls: number = 6;
  isLocalPlayer: boolean = false;
  equippedWeapon: Item|undefined;
  rawEquipment:Array<number> = [];

  constructor(name: string, guid?: Array<Number>) {
    super();
    //this.id = Math.floor((Math.random()*10))
    if(guid)
      this.guid = guid;
    this.name = name;
    //this.startTest();
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

  getWeaponImage(){
    if(!this.equippedWeapon){
      if(NetworkListerner.foundPlayers[this.name])
        this.equipmentChanged(NetworkListerner.foundPlayers[this.name][1]);
      if(!this.equippedWeapon) return "https://render.albiononline.com/v1/item/T3_MAIN_AXE.png";
    };
    return this.equippedWeapon.getRenderUrl();
  }

  equipmentChanged(newEquipment:Array<number>){
    if(newEquipment[0] != this.rawEquipment[0]){
      //Se ha cambiado el arma
      this.equippedWeapon = Item.getItem(newEquipment[0]);
    }
    this.rawEquipment = newEquipment;
  }
}
