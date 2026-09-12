import { Clonable } from "../Clonable";
import { ProgramTime } from "../ProgramTime";
import { Spell } from "./Spell";

export class SpellInstant implements Clonable<SpellInstant>{
    private _execution:number;
    private _spell:Spell;

    public constructor(spell:Spell){
        this._spell = spell;
        this._execution = ProgramTime.getInstance().elapsedTime();
    }

    clone(): SpellInstant {
        let spell = new SpellInstant(this._spell.clone());
        spell._execution = this._execution;
        return spell;
    }

    public get execution():number{
        return this._execution;
    }

    public get spell(){
        return this._spell;
    }
}