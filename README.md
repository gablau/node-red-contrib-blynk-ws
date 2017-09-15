# node-red-contrib-blynk-ws
Blynk app integration with Node Red using WebSockets protocol

[![NPM](https://nodei.co/npm/node-red-contrib-blynk-ws.png?mini=true)](https://npmjs.org/package/node-red-contrib-blynk-ws)
[![npm version](https://badge.fury.io/js/node-red-contrib-blynk-ws.svg)](https://badge.fury.io/js/node-red-contrib-blynk-ws)

## Websockets version
This works for both local and cloud Blynk servers.
For local, wss:// works if you ve got a certificate installed on Blynk cloud server.
For Blynk cloud server, you can use **ws://blynk-cloud.com:8080/websockets** or with SSL **wss://blynk-cloud.com:9443/websockets** as the server url.

If you installed Node Red globally use this command to install
```npm install --global node-red-contrib-blynk-ws```

Supports both SSL wss:// and non secure ws:// connection to local server and Blynk cloud server.

### Supported events and widgets

- read event
- write event
- app event
- write command
- set property
- emails
- notify
- LCD widget

### Blynk App Settings

Use Raspberry PI as hardware to access 128 virtual pins or Generic Board for 32.

### How to use

See help of every nodes

### Debug

Use the verbose `-v` flag when starting Node-Red to get more information
or use `node-red-log` and enable log on Configuration Node as needed

### Compatibility

This library is retrocompatible and can replace **node-red-contrib-blynk-websockets**.
To do this:
- stop node-red 
- install node-red-contrib-blynk-ws `npm install node-red-contrib-blynk-ws`
- remove node-red-contrib-blynk-websockets `npm uninstall node-red-contrib-blynk-websockets`
- edit your flow file `eg: "my-flows.js"` search for _'blynk-websockets-'_ and replace with _'blynk-ws-'_
- start node-red.

### Attributions

The **node-red-contrib-blynk-ws** was born as a fork of **node-red-contrib-blynk-websockets**
     [https://github.com/tzapu/node-red-contrib-blynk-websockets](https://github.com/tzapu/node-red-contrib-blynk-websockets)  
Some javascripts code was derived from **blynk-library-js**:   
     [https://github.com/vshymanskyy/blynk-library-js](https://github.com/vshymanskyy/blynk-library-js)  
    MIT licence
