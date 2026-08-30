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
import { ViewController } from '../view/ViewController.js'
import { PartyController } from './PartyController.js'
import { EntityController } from './EntityController.js'
import { StatisticController } from './StatisticController.js'
import { Guid } from '../models/entities/Guid.js'
import { RawPlayer } from '../models/entities/RawPlayer.js'
import { ItemEntity } from '../models/entities/ItemEntity.js'
import { Inventory } from '../models/inventory/Inventory.js'
import { SnapshotController } from './SnapshopController.js'
import { Snapshot } from '../models/Snapshot.js'
import { ProgramTime } from '../models/ProgramTime.js'

export let PARTY_CONTROLLER = new PartyController();
export let ENTITY_CONTROLLER = new EntityController();
export let STATISTIC_CONTROLLER = new StatisticController();
export const SNAPSHOT_CONTROLLER = new SnapshotController();
const PROGRAM_TIME = ProgramTime.getInstance();

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
  //Lista de los jugadores no importantes, esta lista se utiliza primordialmente para registrar todos los usuarios
  //que no están en la party y que por consecuencia no son relevantes, solo se guardan sus id's en el mundo, su nombre
  //y su inventario.
  //Lo mismo que foundPlayers pero para objetos

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
    switch (code) {
      case 2:
        //TODO: Sacar y registrar más información como por ejemplo el mapa al que ha zoneado.
        //El mapa es el parametro(8)
        onMapChange(params)
        break
      case 298:
        // Ha activado el autorespec
    }
  }
}


/**
 * Funcion encargada de controlar el evento de ingreso a una party
 * @param parametros Los parametros obtenidos desde ao-network
 */
function enterToParty(parametros: any): void {
  //Jugadores en la party
  if(!PARTY_CONTROLLER.isInParty){
    if(PARTY_CONTROLLER.membersInParty.length > 0) PARTY_CONTROLLER.membersInParty = [];
    PARTY_CONTROLLER.isInParty = true;
  }
  let playersInParty = parametros.get(9)
  let playersGuid = parametros.get(8)
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
    if (PARTY_CONTROLLER.isPlayerInParty(split[i])) continue
    let nP = split[i]

    let player = new Player(0, "", playersInParty[i], nP);
    PARTY_CONTROLLER.addPlayerToParty(player);
    ViewController.instance.sendPlayerAdded(player);
  }
}

/**
 * Reinicializa todas las variables a 0
 */
export function reloadEverything(shallow:boolean = false):void{
  //Si es shallow, significa que solo borraremos los daños, lo demás lo dejaremos intacto
  if(shallow){
    PARTY_CONTROLLER.restartDamage();
    return;
  }
  STATISTIC_CONTROLLER.totalFame = 0;
  PROGRAM_TIME.resetTimings();
  PARTY_CONTROLLER.restartDamage();
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

  switch (params.get(252)) {
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
      console.log(235, params);
      leaveParty(params)
      break
    case 90:
      //Se ha cambiado el equipamiento
      let players:Array<RawPlayer> = ENTITY_CONTROLLER.getRawPlayerById(params.get(0));
      if(players.length == 0) return;
      let player = players[0];

      player.inventory.updateEquipment(params.get(2));
      break;
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
    case 84:
      obtainCrediFame(params);
      break;
    case 29:
      let rawPlayer:RawPlayer = new RawPlayer(params.get(0), ENTITY_CONTROLLER.localPlayer?.getWorldMap() || "", params.get(1), Guid.PLACEHOLDER_GUID);
      rawPlayer.inventory.updateEquipment(params.get(40));
      ENTITY_CONTROLLER.addRawPlayer(rawPlayer);

      PARTY_CONTROLLER.updatePlayerFromRawData(rawPlayer);

      break;
    // case 29:
    //   NetworkListerner.foundPlayers[params.get(1)] =  [params.get(0),  params.get(40)];
    //   let p = findByName(params.get(1));
    //   if(!p) return;
    //   p.equipmentChanged(NetworkListerner.foundPlayers[params.get(1)][1]);
    //   break
    case 30:
      let itemEntity:ItemEntity = new ItemEntity(params.get(0), ENTITY_CONTROLLER.localPlayer?.getWorldMap() || "", params.get(1));
      ENTITY_CONTROLLER.addItemEntity(itemEntity);
      break;
  }
}

/**
 * Funcion encargada de gestionar el evento de entrada de un usuario a la party del usuario local
 * @param parametros Los parametros de ao-network
 */
function playerJoinParty(parametros: any): void {
  let name = parametros.get(2)
  let guid:Guid = new Guid(parametros.get(1))
  let players:Array<RawPlayer> = ENTITY_CONTROLLER.getRawPlayerByName(name);
  let player:Player;

  if(players.length > 0){
    let rawP:RawPlayer = players[0];
    player = new Player(rawP.getWorldId(), rawP.getWorldMap(), name, guid);
    player.inventory.setEquipment(rawP.inventory.getEquipment());
  }else{
    player = new Player(0, "", name, guid);
  }

  PARTY_CONTROLLER.addPlayerToParty(player);
  ViewController.instance.sendPlayerAdded(player);
}

/**
 * Funcion encargada de gestionar el evento de salida de un usuario a la party del usuario local o el mismo usuario local
 * @param parametros Los parametros de ao-network
 */
function leaveParty(parametros: any): void {
  let guid = parametros.get(1)
  let p:Player|undefined = PARTY_CONTROLLER.getPlayerFromGuid(new Guid(guid));

  if (p == undefined) {
    console.log(guid, PARTY_CONTROLLER.membersInParty);
    return;
  }

  if (p.isLocalPlayer) {
    PARTY_CONTROLLER.localPlayerLeftParty();
    ViewController.instance.sendLocalPlayerLeft();
  } else {
    let player:Player|undefined = PARTY_CONTROLLER.getPlayerFromGuid(new Guid(guid));
    if(!player) return;
    PARTY_CONTROLLER.removePlayerFromParty(player);
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
  if(!PROGRAM_TIME.programStarted || PROGRAM_TIME.paused) return;
  let players:Array<Player> = PARTY_CONTROLLER.getPartyMemberfromID(causante);
  let rawPlayer:Array<RawPlayer> = ENTITY_CONTROLLER.getRawPlayerById(causante);
  if(rawPlayer.length == 0) return;

  if (players.length <= 0) {
    //Intentamos encontrar a ver si tenemos su ID en el controlador de entidades
    let foundPartyPlayer:Array<Player> = PARTY_CONTROLLER.getPartyMemberFromName(rawPlayer[0].getName());
    if(foundPartyPlayer.length == 0) return;
    foundPartyPlayer[0].setWorldId(rawPlayer[0].getWorldId());

    hitEnemy(causante, damage);
    return;
  }

  let player = players[0];

  // Si por temas de albion el equipamiento del jugador no ha llegado se lo reiniciamos desde los datos que hemos recibido en el paquete 29
  if(player.inventory.getEquipment().mainWeapon == undefined){
    player.inventory = rawPlayer[0].inventory;
  }

  let paquete = new DamagePacket(damage)
  player.addPacket(paquete)

  //player.addDamage(damage*-1);
}


/**
 * Funcion de Evento encargada de gestionar el evento de Albion Online con número 82, obtención de fama
 * TODO ver por que la obtención no sé está calculando correctamente en dungeons avalonianas
 * @param parametros 
 */
function obtainFame(parametros: any): void {
  let cantBase = Number(parametros.get(2)) / 10000
  let premium = Number(parametros.get(5))

  let calcPremium = premium ? cantBase * 1.5 : cantBase

  STATISTIC_CONTROLLER.addFame(calcPremium);
}

function obtainCrediFame(parametros:any):void{
  let cantidad = Number(parametros.get(2)) / 10000;

  STATISTIC_CONTROLLER.addCrediFame(cantidad);
}

/**
 * Funcion de evento encargada de gestionar el evento con número 253: 2, cambio de mapa.
 * Agarra todos los datos necesarios como el worldId del usuario local, el mapa actual en el que está y demás datos
 * relacionados con el usuario
 * @param params 
 */
function onMapChange(params: any) {
  if (!PROGRAM_TIME.programStarted) {
    PROGRAM_TIME.programStarted = true;
    PROGRAM_TIME.startingTime = performance.now();
  }
  let instance:ViewController = ViewController.instance;
  //NetworkListerner.foundPlayers = [];

  let localPlayer:Player;

  if (ENTITY_CONTROLLER.localPlayer == undefined) {
    localPlayer = new Player(params.get(0), params.get(8), params.get(2), new Guid(params.get(1)));
    localPlayer.isLocalPlayer = true;
    ENTITY_CONTROLLER.loadLocalPlayer(localPlayer);

    instance.sendPlayerAdded(localPlayer);
  } else {
    ENTITY_CONTROLLER.localPlayer.setWorldId(params.get(0));
    localPlayer = ENTITY_CONTROLLER.localPlayer;
    localPlayer.setWorldMap(params.get(8));
  }
  let equipment = params.get(52);
  let cast:Array<ItemEntity> = [];
  for(let i = 0; i < equipment.length; i++){
    let itemEntity:Array<ItemEntity> = ENTITY_CONTROLLER.getEquipmentById(equipment[i]);
    if(itemEntity.length == 0) continue;
    cast.push(itemEntity[0]);
  }

  let convertedEquipment = Inventory.convertWorldIDInventoryToInventory(cast);
  ENTITY_CONTROLLER.addRawPlayer(localPlayer);
  localPlayer.inventory.updateEquipment(convertedEquipment);

  instance.sendMapChanged();
}

/**
 * Restaura la snapshot especificada
 * @param snapshot La snapshot a restaurar
 */
export function restoreSnapshot(snapshot:Snapshot, shallow:boolean = false):void{
  //Funcionalidad para restauraciones sin profundidad, solo restaura los daños. Equipamiento, fama, miembros de la party se verán intactos.

  if(shallow){
    //Solo restauramos el DPS, solo eso.
    if(snapshot.getPartyController() == null) return;
    for(let playerId in PARTY_CONTROLLER.membersInParty){
      let player = PARTY_CONTROLLER.membersInParty[playerId];
      let savedPartyController:PartyController = snapshot.getPartyController()!;
      if(savedPartyController.isPlayerInParty(player.getGuid())){
        //El player está en party, restauramos su daño
        let foundPlayerInSnapshot = savedPartyController.getPlayerFromGuid(player.getGuid());
        
        if(!foundPlayerInSnapshot || !foundPlayerInSnapshot.activeShard) continue;
        
        player.activeShard = foundPlayerInSnapshot?.activeShard?.clone();
        player.shardList = [];
        for(let shardId in foundPlayerInSnapshot.shardList){
          player.shardList.push(foundPlayerInSnapshot.shardList[shardId].clone());
        }
      }
    }

    let snapEntityController = snapshot.getEntityController();
    
    let localPlayer = ENTITY_CONTROLLER.localPlayer;

    if(snapEntityController == null || !localPlayer) return;

    let snapLocalPlayer = snapEntityController.localPlayer;

    if(!snapLocalPlayer || !snapLocalPlayer.activeShard) return;

    localPlayer.activeShard = snapLocalPlayer.activeShard.clone();
    localPlayer.shardList = [];
    for(let shardId in snapLocalPlayer.shardList){
      localPlayer.shardList.push(snapLocalPlayer.shardList[shardId].clone());
    }

    return;
  }

  //Restauración profunda normal

  PROGRAM_TIME.restoreSnapshot(snapshot);
  if(snapshot.getPartyController() != null){
    PARTY_CONTROLLER = snapshot.getPartyController()!
  }
  if(snapshot.getEntityController() != null){
    ENTITY_CONTROLLER = snapshot.getEntityController()!
  }
  if(snapshot.getStatisticController() != null){
    STATISTIC_CONTROLLER = snapshot.getStatisticController()!
  }
}