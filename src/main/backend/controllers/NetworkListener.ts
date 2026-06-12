/* eslint-disable no-case-declarations */
/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/no-wrapper-object-types */
/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { App } from 'ao-network-revitalized/index.js'
import { Player } from '../models/entities/Player.js'
import { DamagePacket } from '../models/damage/DamagePacket.js'
import { Main } from '../../index.js'
import { ViewController } from '../view/ViewController.js'
import { PartyController } from './PartyController.js'
import { EntityController } from './EntityController.js'
import { StatisticController } from './StatisticController.js'
import { Guid } from '../models/entities/Guid.js'

export const PARTY_CONTROLLER = new PartyController();
export const ENTITY_CONTROLLER = new EntityController();
export const STATISTIC_CONTROLLER = new StatisticController();

/**
 * Clase NetworkListener, se encarga de inicializar el servicio de escucha del paquete ao-network-revitalized
 * y maneja los eventos que vamos recibiendo por parte de Albion Online
 */
export class NetworkListerner {
  //La instancia de la ao-network
  private networkInstance: App | undefined;
  //Una lista de todos los usuarios core de la aplicacion, por ejemplo, usuarios de la party
  //Fama total
  //Pausado
  static paused:boolean = false;
  //Lista de los jugadores no importantes, esta lista se utiliza primordialmente para registrar todos los usuarios
  //que no están en la party y que por consecuencia no son relevantes, solo se guardan sus id's en el mundo, su nombre
  //y su inventario.
  //Lo mismo que foundPlayers pero para objetos
  //TODO: Refactorizar todo esto pues no es nada eficiente ni facil de leer.

  //Punto de entrada del programa.
  public init(): void {
    if (this.networkInstance == undefined) {
      this.networkInstance = new App(false)
      this.startEventListeners();
    }
  }

  /**
   * Inicializador de los listeners de eventos
   */
  private startEventListeners(): void {
    this.networkInstance!.on(this.networkInstance!.AODecoder.messageType.Event, route);
    this.networkInstance!.on(this.networkInstance!.AODecoder.messageType.OperationResponse, onLocalPlayerUpdate)
    this.networkInstance!.on(this.networkInstance!.AODecoder.messageType.OperationRequest, onLocalPlayerUpdate)
  }
}

/**
 * Funcion encargada de actualizar el estado del jugador local, primordialmente utilizado para
 * los cambios de mapa.
 * @param context El contexto obtenido por ao-network
 */
function onLocalPlayerUpdate(context: any): void {
  if (context.operationCode == 1) {
    let params = context.parameters
    let code = params.get(253);
    console.log(params);
    switch (code) {
      case 2:
        //TODO: Sacar y registrar más información como por ejemplo el mapa al que ha zoneado.
        onMapChange(params)
        break
    }
  }
}


/**
 * Funcion encargada de controlar el evento de ingreso a una party
 * @param parametros Los parametros obtenidos desde ao-network
 */
function enterToParty(parametros: any): void {
  //Jugadores en la party
  let playersInParty = parametros.get(6)
  let playersGuid = parametros.get(5)
  //Anteriormente los GUID los daban en un array y cada posicion del array era un sub array de 16 bytes
  //cada subarray era un GUID, ahora no se divide en sub arrays por lo que hay que separarlos manualmente
  let split:Array<Guid> = [];

  //Separamos los GUID's de forma manual saltando de 16 bytes en 16 bytes
  for(let i = 0; i < playersGuid.length; i += 16){
    let fixedGuid:Array<number> = [];
    for(let x = i; x < (i + 16) ; x++){
      fixedGuid.push(playersGuid[x]);
    }
    split.push(new Guid(fixedGuid));
  }

  //Iteramos cada jugador en la party
  for (let i = 0; i < playersInParty.length; i++) {
    let p = playersInParty[i]
    if (findByName(p)) continue
    let nP = split[i]

    let player = new Player(p)

    player.guid = nP
    NetworkListerner.playerList.push(player)
    ViewController.instance.sendPlayerAdded(player);
  }
}

/**
 * Funcion encargada de buscar un usuario en concreto por ID o por nombre,
 * este metodo solo busca a usuarios que se consideran de relevancia.
 * @param value El ID o nombre del usuario que se va a buscar
 * @param byName Si en este caso se va a buscar por nombre en vez de por ID
 * @returns Una entidad Player o indefinido si no se ha encontrado nada.
 */
export function findByName(value: string | number, byName = true): Player | undefined {
  //Devolvemos el usuario local
  let pList = NetworkListerner.playerList
  for (let i = 0; i < pList.length; i++) {
    if (byName) {
      if (pList[i]!.name == value) {
        return pList[i]
      }
    } else {
      if(NetworkListerner.foundPlayers[pList[i].name]){
        //Somehow the player got its id messed up by a lot
        let idFromFound = NetworkListerner.foundPlayers[pList[i].name][0];
        if(idFromFound == value){
          return pList[i];
        }
      }
    }
  }
  return undefined;
}

//TODO: Migrar la logica a diferentes controladores
/**
 * Calcula la fama por hora
 * @returns La fama por hora
 */
export function getFamePerHour() {
  let momentoActual = performance.now()
  let diff = (momentoActual - Main.StartingTime) / 1000
  let famePerHour = (NetworkListerner.totalFame / diff) * 3600
  return famePerHour
}
/**
 * Reinicializa todas las variables a 0
 */
export function reloadEverything(){
    NetworkListerner.totalFame = 0;
    for(let i = 0; i < NetworkListerner.playerList.length; i++){
        NetworkListerner.playerList[i].restartDmg();
    }
}

/**
 * Funcion route, recibe los paquetes de ao-network y dependiendo de su codigo de evento
 * los redirige a un lado u a otro.
 * @param contexto El contexto recibido por ao-network
 * @returns void
 */
function route(contexto: any) {
  let params = contexto.parameters

  if (contexto.code == 3) return

  switch (contexto.parameters.get(252)) {
    case 231:
      //->
      enterToParty(params)
      break
    // case 237:
    //   console.log();
    //   break;
    // case 230:
    //   leaveParty([0, NetworkListerner.playerList[0].guid]);
    //   break;
    case 233:
      //->
      //Entra player party
      playerJoinParty(params)
      break
    case 235:
      //->
      //Sale player
      leaveParty(params)
      break
    case 90:
      //Se ha cambiado el equipamiento
      let player:Player|undefined = findById(params.get(0));
      if(!player) return;

      player.equipmentChanged(params.get(2));
    case 6:
      //Golpea enemigo
      let causante = params.get(6);
      let dano = params.get(2);
      hitEnemy(causante, dano);
      break
    case 7:
      //console.log("TEST: ", params);
      let causantes:Array<number> = params.get(6);
      for(let i = 0; i < causantes.length; i++){
        hitEnemy(causantes[i], params.get(2)[i]);

      }
      break
    case 82:
      //Obtenemos fama
      obtainFame(params)
      //console.log()
      break
    case 29:
      NetworkListerner.foundPlayers[params.get(1)] =  [params.get(0),  params.get(40)];
      let p = findByName(params.get(1));
      if(!p) return;
      p.equipmentChanged(NetworkListerner.foundPlayers[params.get(1)][1]);
      break
    case 30:
      NetworkListerner.equipmentItems[params.get(0)] = params.get(1);
      break;
  }
}

//TODO: Refactorizar esta funcion, sabemos que los numeros raros son el GUID
function findByNumerosRaros(numeros: Array<number>) {
  for (let i = 0; i < NetworkListerner.playerList.length; i++) {
    let playerNums = NetworkListerner.playerList[i]

    if (checkNumbers(playerNums!, numeros)) {
      return playerNums
    }
  }
  return undefined
}

/**
 * Funcion encargada de comprobar si un GUID proporcionado corresponde a un usuario en concreto
 * @param player La entidad del jugador
 * @param numeros Su GUID
 * @returns bool Dependiendo si el GUID del jugador proporcionado es igual que el GUID proporcionado    
 */
function checkNumbers(player: Player, numeros: Array<number>) {
  if (!player) return false
  let playerNums = player.guid
  let found = true
  for (let x = 0; x < playerNums.length; x++) {
    if (numeros[x] != playerNums[x]) {
      found = false
      break
    }
  }
  return found
}

/**
 * Funcion encargada de iterar el array de usuario no relevantes y comprobar si el nombre está presente
 * en caso de que lo esté, lo devuelve
 * @param name Nombre del usuario
 * @returns number El ID del usuario en el mapa
 */
function getIndexFromName(name: string): number {
  for (let i = 0; i < NetworkListerner.playerList.length; i++) {
    let p = NetworkListerner.playerList[i]
    if (p!.name == name) return i
  }

  return -1
}

/**
 * Funcion encargada de gestionar el evento de entrada de un usuario a la party del usuario local
 * @param parametros Los parametros de ao-network
 */
function playerJoinParty(parametros: any): void {
  let name = parametros.get(2)
  let guid = parametros.get(1)

  let player = new Player(name, guid)

  NetworkListerner.playerList.push(player)
  ViewController.instance.sendPlayerAdded(player);
}

/**
 * Funcion encargada de gestionar el evento de salida de un usuario a la party del usuario local o el mismo usuario local
 * @param parametros Los parametros de ao-network
 */
function leaveParty(parametros: any): void {
  let guid = parametros.get(1)
  let p = findByNumerosRaros(guid)

  if (p == undefined) {
    console.log(guid, NetworkListerner.playerList);
    return;
  }
  if (p.isLocalPlayer) {
    NetworkListerner.playerList = [NetworkListerner.playerList[0]];
    ViewController.instance.sendLocalPlayerLeft();
  } else {
    let indexP = getIndexFromName(p.name)
    NetworkListerner.playerList.splice(indexP, 1)
    ViewController.instance.sendPlayerRemoved(p);
  }
}

/**
 * Funcion encargada de gestionar el evento de golpear a una entidad en el mundo.
 * @param causante El ID del mundo del causante
 * @param damage El Daño causado
 * @returns void
 */
function hitEnemy(causante:number, damage:number): void {
  if(NetworkListerner.paused) return;
  let player = findById(causante)
  if (!player) {return}

  let paquete = new DamagePacket(damage)
  player.addPacket(paquete)

  //player.addDamage(damage*-1);
}

function findById(id: number) {
  return findByName(id, false)
}

function findItemByWorldID(id:number){
  return NetworkListerner.equipmentItems[id] || 0;
}

function convertWorldIdInvetory(inventory:Array<number>):Array<number>{
  let result:Array<number> = [];
  for(let i = 0; i < inventory.length; i++){
    result[i] = findItemByWorldID(inventory[i]);
  }

  return result;
}

function obtainFame(parametros: any): void {
  let cantBase = Number(parametros.get(2)) / 10000
  let premium = Number(parametros.get(5))

  let calcPremium = premium ? cantBase * 1.5 : cantBase

  NetworkListerner.totalFame += calcPremium
}

function onMapChange(params: any) {
  let playerList = NetworkListerner.playerList
  if (Main.StartingTime == -1) Main.StartingTime = performance.now()
  let instance:ViewController = ViewController.instance;
  //NetworkListerner.foundPlayers = [];

  if (playerList[0] == undefined) {
    playerList[0] = new Player(params.get(2));
    playerList[0].isLocalPlayer = true
    playerList[0].guid = params.get(5);
    instance.sendPlayerAdded(playerList[0]);
  } else {
    playerList[0].guid = params.get(1);
  }
  let inventory = params.get(52);
  
  NetworkListerner.foundPlayers[params.get(2)] = [params.get(0), convertWorldIdInvetory(inventory)];
  let player:Player|undefined = findById(params.get(0));
  instance.sendMapChanged();

  if(!player) return;

  player.equipmentChanged(NetworkListerner.foundPlayers[params.get(2)][1]);

  //for(let i = 0; i < playerList.length; i++){
  //    let p = playerList[i];
  //    p.restartDmg();
  //}
}