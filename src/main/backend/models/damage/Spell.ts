import { Clonable } from "../Clonable";
import { SpellNotFoundException } from "../exceptions/SpellNotFoundException";
import { Localization } from "../Localization";
import SPELLS from "../static/spells.json"

const LOCALIZACION_BASICOS = new Map<string, string>();
LOCALIZACION_BASICOS.set("es", "Basico");
LOCALIZACION_BASICOS.set("en", "Basic Attack");

export class Spell implements Clonable<Spell>{
    private _spellId!:number;
    private _spellLocalization!:Localization;
    private _uniqueName!:string;
    private _spellIcon!:string;

    private constructor(){}
    clone(): Spell {
        return Spell.getSpellFromID(this._spellId);
    }

    static getSpellFromID(id:number):Spell{
        let foundSpell = SPELLS["spells"][id];
        let objectSpell = new Spell();

        if(id == -1){
            objectSpell._spellId = id;
            objectSpell._spellLocalization = new Localization(LOCALIZACION_BASICOS);
            objectSpell._uniqueName = "Basico";
            objectSpell._spellIcon = "";

            return objectSpell;
        }

        if(!foundSpell){
            throw new SpellNotFoundException(`Spell with ID ${id} was not found`);
        }

        objectSpell._spellId = id;
        objectSpell._uniqueName = foundSpell["uniqueName"];
        objectSpell._spellIcon = foundSpell["iconUrl"];
        objectSpell._spellLocalization = new Localization(foundSpell["localizations"]);

        return objectSpell;
    }

    public get spellId():number{
        return this._spellId;
    }

    public get spellLocalizations():Localization{
        return this._spellLocalization;
    }

    public get uniqueName():string{
        return this._uniqueName;
    }

    public get spellIcon():string{
        return this._spellIcon;
    }

}