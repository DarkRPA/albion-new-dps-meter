import { SpellNotFoundException } from "../exceptions/SpellNotFoundException";
import { Localization } from "../Localization";
import SPELLS from "../static/spells.json"

export class Spell{
    private spellId!:number;
    private spellLocalization!:Localization;
    private uniqueName!:string;
    private spellIcon!:string;

    private constructor(){}

    static getSpellFromID(id:number):Spell{
        let foundSpell = SPELLS["spells"][id];
        let objectSpell = new Spell();

        if(!foundSpell){
            throw new SpellNotFoundException(`Spell with ID ${id} was not found`);
        }

        objectSpell.spellId = id;
        objectSpell.uniqueName = foundSpell["uniqueName"];
        objectSpell.spellIcon = foundSpell["iconUrl"];
        objectSpell.spellLocalization = new Localization(foundSpell["localizations"]);

        return objectSpell;
    }

}