/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/no-wrapper-object-types */
/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { App } from 'ao-network-revitalized/index.js'
import { Player } from '../models/Player.js'
import { DamagePacket } from '../models/DamagePacket.js'
import { Main } from '../../index.js'
import { ViewController } from '../view/ViewController.js'

export class NetworkListerner {
  private networkInstance: App | undefined
  static playerList: Array<Player> = []
  static totalFame: number = 0
  static paused:boolean = false;
  static foundPlayers:Array<number> = [];

  public init(): void {
    if (this.networkInstance == undefined) {
      this.networkInstance = new App(false)
      this.startEventListeners();
    }
  }

  private startEventListeners(): void {
    this.networkInstance!.on(this.networkInstance!.AODecoder.messageType.Event, route);
    this.networkInstance!.on(this.networkInstance!.AODecoder.messageType.OperationResponse, onLocalPlayerUpdate)
    this.networkInstance!.on(this.networkInstance!.AODecoder.messageType.OperationRequest, onLocalPlayerUpdate)
  }

  public static playerHasId(name:string){
    return (NetworkListerner.foundPlayers[name] != undefined);
  }
}

function onLocalPlayerUpdate(context: any): void {
  if (context.operationCode == 1) {
    let params = context.parameters
    let code = params['253']
    switch (code) {
      case 2:
        onMapChange(params)
        break
    }
  }
}


function enterToParty(parametros: any): void {
  let playersInParty = parametros[6]
  let playersPeroNumerosRaros = parametros[5]

  for (let i = 0; i < playersInParty.length; i++) {
    let p = playersInParty[i]
    if (findByName(p)) continue
    let nP = playersPeroNumerosRaros[i]

    let player = new Player(p)

    player.guid = nP
    NetworkListerner.playerList.push(player)
    ViewController.instance.sendPlayerAdded(player);
  }
}

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
        let idFromFound = NetworkListerner.foundPlayers[pList[i].name];
        if(idFromFound == value){
          return pList[i];
        }
      }
    }
  }
  return undefined;
}

// function formatNumber(num: number): string {
//   let result = ''
//   let numCalc = 0
//   if (num >= 10e2 && num < 1 * 10e5) {
//     numCalc = Math.round((num / 10e2) * 100) / 100
//     result = `${numCalc}k`
//   } else if (num >= 10e5) {
//     numCalc = Math.round((num / 10e5) * 100) / 100
//     result = `${numCalc}m`
//   } else {
//     result = '' + Math.round(num)
//   }

//   return result
// }

export function getFamePerHour() {
  let momentoActual = performance.now()
  let diff = (momentoActual - Main.StartingTime) / 1000
  let famePerHour = (NetworkListerner.totalFame / diff) * 3600
  return famePerHour
}

// //function copyToClipboard(){
//     let playerData = getPlayerData();

//     let resultTest = "Player;Damage;DPS";

//     for(let i = 0; i < playerData.length; i++){
//         let p = playerData[i];
//         let s = `\n${p[0]};${p[1]};${p[2]}`;
//         resultTest += s;
//     }

//     try{
//         copy(resultTest);
//     }catch(err){}
// }

export function reloadEverything(){
    NetworkListerner.totalFame = 0;
    for(let i = 0; i < NetworkListerner.playerList.length; i++){
        NetworkListerner.playerList[i].restartDmg();
    }
}

function route(contexto: any) {
  let params = contexto.parameters
 
  if (contexto.code == 3) return

  if(contexto.parameters["252"] >= 229 && contexto.parameters["252"] <= 250){
    console.log(params);
  }

  //console.log(params);

  switch (contexto.parameters['252']) {
    case 229:
      //->
      enterToParty(params)
      break
    // case 237:
    //   console.log();
    //   break;
    // case 230:
    //   leaveParty([0, NetworkListerner.playerList[0].guid]);
    //   break;
    case 231:
      //->
      //Entra player party
      playerJoinParty(params)
      break
    case 233:
      //->
      //Sale player
      leaveParty(params)
      break
    case 6:
      //Golpea enemigo
      let causante = params[6];
      let dano = params[2];
      hitEnemy(causante, dano);
      break
    case 7:
      let causantes:Array<number> = params[6];
      for(let i = 0; i < causantes.length; i++){
        hitEnemy(causantes[i], params[2][i]);
      }
      break
    case 82:
      //Obtenemos fama
      obtainFame(params)
      break
    case 29:
      NetworkListerner.foundPlayers[params[1]] = params[0];
      break
  }
}

function findByNumerosRaros(numeros: Array<number>) {
  for (let i = 0; i < NetworkListerner.playerList.length; i++) {
    let playerNums = NetworkListerner.playerList[i]

    if (checkNumbers(playerNums!, numeros)) {
      return playerNums
    }
  }
  return undefined
}

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

function getIndexFromName(name: string): number {
  for (let i = 0; i < NetworkListerner.playerList.length; i++) {
    let p = NetworkListerner.playerList[i]
    if (p!.name == name) return i
  }

  return -1
}

function playerJoinParty(parametros: any): void {
  let name = parametros[2]
  let guid = parametros[1]

  let player = new Player(name, guid)

  NetworkListerner.playerList.push(player)
  ViewController.instance.sendPlayerAdded(player);
}

function leaveParty(parametros: any): void {
  let guid = parametros['1']
  let p = findByNumerosRaros(guid)

  if (p == undefined) return
  if (p.isLocalPlayer) {
    NetworkListerner.playerList = [NetworkListerner.playerList[0]];
    ViewController.instance.sendLocalPlayerLeft();
  } else {
    let indexP = getIndexFromName(p.name)
    NetworkListerner.playerList.splice(indexP, 1)
    ViewController.instance.sendPlayerRemoved(p);
  }
}

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

function obtainFame(parametros: any): void {
  let cantBase = parametros[2] / 10000
  let premium = parametros[5]

  let calcPremium = premium ? cantBase * 1.5 : cantBase

  NetworkListerner.totalFame += calcPremium
}

function onMapChange(params: any) {
  let playerList = NetworkListerner.playerList
  if (Main.StartingTime == -1) Main.StartingTime = performance.now()
  let instance:ViewController = ViewController.instance;
  //NetworkListerner.foundPlayers = [];

  if (playerList[0] == undefined) {
    playerList[0] = new Player(params[2])
    playerList[0].isLocalPlayer = true
    playerList[0].guid = params[1]
    instance.sendPlayerAdded(playerList[0]);
  } else {
    playerList[0].guid = params[1]
  }

  NetworkListerner.foundPlayers[params[2]] = params[0];

  instance.sendMapChanged();

  //for(let i = 0; i < playerList.length; i++){
  //    let p = playerList[i];
  //    p.restartDmg();
  //}
}
