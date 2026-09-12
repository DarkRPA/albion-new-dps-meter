export class Localization{
    static selectedLanguage:string = "es";
    private translations:Map<string, string> = new Map();

    public constructor(localizations:Map<string, string>){
        this.translations = localizations;
    }

    public getTranslation(){
        return this.translations.get(Localization.selectedLanguage);
    }
}