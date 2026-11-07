# Albion Online DPS Meter
- *"DPS meter for linux when"* -- Eryos

Sadly [Triky313/AlbionOnline-StatisticsAnalysis](https://github.com/Triky313/AlbionOnline-StatisticsAnalysis) does not work and is not expected to work on Linux anytime soon, for this reason I decided to make my own DPS Meter since I am a heavy PVE player and not being able to flex my DPS on others well, was a *nuisance*.
Anyways this is the evolution of my old, poorly (and badly) made ancient dps meter which now includes better DPS calculation, better tracking and a better visual design.

Since I'm more of a back-end dev, the only thing developed with AI was the front-end, everything else was made by me.

# How to use?

There is no installation process since the project is compiled into a single binary however due to its nature it listens to network interfaces so there are some steps we need to make before running the binary for the first time.

## Pre-requisites
### Windows
- Install libpcap through [npcap](https://npcap.com/), remember to select you want libpcap on the installer.

Then, run the binary, depending on whether you allowed libpcap to be run by everyone or just administrator you will need to run the program with adminitrator permissions or not.

### Linux
*(I assume the file is in your Downloads folder, otherwise change the folder as you need)*
- Install libpcap through your package manager (dnf, apt, pacman|yay)
    - `dnf install libpcap`
    - `apt install libpcap-dev`
    - `pacman -Syu libpcap`

Before running the binary we must give it execution permissions with `chmod`

`chmod +x ~/Downloads/albion-new-dps-meter-X.X.X.AppImage`

The binary must be ran as `sudo` because sniffing packets is an elevated capability, we also have to include `--no-sandbox` due to the nature of Electron and it's temptation of exploding when being ran as `sudo`.

The final command should look something like this.

`sudo -E ~/Downloads/albion-new-dps-meter-X.X.X.AppImage --no-sandbox`

And then it should be on and ready.

![image](https://i.postimg.cc/Znhpsqdx/Captura-de-pantalla-20261107-132537.png)
