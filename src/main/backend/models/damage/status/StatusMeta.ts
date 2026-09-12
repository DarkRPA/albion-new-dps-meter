import { Spell } from "../Spell";

enum StatusType{
    BUFF, DEBUFF
}

export class StatusMeta{
    statusType:StatusType;
    targets:Map<string, number> = new Map();

    public constructor(spell:Spell){
        let definicion = spell["definition"];

        switch(definicion["@category"]){
            case "debuff":
                this.statusType = StatusType.DEBUFF;
                break;
            case "buff":
                this.statusType = StatusType.BUFF;
                break;
            default:
                this.statusType = StatusType.BUFF;
        }

        //let targets = definicion["buffovertime"];
    }
}