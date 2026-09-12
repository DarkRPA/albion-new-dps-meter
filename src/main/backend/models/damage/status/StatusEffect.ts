import { Spell } from "../Spell";

/**
 * ! POR EL MOMENTO LOS DESCARTAMOS (que locura la complejidad de esta cosa, no merece la pena por el momento)
 */
export class StatusEffect{
    causante:number;
    id:number;
    charges:number = 1;
    inEffect:boolean = false;
    //timer:TimedEffect;
    spellDescription:Spell;
    

    public constructor(spell:Spell, causante:number){
        this.spellDescription = spell;
        this.causante = causante;
        this.id = spell.spellId;
        this.inEffect = true;
    }


}