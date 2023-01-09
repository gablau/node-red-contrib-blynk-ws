# node-red-contrib-blynk-ws
![Information Panel](./docs/img/node-red-blynk.png)\
Blynk library implementation for [Node-RED](https://nodered.org/) using WebSockets

[![npm version](https://img.shields.io/npm/v/node-red-contrib-blynk-ws.svg)](https://www.npmjs.com/package/node-red-contrib-blynk-ws)
[![Npm download](https://img.shields.io/npm/dm/node-red-contrib-blynk-ws.svg)](https://www.npmjs.com/package/node-red-contrib-blynk-ws)
[![GitHub stars](https://img.shields.io/github/stars/gablau/node-red-contrib-blynk-ws.svg)](https://github.com/gablau/node-red-contrib-blynk-ws/stargazers)
[![GitHub issues](https://img.shields.io/github/issues/gablau/node-red-contrib-blynk-ws.svg)](https://github.com/gablau/node-red-contrib-blynk-ws/issues)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/gablau/node-red-contrib-blynk-ws/blob/master/LICENSE)

[![NPM](https://nodei.co/npm/node-red-contrib-blynk-ws.png?downloads=true&downloadRank=true&stars=true)](https://www.npmjs.com/package/node-red-contrib-blynk-ws)

__________
## Warning: this library is for old Blynk [or Blynk 1.0 or Legacy] for the new Blynk Iot Platform go to the new library repository: [node-red-contrib-blynk-iot](https://github.com/gablau/node-red-contrib-blynk-iot) 
---
## Node-RED blynk Websockets version
This library supports both SSL (wss://) and non secure (ws://) connection to local server ~~and Blynk cloud server~~.
For local server, wss:// works only if you ve got a certificate installed.
~~For Blynk cloud server, you can use **ws://blynk-cloud.com/websockets** or with SSL **wss://blynk-cloud.com/websockets** as the server url.~~

If you installed Node Red globally use this command to install
```npm install --global node-red-contrib-blynk-ws```

### Supported events, commands and widgets

**Events:** read, write, app (connected/disconected)\
**Commands:** write, bridge, sync (virtual/all), set property\
**Widgets:** emails, notify, LCD, table, zeRGBa, styled button, image gallery

### Changelog

See the [changelog](CHANGELOG.md) for all the details of each releases

### Node-RED palette

![Available Nodes](./docs/img/blynk-palette.png)

### Blynk App Settings

Use Raspberry PI as hardware to access 128 virtual pins or Generic Board for 32.

### How to use

See your server url and auth token in configuration node

![Information Panel](./docs/img/readme-config-connection.png)

See information panel on every nodes

![Information Panel](./docs/img/readme-info-panel.png)

### Debug

Use the verbose `-v` flag when starting Node-RED to get more information
or use `node-red-log` and enable log on Configuration Node as needed

![Log settings](./docs/img/readme-config-advanced.png)


### Compatibility

This library is retrocompatible and can replace **node-red-contrib-blynk-websockets**.
To do this:
- stop node-red 
- install node-red-contrib-blynk-ws `npm install node-red-contrib-blynk-ws`
- remove node-red-contrib-blynk-websockets `npm uninstall node-red-contrib-blynk-websockets`
- edit your flow file `eg: "my-flows.js"` search for _'blynk-websockets-'_ and replace with _'blynk-ws-'_
- start node-red.

__________


## Blynk is **the most popular Internet of Things platform** for connecting any hardware to the cloud, designing apps to control them, and managing your deployed products at scale. 

- With Blynk Library you can connect **over 400 hardware models** (including ESP8266, ESP32, NodeMCU, all Arduinos, Raspberry Pi, Particle, Texas Instruments, etc.)to the Blynk Cloud.
Full list of supported hardware can be found [here](https://github.com/blynkkk/blynkkk.github.io/blob/master/SupportedHardware.md).

- With Blynk apps for **iOS** and **Android** apps you can easily drag-n-drop graphic interfaces for any DIY or commercial project. It's a pure WYSIWG experience: no coding on iOS or Android required. 

- Hardware can connect to Blynk Cloud (open-source server) over the Internet using hardware connectivity available on your board (like ESP32), or with the use of various shields (Ethernet, WiFi, GSM, LTE, etc). Blynk Cloud is available for every user of Blynk **for free**. Direct connection over Bluetooth is also possible. 

![Blynk Banner](https://github.com/blynkkk/blynkkk.github.io/blob/master/images/GithubBanner.jpg)

## Downloads

**Blynk [Arduino Library](https://github.com/blynkkk/blynk-library/releases/latest)**

**Blynk Mobile App: 
[<img src="https://cdn.rawgit.com/simple-icons/simple-icons/develop/icons/googleplay.svg" width="18" height="18" /> Google Play](https://play.google.com/store/apps/details?id=cc.blynk) | 
[<img src="https://cdn.rawgit.com/simple-icons/simple-icons/develop/icons/apple.svg" width="18" height="18" /> App Store](https://itunes.apple.com/us/app/blynk-control-arduino-raspberry/id808760481?ls=1&mt=8)**

Optionally you can install **Blynk [Local Server](https://github.com/blynkkk/blynk-server)** and run everything locally. However, **Blynk Cloud is free** for anyone who is using Blynk for personal (non-commercial) use.


## Quickstart: Arduino + Ethernet shield

* Download the Blynk app ([App Store](https://itunes.apple.com/us/app/blynk-control-arduino-raspberry/id808760481?ls=1&mt=8), [Google Play](https://play.google.com/store/apps/details?id=cc.blynk))
* Get the Auth Token from the app
* Import this library to Arduino IDE. Guide [here](http://arduino.cc/en/guide/libraries)
* In Arduino IDE, select File -> Examples -> Blynk -> Boards_Ethernet -> Arduino_Ethernet
* Update Auth Token in the sketch and upload it to Arduino
* Connect your Arduino with Ethernet shield to the internet

When you are connected - check the included examples on how to use different types of connections (transports) and explore Blynk features. You can combine any example for your hardware + transport + features.

## Supported boards, Ethernet, WiFi, Bluetooth, GSM, Serial, USB...

Full list of supported hardware is [here](https://github.com/blynkkk/blynkkk.github.io/blob/master/SupportedHardware.md).  
Check out our Examples Browser: http://examples.blynk.cc

## Documentation and other helpful links

[Full Blynk Documentation](http://docs.blynk.cc/#blynk-firmware) - a complete guide on Blynk features  
[Community (Forum)](http://community.blynk.cc) - join a 500,000 Blynk community to ask questions and share ideas  
[Help Center](http://help.blynk.cc) - helpful articles on various Blynk aspects  
[Code Examples Browser](http://examples.blynk.cc) - browse examples to explore Blynk possibilities  
[Official Website](https://blynk.io)

**Social Media:**

[Facebook](https://www.fb.com/blynkapp) | 
[Twitter](https://twitter.com/blynk_app) | 
[Youtube](https://www.youtube.com/blynk) | 
[Instagram](https://www.instagram.com/blynk.iot/) | 
[LinkedIn](https://www.linkedin.com/company/b-l-y-n-k/)

__________

## Official implementations
* [C++, Arduino](https://github.com/blynkkk/blynk-library) (use 0.61v  this is the last release of old blynk)
* [Python, MicroPython](https://github.com/blynkkk/lib-python)

## Libraries by community
* [Node.js, Espruino, Browsers](https://github.com/vshymanskyy/blynk-library-js)
* [Python, MicroPython](https://github.com/vshymanskyy/blynk-library-python)
* [Particle](https://github.com/vshymanskyy/blynk-library-spark)
* [Lua, OpenWrt, NodeMCU](https://github.com/vshymanskyy/blynk-library-lua)
* [OpenWrt packages](https://github.com/vshymanskyy/blynk-library-openwrt)
* [MBED](https://developer.mbed.org/users/vshymanskyy/code/Blynk/)
* [Node-RED for Blynk IoT](https://flows.nodered.org/node/node-red-contrib-blynk-iot) **this is the new libary for Blynk IoT or Blynk 2.0**
* [Node-RED](https://www.npmjs.com/package/node-red-contrib-blynk-ws) **this library!**
* [LabVIEW](https://github.com/juncaofish/NI-LabVIEWInterfaceforBlynk)
* [C#](https://github.com/sverrefroy/BlynkLibrary)

## Attributions

The **node-red-contrib-blynk-ws** was born as a fork of [**node-red-contrib-blynk-websockets**](https://github.com/tzapu/node-red-contrib-blynk-websockets) and some javascripts code was derived from [**Node.js, Espruino, Browsers**](https://github.com/vshymanskyy/blynk-library-js) 

## License
This project is released under The MIT License (MIT)
