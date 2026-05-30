export class DamagePacket {
  healing: boolean = false
  dmg: number = 0
  timestamp: number = 0
  constructor(dmg: number) {
    this.dmg = dmg*-1
    this.timestamp = performance.now()
    if(this.dmg < 0) this.healing = true;
    
  }
}
