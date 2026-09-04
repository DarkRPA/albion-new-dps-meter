/* eslint-disable prefer-const */
import { Item } from "../inventory/Item";
import { Clonable } from "../Clonable";

/**
 * Clase DamagePacket, se encarga de encapsular un paquete de daño recibido desde Albion Online
 */
export class DamagePacket implements Clonable<DamagePacket> {
  healing: boolean = false
  dmg: number = 0
  timestamp: number = 0
  weaponUsed:Item|undefined;
  //TODO: Analizar y conseguir descubrir el spell utilizado
  spellUsed:undefined;

  constructor(dmg: number) {
    //Como recibimos el daño positivo, lo negamos
    this.dmg = dmg*-1
    this.timestamp = performance.now()
    //Y lo mismo con el healing, lo recibimos negativo pues lo convertimos a positivo
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
