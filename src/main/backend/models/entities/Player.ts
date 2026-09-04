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

/**
 * Clase Player, abstracción de un jugador que SÍ nos interesa por ejemplo, un miembro de la party.
 */
export class Player extends RawPlayer implements Clonable<Player>{
  shardList: Array<Shard> = [];
  activeShard: Shard | null = null;
  averageTimeBetweenPulls: number = GLOBAL_PULL_TIME;
  isLocalPlayer: boolean = false;

  constructor(worldId:number = -1, map:string = "", name:string, guid:Guid) {
    super(worldId, map, name, guid);
  }

  clone(): Player {
    let parentClone:RawPlayer = super.clone();
    let p = new Player(this.worldId, this.map, this.name, this.guid);

    p.inventory = parentClone.inventory;
    p.guid = parentClone.getGuid();
    p.name = parentClone.getName();

    for(let i in this.shardList){
      p.shardList.push(this.shardList[i].clone());
    }
    if(this.activeShard != null){
      p.activeShard = this.activeShard.clone();
    }

    p.averageTimeBetweenPulls = this.averageTimeBetweenPulls;
    p.isLocalPlayer = this.isLocalPlayer;

    return p;
  }

  /**
   * ! Método de prueba, no debe utilizarse !
   */
  private addRandomPacket() {
    this.addPacket(new DamagePacket(Math.floor(Math.random() * 100)))
  }

  /**
   * ! Método de prueba, no debe utilizarse. !
   */
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

  /**
   * Método encargado de añadir un paquete de daño recibido por el servidor,
   * comprobará el último shard y sí aún está activo entonces añadira el paquete
   * sino, creará un nuevo shard.
   * @param DamagePacket El paquete de daño que hemos recibido del servidor
   */
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

  /**
   * Calcula el tiempo promedio entre pulls
   * ! Por el momento no está funcionando correctamente, solo devuelve GLOBAL_PULL_TIME
   * @returns GLOBAL_PULL_TIME
   */
  getAverageTimeBetweenPulls():number {
    let totalWaitingTime = 0
    if (this.shardList.length <= 1) return this.averageTimeBetweenPulls
    for (let i = 1; i < this.shardList.length; i++) {
      let shard = this.shardList[i]
      let previousShard = this.shardList[i - 1]

      totalWaitingTime += shard?.shardStart! - previousShard?.shardEnd!
    }

    //return (totalWaitingTime / (this.shardList.length - 1))/1000
    //FIXME: Arreglar el tiempo promedio entre pulls, actualmente utilizamos la constante global
    return GLOBAL_PULL_TIME;
  }

  /**
   * Devuelve el total del daño o el healing realizado en este jugador, sumando todos los shards
   * @param heal Si lo que queremos es la curación total o el daño
   * @returns El total realizado
   */
  getTotalDamage(heal = false): number{
    let result = 0;
    for(let i = 0; i < this.shardList.length; i++){
      let shard = this.shardList[i];
      result += heal?shard.getTotalHealing():shard.getTotalDamage();
    }

    return result;
  }

  /**
   * Igual que getTotalDamage(true)
   * @returns El total del healing
   */
  getTotalHealing():number{
    return this.getTotalDamage(true);
  }

  /**
   * Consigue el total de DPS de este player, juntando todos los shards
   * @param heal Si lo que queremos saber es el HPS en vez del DPS
   * @returns El total de HPS/DPS que ha hecho este player
   */
  getTotalDPS(heal = false): number{
    let result = 0;
    for(let i = 0; i < this.shardList.length; i++){
      let shard = this.shardList[i];
      if(shard.packetList.length == 0){
        continue;
      }
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

  /**
   * Igual que getTotalDps(true)
   * @returns El total de HPS
   */
  getTotalHPS():number{
    return this.getTotalDPS(true);
  }

  /**
   * Elimina todos los shards, efectivamente reiniciando el dps
   */
  restartDmg(){
    this.activeShard = null;
    this.shardList = [];
  }
}
