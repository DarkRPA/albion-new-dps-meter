# Albion Online DPS Meter
- *"DPS meter for linux when"* -- Eryos

Sadly [Triky313/AlbionOnline-StatisticsAnalysis](https://github.com/Triky313/AlbionOnline-StatisticsAnalysis) does not work and is not expected to work on Linux anytime soon, due to that I decided to make my own DPS Meter since I am a heavy PVE player and not being able to flex my DPS on others well, was a *nuisance*.
Anyways this is the evolution of my old, poorly made ancient dps meter which now includes better DPS calculation, better tracking and a better visual design.

Since I'm more of a back-end dev, the only thing developed with AI was the front-end, everything else was made by me.

# How to use?

There is no installation process at all since the project is compiled into a single binary however since it listen to network interfaces there are some steps we need to make before executing the binary for the first time.

## Pre-requisites
### Windows
- Install libpcap through [npcap](https://npcap.com/), remember to select you want libpcap on the installer.

Then, run the binary, depending on whether you allowed libpcap to be run by everyone or just administrator you will need to run the program with adminitrator permissions or not.

### Linux
*(I assume the file is in your Downloads folder, otherwise change the folder as you need)*
- Install libpcap through your package manager (dnf, apt, pacman|yay)
    - `dnf install libpcap`
    - `apt install libpcap-dev`
    - `pacman install libpcap`

Before running the binary we must give it execution permissions with `chmod`

`chmod +x ~/Downloads/albion-new-dps-meter-2.1.1.AppImage`

Once given permission we must run the program as sudo since we are going to be listening for network interfaces and use the --no-sandbox flag
as this project is made usen electron and electron does not work correctly (it won't run) under sudo if --no-sandbox is not used.

The final command should look something like this.

`sudo -E ~/Downloads/albion-new-dps-meter-2.1.1.AppImage --no-sandbox`

And then it should be on and ready.

![image](https://i.postimg.cc/wTHLtpt0/image.png)
