/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { NetworkListerner } from './backend/controllers/MainController.js'
import { ViewController } from './backend/view/ViewController.js'
import { app } from 'electron'

export const Network: NetworkListerner = new NetworkListerner()
export class Main {
  static StartingTime: number = 0
}

app.disableHardwareAcceleration();
app.commandLine.appendSwitch('no-sandbox');
app.commandLine.appendSwitch('disable-gpu');
app.commandLine.appendSwitch('disable-software-rasterizer');
app.commandLine.appendSwitch('disable-gpu-compositing');
app.commandLine.appendSwitch('disable-gpu-rasterization');
app.commandLine.appendSwitch('disable-gpu-sandbox');

app.whenReady().then(() => {
  new ViewController();
  let networkListener = new NetworkListerner();
  networkListener.init();
})
