/* eslint-disable prefer-const */
import { Item } from "../inventory/Item";
import { Clonable } from "../Clonable";
import { Spell } from "./Spell";
import { ProgramTime } from "../ProgramTime";

/**
 * Clase DamagePacket, se encarga de encapsular un paquete de daño recibido desde Albion Online
 */
export class DamagePacket implements Clonable<DamagePacket> {
  healing: boolean = false
  dmg: number = 0
  timestamp: number = 0
  weaponUsed:Item|undefined;
  //TODO: Analizar y conseguir descubrir el spell utilizado
  spellUsed:Spell;

  constructor(dmg: number, weaponUsed:Item, spellUsed:Spell) {
    //Como recibimos el daño positivo, lo negamos
    this.spellUsed = spellUsed;
    this.weaponUsed = weaponUsed;
    
    this.dmg = dmg*-1
    this.timestamp = ProgramTime.getInstance().elapsedTime();
    //Y lo mismo con el healing, lo recibimos negativo pues lo convertimos a positivo
    if(this.dmg < 0) this.healing = true;
  }

  clone(): DamagePacket {
    let copy = new DamagePacket(0, undefined!, undefined!);

    copy.healing = this.healing;
    copy.dmg = this.dmg;
    copy.timestamp = this.timestamp;
    if(this.weaponUsed){
      copy.weaponUsed = this.weaponUsed.clone();
    }

    if(this.spellUsed){
      copy.spellUsed = this.spellUsed.clone();
    }

    return copy;
  }
}
