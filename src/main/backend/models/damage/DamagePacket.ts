/* eslint-disable prefer-const */
import { Item } from "../inventory/Item";
import { Clonable } from "../Clonable";

export class DamagePacket implements Clonable<DamagePacket> {
  healing: boolean = false
  dmg: number = 0
  timestamp: number = 0
  weaponUsed:Item|undefined;
  spellUsed:undefined;
  constructor(dmg: number) {
    this.dmg = dmg*-1
    this.timestamp = performance.now()
    if(this.dmg < 0) this.healing = true;
  }
  clone(): DamagePacket {
    let copy = new DamagePacket(0);

    copy.healing = this.healing;
    copy.dmg = this.dmg;
    copy.timestamp = this.timestamp;
    if(this.weaponUsed){
      copy.weaponUsed = this.weaponUsed.clone();
    }

    return copy;
  }
}
