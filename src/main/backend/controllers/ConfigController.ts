/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { IConfig } from "../models/config/IConfig";

export class ConfigController{
    private static instancia:ConfigController;
    public config:IConfig|undefined;

    public getInstace(){
        if(ConfigController.instancia) return ConfigController.instancia;
        ConfigController.instancia = new ConfigController();
        return ConfigController.instancia;
    }

    private constructor(){

    }

    public loadConfigFile(){
        //Vamos a poner que el archivo de configuracion este en la carpeta donde está el ejecutable.
        
    }

}