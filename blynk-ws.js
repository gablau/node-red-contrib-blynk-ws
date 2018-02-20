/**
 * Copyright 2013,2015 IBM Corp.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 **/
module.exports = function(RED) {
    "use strict";
    var ws = require("ws");
    //var inspect = require("util").inspect;
    var DataView = require('buffer-dataview');

    //BLYNK STUFF
    function messageToDebugString(bufArray) {
        var cmd = decodeCommand(bufArray);
        if (cmd.type === MsgType.HW || cmd.type === MsgType.INTERNAL) {
            return "Cmd: " + cmd.typeString + ", Id: " + cmd.msgId + ", len: " + cmd.len + ", data: " + printData(cmd.body);
        }
        else
            return "Cmd: " + cmd.typeString + ", Id: " + cmd.msgId + ", responseCode: " + getStatusByCode(cmd.len);
    }
    

    function decodeCommand(bufArray) {
        var dataview = new DataView(bufArray);
        var cmd = {};
        cmd.type = dataview.getInt8(0);
        cmd.typeString = getCommandByCode(dataview.getInt8(0));
        cmd.msgId = dataview.getUint16(1);
        cmd.len = dataview.getUint16(3);

        if (cmd.type === MsgType.HW) {
            cmd.len = dataview.getUint16(3);

            cmd.body = '';
            for (var i = 0, offset = 5; i < cmd.len; i++, offset++) {
                cmd.body += String.fromCharCode(dataview.getInt8(offset));
            }
            if (cmd.body !== '') {
                var values = cmd.body.split('\0');
                if (values.length > 1) {
                    cmd.operation = values[0];
                    cmd.pin = values[1];
                    if (values.length > 2) {
                        cmd.value = values[2];
                        //we have an array of cmds, return array as well
                        cmd.array = values.slice(2, values.length);
                    }

                }
            }
        } else if (cmd.type === MsgType.INTERNAL) {
            cmd.body = '';
            for (var i = 0, offset = 5; i < cmd.len; i++, offset++) {
                cmd.body += String.fromCharCode(dataview.getInt8(offset));
            }
        } else {
            cmd.status = dataview.getUint16(3);
        }

        return cmd;
    }
    
    function blynkHeader(msg_type, msg_id, msg_len) {
        return String.fromCharCode(
            msg_type,
            msg_id  >> 8, msg_id  & 0xFF,
            msg_len >> 8, msg_len & 0xFF
        );
    }
    
    function printData(data){
      var data = data + "" ;
      return JSON.stringify(data);  
    }

    
    var BLYNK_VERSION = "0.4.7"; //blynk library version
    var BLYNK_HEARTBEAT = 10; //seconds


    var MsgType = {
        RSP           :  0,
        
        //app commands
        REGISTER      :  1, //"mail pass"
        LOGIN         :  2, //"token" or "mail pass"
        SAVE_PROF     :  3,
        LOAD_PROF     :  4,
        GET_TOKEN     :  5,
        PING          :  6,
        ACTIVATE      :  7, //"DASH_ID"
        DEACTIVATE    :  8, //
        REFRESH       :  9, //"refreshToken DASH_ID"
        GET_GRAPH_DATA : 10,
        GET_GRAPH_DATA_RESPONSE : 11,
        
         //HARDWARE commands
        TWEET         :  12,
        EMAIL         :  13,
        NOTIFY        :  14,
        BRIDGE        :  15,
        HW_SYNC       :  16,
        INTERNAL      :  17, //0x11
        SMS           :  18,
        PROPERTY      :  19,
        HW            :  20, //0x14
        
        //app commands
        CREATE_DASH         : 21,
        UPDATE_DASH         : 22,
        DELETE_DASH         : 23,
        LOAD_PROF_GZ        : 24,
        APP_SYNC            : 25,
        SHARING             : 26,
        ADD_PUSH_TOKEN      : 27,
        EXPORT_GRAPH_DATA   : 28,

        //app sharing commands
        GET_SHARED_DASH     : 29,
        GET_SHARE_TOKEN     : 30,
        REFRESH_SHARE_TOKEN : 31,
        SHARE_LOGIN         : 32,
        
         //app commands
        CREATE_WIDGET       : 33,
        UPDATE_WIDGET       : 34,
        DELETE_WIDGET       : 35,

        //energy commands
        GET_ENERGY          : 36,
        ADD_ENERGY          : 37,

        UPDATE_PROJECT_SETTINGS : 38,

        GET_SERVER          : 40,
        CONNECT_REDIRECT    : 41,

        CREATE_DEVICE       : 42,
        UPDATE_DEVICE       : 43,
        DELETE_DEVICE       : 44,
        GET_DEVICES         : 45,

        CREATE_TAG          : 46,
        UPDATE_TAG          : 47,
        DELETE_TAG          : 48,
        GET_TAGS            : 49,

        APP_CONNECTED       : 50,

        //web sockets
        WEB_SOCKETS         : 52,

        EVENTOR             : 53,
        WEB_HOOKS           : 54,

        DEBUG_PRINT         : 55
    };
    


    var MsgStatus = {
        OK                          : 200,
        QUOTA_LIMIT_EXCEPTION       : 1,
        ILLEGAL_COMMAND             : 2,
        NOT_REGISTERED              : 3,
        ALREADY_REGISTERED          : 4,
        NOT_AUTHENTICATED           : 5,
        NOT_ALLOWED                 : 6,
        DEVICE_NOT_IN_NETWORK       : 7,
        NO_ACTIVE_DASHBOARD         : 8, 
        INVALID_TOKEN               : 9,
        ILLEGAL_COMMAND_BODY        : 11, 
        GET_GRAPH_DATA_EXCEPTION    : 12,
        NO_DATA_EXCEPTION           : 17,
        DEVICE_WENT_OFFLINE         : 18,
        SERVER_EXCEPTION            : 19,

        NTF_INVALID_BODY            : 13,
        NTF_NOT_AUTHORIZED          : 14,
        NTF_ECXEPTION               : 15,

        TIMEOUT                     : 16,

        NOT_SUPPORTED_VERSION       : 20,
        ENERGY_LIMIT                : 21
    };
    
    function getKeyByValue(object, value) {
        return Object.keys(object).find(key => object[key] === value);
    }
    
    function getCommandByCode(cmd) {
        var key = getKeyByValue(MsgType, cmd);
        if(key !== undefined ) return key;
        else return cmd;
    }

    function getStatusByCode(statusCode) {
        var key = getKeyByValue(MsgStatus, statusCode);
        if(key !== undefined ) return key;
        else return statusCode; 
    }
    //END BLYNK STUFF



    // A node red node that sets up a local websocket server
    function BlynkClientNode(n) {
        // Create a RED node
        RED.nodes.createNode(this, n);
        // Store local copies of the node configuration (as defined in the .html)
        this.path = n.path;
        this.key = n.key;
        this.dbg_all = n.dbg_all;
        this.dbg_read = n.dbg_read;
        this.dbg_write = n.dbg_write;
        this.dbg_notify = n.dbg_notify;
        this.dbg_mail = n.dbg_mail;
        this.dbg_prop = n.dbg_prop;
        this.dbg_low = n.dbg_low;
        this.dbg_pins = n.dbg_pins;
        this.log_pins = [];
        
        if (typeof this.dbg_pins === 'string' ) {
            var tmp_pins = this.dbg_pins.split(',');
            for(var i=0; i<tmp_pins.length; i++) { 
                tmp_pins[i] = +tmp_pins[i]; 
                if(Number.isInteger(tmp_pins[i]) && Number.parseInt(tmp_pins[i])>=0 && Number.parseInt(tmp_pins[i])<=127) {
                    this.log_pins.push(tmp_pins[i].toString());
                }
            } 
        }
        

        this._inputNodes = []; // collection of nodes that want to receive events
        this._clients = {};
        // match absolute url
        this.closing = false;
        this.logged = false;
        this.msg_id = 1;

        this.setMaxListeners(100);

        this.pinger = setInterval(function() {
            //only ping if connected and working
            if (node.logged) {
                node.ping();
            }
        }, BLYNK_HEARTBEAT * 1000);

        this.closing = false;
        
        var node = this;
        
        node.log("LOG PINS " + JSON.stringify(this.log_pins));
        

        function startconn() { // Connect to remote endpoint
            //should not start connection if no server or key
            //node.log(RED._("Start connection: ") + node.path);
            node.logged = false;
            if (node.path.startsWith("wss://")) {
                node.log(RED._("Start secure connection: ") + node.path);
                var socket = new ws(node.path, {
                    protocolVersion: 8,
                    rejectUnauthorized: false
                  });
            }
            else {
                node.log(RED._("Start connection: ") + node.path);
                var socket = new ws(node.path);
            }
            node.server = socket; // keep for closing
            socket.setMaxListeners(100);

            socket.on('open', function() {
                node.login(node.key);
            });

            socket.on('close', function() {
                node.log(RED._("Connection closed: ") + node.path);
                node.emit('closed');
                node.logged = false;
                if (!node.closing) {
                    clearTimeout(node.tout);
                    node.tout = setTimeout(function() {
                        startconn();
                    }, 5000); // try to reconnect every 5 secs... bit fast ?
                }
            });

            socket.on('message', function (data, flags) {
                if (node.dbg_low) {
                    node.log("RECV <- " + messageToDebugString(data));
               }
                var cmd = decodeCommand(data);
                if (!node.logged) {
                    if (cmd.type === MsgType.RSP && cmd.msgId === 1) {
                        if (cmd.len === MsgStatus.OK || cmd.len === MsgStatus.ALREADY_REGISTERED) {
                            node.log("Client logged");
                            node.logged = true;
                            node.emit('connected', '');
                            node.sendMsg(MsgType.INTERNAL, ['ver', BLYNK_VERSION, 'h-beat', BLYNK_HEARTBEAT, 'dev', 'node-red', 'conn', 'Socket']);
                        }
                    }
                } else {
                    switch (cmd.type) {
                        case MsgType.HW:
                        case MsgType.BRIDGE:
                            switch (cmd.operation) {
                                //input nodes
                                case 'vw':
                                    node.handleWriteEvent(cmd);
                                    break;
                                case 'vr':
                                    node.handleReadEvent(cmd);
                                    break;
				case 'pm':
                                    // skip message "pin mode"
                                    break;	    
                                default:
                                    node.warn(RED._("Invalid HW cmd: ") + messageToDebugString(data));
                                    node.sendRsp(MsgType.RSP, node.msg_id, MsgStatus.ILLEGAL_COMMAND);
                            }
                            break;
                        case MsgType.RSP:
                            if (cmd.status !== MsgStatus.OK) {
                                node.warn(RED._("Unhandled RSP type: ") + messageToDebugString(data));
                            }
                            break;
                        case MsgType.LOGIN:
                        case MsgType.PING:
                            node.sendRsp(MsgType.RSP, node.msg_id, MsgStatus.OK);
                            break;
                        case MsgType.INTERNAL:
                            switch (cmd.body) {
                                //app event node
                                case 'acon':
                                case 'adis':
                                    node.handleAppEvent(cmd.body);
                                    break;
                                default:
                                    node.warn(RED._("Invalid INTERNAL cmd: ") + messageToDebugString(data));
                                    //node.sendRsp(MsgType.RSP, node.msg_id, MsgStatus.ILLEGAL_COMMAND);
                            }
                            break;
                        case MsgType.GET_TOKEN:
                            node.sendRsp(MsgType.GET_TOKEN, node.msg_id, node.key.length, node.key);
                            break;
                        case MsgType.LOAD_PROF:
                            //node.sendRsp(MsgType.LOAD_PROF, node.msg_id, profile.length, self.profile);
                            break;
                        case MsgType.DEBUG_PRINT:
                            node.log("Server: " + cmd.operation);
                            break;
                        case MsgType.REGISTER:
                        case MsgType.SAVE_PROF:
                        case MsgType.INTERNAL:
                        case MsgType.ACTIVATE:
                        case MsgType.DEACTIVATE:
                        case MsgType.REFRESH:
                            // skip this message types
                            break;
                        default:
                            node.warn(RED._("Invalid msg type: ") + messageToDebugString(data));
                            node.sendRsp(MsgType.RSP, node.msg_id, MsgStatus.ILLEGAL_COMMAND);
                    }
                }
            });
            socket.on('error', function(err) {
                node.error(RED._("Socket error: ") + err);
                node.emit('erro');
                node.logged = false;
                if (!node.closing) {
                    clearTimeout(node.tout);
                    node.tout = setTimeout(function() {
                        startconn();
                    }, 5000); // try to reconnect every 5 secs... bit fast ?
                }
            });
        }

        node.on("close", function() {
            // Workaround https://github.com/einaros/ws/pull/253
            // Remove listeners from RED.server
            node.closing = true;
            node.logged = false;
            node.server.close();
            if (node.tout) {
                clearTimeout(node.tout);
            }
        });

        startconn(); // start outbound connection

    }

    RED.nodes.registerType("blynk-ws-client", BlynkClientNode);

    BlynkClientNode.prototype.registerInputNode = function (handler) {
        var pinlog = '';
        if(handler.pin != undefined) {
            pinlog = " pin: " + handler.pin;
        }
        this.log("Register input node" + " - type: " + handler.nodeType + pinlog);
        this._inputNodes.push(handler);
    };

    BlynkClientNode.prototype.removeInputNode = function (handler) {
        var pinlog = '';
        if(handler.pin != undefined) {
            pinlog = " pin: " + handler.pin;
        }
        this.log("Remove input node" + " - type: " + handler.nodeType + pinlog);
        this._inputNodes.forEach(function (node, i, inputNodes) {
            if (node === handler) {
                inputNodes.splice(i, 1);
            }
        });
    };
    
    BlynkClientNode.prototype.isLogPin = function (pin) {
        if (this.log_pins.indexOf(pin) > -1) {
            return true;
        } else {
            return false;
        }
    };
    
    BlynkClientNode.prototype.sendRsp = function (msg_type, msg_id, msg_len, data) {
        var self = this;
        data = data || "";
        msg_id = msg_id || (self.msg_id++);
        if (msg_type === MsgType.RSP) {
            data = blynkHeader(msg_type, msg_id, msg_len);
            if (this.dbg_low) {
                this.log("SEND -> Cmd: " + getCommandByCode(msg_type) + " Id: " + msg_id + " Status: " + getStatusByCode(msg_len));
            }
        } else {
            data = blynkHeader(msg_type, msg_id, msg_len) + data;
            if (this.dbg_low) {
                this.log("SEND -> Cmd: " + getCommandByCode(msg_type) + " Id: " + msg_id + " Data: " + printData(data));
            }
        }
        //convert to Uint8Array
        var rawdata = new Uint8Array(data.length);
        for (var i = 0, j = data.length; i < j; ++i) {
            rawdata[i] = data.charCodeAt(i);
        }
        this.server.send(rawdata);
    };
    
    BlynkClientNode.prototype.sendMsg = function(msg_type, values, msg_id) {
        var values = values || [''];
        var data = values.join('\0');
        this.sendRsp(msg_type, msg_id, data.length, data);
      };

    BlynkClientNode.prototype.login = function(token) {
        if(this.dbg_all){
            this.log("login -> " + token);
        }
        this.sendRsp(MsgType.LOGIN, 1, token.length, token);
    };

    BlynkClientNode.prototype.ping = function() {
        if(this.dbg_all || this.dbg_read){
            this.log("ping");
        }
      this.sendMsg(MsgType.PING);
    };

    BlynkClientNode.prototype.virtualWrite = function(vpin, val) {
        if(this.dbg_all || this.dbg_write || this.isLogPin(vpin)){
            this.log("virtualWrite: -> " + JSON.stringify(['vw', vpin].concat(val)));
        }
        this.sendMsg(MsgType.HW, ['vw', vpin].concat(val));
    };
    
    BlynkClientNode.prototype.setProperty = function(vpin, prop, val) {
        if(this.dbg_all  || this.dbg_prop || this.isLogPin(vpin)){
            this.log("setProperty -> " + JSON.stringify([vpin, prop].concat(val)));
        }
        this.sendMsg(MsgType.PROPERTY, [vpin, prop].concat(val));
    };

    BlynkClientNode.prototype.sendEmail = function(to, subject, message) {
        if(this.dbg_all || this.dbg_mail){
            this.log("sendEmail -> " + JSON.stringify([to, subject, message]));
        }
        this.sendMsg(MsgType.EMAIL, [to, subject, message]);
    };
    
    BlynkClientNode.prototype.sendNotify = function(message) {
        if(this.dbg_all || this.dbg_notify){
            this.log("sendNotify -> " + JSON.stringify([message]));
        }
        this.sendMsg(MsgType.NOTIFY, [message]);
    };


    BlynkClientNode.prototype.handleWriteEvent = function(command) {
        if(this.dbg_all || this.dbg_write || this.isLogPin(command.pin)){
           this.log("writeEvent: -> cmd " + JSON.stringify(command));
        }
        for (var i = 0; i < this._inputNodes.length; i++) {
            if (this._inputNodes[i].nodeType == 'write' && this._inputNodes[i].pin == command.pin) {
                var msg;

                msg = {
                    payload: command.value
                };

                if (command.array) {
                    msg.arrayOfValues = command.array;
                }
                
                if(this.dbg_all || this.dbg_write || this.isLogPin(command.pin)){
                    this.log("writeEvent: -> output " + JSON.stringify(msg));
                }

                this._inputNodes[i].send(msg);
            }
        }
    };

    BlynkClientNode.prototype.handleReadEvent = function(command) {
        if(this.dbg_all || this.dbg_read || this.isLogPin(command.pin)){
	     this.log("readEvent: -> cmd " + JSON.stringify(command));
        }
        for (var i = 0; i < this._inputNodes.length; i++) {
            if (this._inputNodes[i].nodeType == 'read' && this._inputNodes[i].pin == command.pin) {
                var msg;
                    
                msg = {
                    payload: this._inputNodes[i].pin
                };
                
                if(this.dbg_all || this.dbg_read || this.isLogPin(command.pin)){
                    this.log("readEvent: -> output " + JSON.stringify(msg));
                }

                this._inputNodes[i].send(msg);
            }
        }
    };
    
    BlynkClientNode.prototype.handleAppEvent = function(command) {
        for (var i = 0; i < this._inputNodes.length; i++) {
            if (this._inputNodes[i].nodeType == 'app') {
                var msg;

                msg = {
                    payload: command
                };

                this._inputNodes[i].send(msg);
            }
        }
    };

    function BlynkInReadNode(n) {
        RED.nodes.createNode(this, n);
        this.server = (n.client) ? n.client : n.server;
        var node = this;
        this.serverConfig = RED.nodes.getNode(this.server);

        this.nodeType = 'read';
        this.pin = n.pin;

        if (this.serverConfig) {
            this.serverConfig.registerInputNode(this);
            // TODO: nls
            this.serverConfig.on('opened', function(n) {
                node.status({
                    fill: "yellow",
                    shape: "dot",
                    text: "connecting " + n
                });
            });
            this.serverConfig.on('connected', function(n) {
                node.status({
                    fill: "green",
                    shape: "dot",
                    text: "connected to pin V" + node.pin
                });
            });
            this.serverConfig.on('erro', function() {
                node.status({
                    fill: "red",
                    shape: "ring",
                    text: "error"
                });
            });
            this.serverConfig.on('closed', function() {
                node.status({
                    fill: "red",
                    shape: "ring",
                    text: "disconnected"
                });
            });
        } else {
            this.error(RED._("websocket.errors.missing-conf"));
        }

        this.on('close', function() {
            node.serverConfig.removeInputNode(node);
        });

    }
    RED.nodes.registerType("blynk-ws-in-read", BlynkInReadNode);


    function BlynkInWriteNode(n) {
        RED.nodes.createNode(this, n);
        this.server = (n.client) ? n.client : n.server;
        var node = this;
        this.serverConfig = RED.nodes.getNode(this.server);

        this.nodeType = 'write';
        this.pin = n.pin;

        if (this.serverConfig) {
            this.serverConfig.registerInputNode(this);
            // TODO: nls
            this.serverConfig.on('opened', function(n) {
                node.status({
                    fill: "yellow",
                    shape: "dot",
                    text: "connecting " + n
                });
            });
            this.serverConfig.on('connected', function(n) {
                node.status({
                    fill: "green",
                    shape: "dot",
                    text: "connected to pin V" + node.pin
                });
            });
            this.serverConfig.on('erro', function() {
                node.status({
                    fill: "red",
                    shape: "ring",
                    text: "error"
                });
            });
            this.serverConfig.on('closed', function() {
                node.status({
                    fill: "red",
                    shape: "ring",
                    text: "disconnected"
                });
            });
        } else {
            this.error(RED._("websocket.errors.missing-conf"));
        }

        this.on('close', function() {
            node.serverConfig.removeInputNode(node);
        });

    }
    RED.nodes.registerType("blynk-ws-in-write", BlynkInWriteNode);
    
    function BlynkInAppNode(n) {
        RED.nodes.createNode(this, n);
        this.server = (n.client) ? n.client : n.server;
        var node = this;
        this.serverConfig = RED.nodes.getNode(this.server);

        this.nodeType = 'app';

        if (this.serverConfig) {
            this.serverConfig.registerInputNode(this);
            // TODO: nls
            this.serverConfig.on('opened', function(n) {
                node.status({
                    fill: "yellow",
                    shape: "dot",
                    text: "connecting " + n
                });
            });
            this.serverConfig.on('connected', function(n) {
                node.status({
                    fill: "green",
                    shape: "dot",
                    text: "connected "
                });
            });
            this.serverConfig.on('erro', function() {
                node.status({
                    fill: "red",
                    shape: "ring",
                    text: "error"
                });
            });
            this.serverConfig.on('closed', function() {
                node.status({
                    fill: "red",
                    shape: "ring",
                    text: "disconnected"
                });
            });
        } else {
            this.error(RED._("websocket.errors.missing-conf"));
        }

        this.on('close', function() {
            node.serverConfig.removeInputNode(node);
        });

    }
    RED.nodes.registerType("blynk-ws-in-app", BlynkInAppNode);
    
    function BlynkOutWriteNode(n) {
        RED.nodes.createNode(this, n);
        var node = this;
        this.server = n.client;
        this.pin = n.pin;
        this.pinmode = n.pinmode; 
        
        if(this.pinmode == 1) 
            this.connected_label = "connected to dynamic pin";
        else
            this.connected_label = "connected to pin V" + this.pin;
             

        this.serverConfig = RED.nodes.getNode(this.server);
        if (!this.serverConfig) {
            this.error(RED._("websocket.errors.missing-conf"));
        } else {
            // TODO: nls
            this.serverConfig.on('opened', function(n) {
                node.status({
                    fill: "yellow",
                    shape: "dot",
                    text: "connecting " + n
                });
            });
            this.serverConfig.on('connected', function(n) {
                node.status({
                    fill: "green",
                    shape: "dot",
                    text: node.connected_label
                });
            });
            this.serverConfig.on('erro', function() {
                node.status({
                    fill: "red",
                    shape: "ring",
                    text: "error"
                });
            });
            this.serverConfig.on('closed', function() {
                node.status({
                    fill: "red",
                    shape: "ring",
                    text: "disconnected"
                });
            });
        }
        this.on("input", function(msg) {
            if (msg.hasOwnProperty("payload") && node.serverConfig && node.serverConfig.logged) {
                var payload = Buffer.isBuffer(msg.payload) ? msg.payload : RED.util.ensureString(msg.payload);
                var subject = msg.topic ? msg.topic : payload;
                var pin = node.pin;
                if(node.pinmode == 1) {
                    if (!msg.hasOwnProperty("pin")) {
                        node.warn("Write node - Setting \"pin mode\" to \"dynamic\" but no msg.pin found.");
                        return;
                    }
                    if(msg.pin<0 || msg.pin>127) {
                        node.warn("Write node - The msg.pin must be between 0 and 127.");
                        return;
                    }
                    pin = msg.pin;
                }
                node.serverConfig.virtualWrite(pin, payload);
            }
        });
    }
    RED.nodes.registerType("blynk-ws-out-write", BlynkOutWriteNode);

    function BlynkOutEmailNode(n) {
        RED.nodes.createNode(this, n);
        var node = this;
        this.server = n.client;
        this.email = n.email;

        this.serverConfig = RED.nodes.getNode(this.server);
        if (!this.serverConfig) {
            this.error(RED._("websocket.errors.missing-conf"));
        } else {
            // TODO: nls
            this.serverConfig.on('opened', function(n) {
                node.status({
                    fill: "yellow",
                    shape: "dot",
                    text: "connecting " + n
                });
            });
            this.serverConfig.on('connected', function(n) {
                node.status({
                    fill: "green",
                    shape: "dot",
                    text: "connected" + n
                });
            });
            this.serverConfig.on('erro', function() {
                node.status({
                    fill: "red",
                    shape: "ring",
                    text: "error"
                });
            });
            this.serverConfig.on('closed', function() {
                node.status({
                    fill: "red",
                    shape: "ring",
                    text: "disconnected"
                });
            });
        }
        this.on("input", function(msg) {
            if (msg.hasOwnProperty("payload") && node.serverConfig && node.serverConfig.logged) {
                var payload = Buffer.isBuffer(msg.payload) ? msg.payload : RED.util.ensureString(msg.payload);
                var subject = msg.topic ? msg.topic : payload;
                node.serverConfig.sendEmail(node.email, subject, payload);
            }
        });
    }
    RED.nodes.registerType("blynk-ws-out-email", BlynkOutEmailNode);

    function BlynkOutSetPropertyNode(n) {
        RED.nodes.createNode(this, n);
        var node = this;
        this.server = n.client;
        this.pin = n.pin;
        this.prop = n.prop;
        this.pinmode = n.pinmode; 
        
        if(this.pinmode == 1) 
            this.connected_label = "connected to dynamic pin";
        else
            this.connected_label = "connected to pin V" + this.pin;
        
        this.serverConfig = RED.nodes.getNode(this.server);
        if (!this.serverConfig) {
            this.error(RED._("websocket.errors.missing-conf"));
        } else {
            // TODO: nls
            this.serverConfig.on('opened', function(n) {
                node.status({
                    fill: "yellow",
                    shape: "dot",
                    text: "connecting " + n
                });
            });
            this.serverConfig.on('connected', function(n) {
                node.status({
                    fill: "green",
                    shape: "dot",
                    text: node.connected_label
                });
            });
            this.serverConfig.on('erro', function() {
                node.status({
                    fill: "red",
                    shape: "ring",
                    text: "error"
                });
            });
            this.serverConfig.on('closed', function() {
                node.status({
                    fill: "red",
                    shape: "ring",
                    text: "disconnected"
                });
            });
        }
        this.on("input", function(msg) {
            if (msg.hasOwnProperty("payload") && node.serverConfig && node.serverConfig.logged) {
                var payload = msg.payload; //dont check if is a string
                var subject = msg.topic ? msg.topic : payload;
                var prop = node.prop;
                var pin = node.pin;
                if(node.pinmode == 1) {
                    if (!msg.hasOwnProperty("pin")) {
                        node.warn("Set Property node - Setting \"pin mode\" to \"dynamic\" but no msg.pin found.");
                        return;
                    }
                    if(msg.pin<0 || msg.pin>127) {
                        node.warn("Set Property node - The msg.pin must be between 0 and 127.");
                        return;
                    }
                    pin = msg.pin;
                }
                
                if (msg.hasOwnProperty("prop") && node.serverConfig && node.serverConfig.logged) {
                    prop = Buffer.isBuffer(msg.prop) ? msg.prop : RED.util.ensureString(msg.prop);
                }
                if(prop!=='bycode'){ //single propery
                    if(prop == ''){
                        node.warn("Set Property node - Please select a property.");
                        return;
                    }
                    node.serverConfig.setProperty(pin, prop, payload); 
                }
                else { //multiple property
                    //all widget
                    if (msg.hasOwnProperty("label") && node.serverConfig && node.serverConfig.logged) {
                        var label = Buffer.isBuffer(msg.label) ? msg.label : RED.util.ensureString(msg.label);
                        node.serverConfig.setProperty(pin, 'label', label);
                    }
                    if (msg.hasOwnProperty("color") && node.serverConfig && node.serverConfig.logged) {
                        var color = Buffer.isBuffer(msg.color) ? msg.color : RED.util.ensureString(msg.color);
                        node.serverConfig.setProperty(pin, 'color', color);
                    }
                    if (msg.hasOwnProperty("min") && node.serverConfig && node.serverConfig.logged) {
                        var min = Buffer.isBuffer(msg.min) ? msg.min : RED.util.ensureString(msg.min);
                        node.serverConfig.setProperty(pin, 'min', min);
                    }
                    if (msg.hasOwnProperty("max") && node.serverConfig && node.serverConfig.logged) {
                        var max = Buffer.isBuffer(msg.max) ? msg.max : RED.util.ensureString(msg.max);
                        node.serverConfig.setProperty(pin, 'max', max);
                    }
                    //buttons
                    if ((msg.hasOwnProperty("onlabel") || msg.hasOwnProperty("offlabel")) && node.serverConfig && node.serverConfig.logged) {
                        if (msg.hasOwnProperty("onlabel")){
                            var onlabel = Buffer.isBuffer(msg.onlabel) ? msg.onlabel : RED.util.ensureString(msg.onlabel);
                            node.serverConfig.setProperty(pin, 'onLabel', onlabel);
                        }
                        if (msg.hasOwnProperty("offlabel")){
                            var offlabel = Buffer.isBuffer(msg.offlabel) ? msg.offlabel : RED.util.ensureString(msg.offlabel);
                            node.serverConfig.setProperty(pin, 'offLabel', offlabel);
                        }
                    }
                    //menu
                    else if (msg.hasOwnProperty("labels") && node.serverConfig && node.serverConfig.logged) {
                        node.serverConfig.setProperty(pin, 'labels', msg.labels);
                    }
                    //music player
                    else if (msg.hasOwnProperty("isOnPlay") && node.serverConfig && node.serverConfig.logged) {
                        var isonplay = false;
                        if (msg.isonplay) isonplay = true;
                        node.serverConfig.setProperty(pin, 'isonplay', isonplay);
                    }

                }
            }
        });
    }
    RED.nodes.registerType("blynk-ws-out-set-property", BlynkOutSetPropertyNode);

    /* LCD Widget*/
    function BlynkOutLCDNode(n) {
        RED.nodes.createNode(this, n);
        var node = this;
        this.server = n.client;
        this.pin = n.pin;

        this.serverConfig = RED.nodes.getNode(this.server);
        if (!this.serverConfig) {
            this.error(RED._("websocket.errors.missing-conf"));
        } else {
            // TODO: nls
            this.serverConfig.on('opened', function(n) {
                node.status({
                    fill: "yellow",
                    shape: "dot",
                    text: "connecting " + n
                });
            });
            this.serverConfig.on('connected', function(n) {
                node.status({
                    fill: "green",
                    shape: "dot",
                    text: "connected to pin V" + node.pin
                });
            });
            this.serverConfig.on('erro', function() {
                node.status({
                    fill: "red",
                    shape: "ring",
                    text: "error"
                });
            });
            this.serverConfig.on('closed', function() {
                node.status({
                    fill: "red",
                    shape: "ring",
                    text: "disconnected"
                });
            });
        }
        this.on("input", function(msg) {
            if (msg.hasOwnProperty("payload") && node.serverConfig && node.serverConfig.logged) {
                var payload = Buffer.isBuffer(msg.payload) ? msg.payload : RED.util.ensureString(msg.payload);
                var subject = msg.topic ? msg.topic : payload;
                if (msg.hasOwnProperty("clear") && msg.clear == true) {
                  node.serverConfig.virtualWrite(node.pin, 'clr');
                }
                if (msg.hasOwnProperty("text")) {
                  var text = Buffer.isBuffer(msg.text) ? msg.text : RED.util.ensureString(msg.text);
                  
                  var x=0;
                  if (msg.hasOwnProperty("x")) {
                      if(msg.x<0) x=0;
                      else if(msg.x>15) x=15;
                      else x=msg.x; 
                  }
                  
                  var y=0;
                  if (msg.hasOwnProperty("y")) {
                      if(msg.y<0) y=0;
                      else if(msg.y>1) y=1;
                      else y=msg.y;  
                  }
                  
                  var rawdata = ['p', x, y, text];
                  node.serverConfig.virtualWrite(node.pin, rawdata);
                }
                
                if (msg.hasOwnProperty("text1")) {
                  var text = Buffer.isBuffer(msg.text1) ? msg.text : RED.util.ensureString(msg.text1);
                  
                  var x=0;
                  if (msg.hasOwnProperty("x1")) {
                      if(msg.x1<0) x=0;
                      else if(msg.x1>15) x=15;
                      else x=msg.x1; 
                  }
                  
                  var y=1;
                  if (msg.hasOwnProperty("y1")) {
                      if(msg.y1<0) y=0;
                      else if(msg.y1>1) y=1;
                      else y=msg.y1;  
                  }
                  
                  var rawdata = ['p', x, y, text];
                  node.serverConfig.virtualWrite(node.pin, rawdata);
                }
                
                if(!msg.hasOwnProperty("text") && !msg.hasOwnProperty("text1") && !msg.hasOwnProperty("clear") && msg.hasOwnProperty("payload")){
                    var payload = Buffer.isBuffer(msg.payload) ? msg.payload : RED.util.ensureString(msg.payload);
                    if(payload != '' && payload.length > 1 ){
                        node.warn("## Blynk LCD node does not use the msg.payload property! ##   You must use the property msg.text or msg.text1 to write to the first or second line.");
                    }
                }
            }
        });
    }
    RED.nodes.registerType("blynk-ws-out-lcd", BlynkOutLCDNode);    
    
    function BlynkOutNotifyNode(n) {
        RED.nodes.createNode(this, n);
        
        this.server = n.client;
        this.queue = n.queue;
        this.rate = 1000 * (n.rate > 0 ? n.rate : 1);
        this.buffer = [];
        this.intervalID = -1;
        
        
        
        var node = this;
        //node.log(this);

        this.serverConfig = RED.nodes.getNode(this.server);
        if (!this.serverConfig) {
            this.error(RED._("websocket.errors.missing-conf"));
        } else {
            // TODO: nls
            this.log("Register notify node" + " - on client: " + this.serverConfig.name);
            
            this.serverConfig.on('opened', function(n) {
                node.status({
                    fill: "yellow",
                    shape: "dot",
                    text: "connecting " + n
                });
            });
            this.serverConfig.on('connected', function(n) {
                var queuestr = "";
                if (node.queue) {
                  queuestr = " - queue: 0";
                }
                node.status({
                    fill: "green",
                    shape: "dot",
                    text: "connected" + queuestr
                });
            });
            this.serverConfig.on('erro', function() {
                node.status({
                    fill: "red",
                    shape: "ring",
                    text: "error"
                });
            });
            this.serverConfig.on('closed', function() {
                node.status({
                    fill: "red",
                    shape: "ring",
                    text: "disconnected"
                });
            });
        }
        this.on("input", function(msg) {
            
            node.reportDepth = function() {
                if (!node.busy) {
                    node.busy = setTimeout(function() {
                        if (node.buffer.length > 0) {
                            node.status({ 
                                fill:  "green",
                                shape: "dot",
                                text:  "connected - queue: " + node.buffer.length,
                            });
                        } else {
                            node.status({
                                fill:  "green",
                                shape: "dot",
                                text:  "connected - queue: 0", 
                            });
                        }
                        node.busy = null;
                    },500);
                }
            };
            if (node.queue) {
                node.log("queue");
                if ( node.intervalID !== -1) {
                    node.buffer.push(msg);
                    node.reportDepth();
                }
                else {
                    //node.send(msg);
                    if (msg.hasOwnProperty("payload") && node.serverConfig && node.serverConfig.logged) {
                        var payload = Buffer.isBuffer(msg.payload) ? msg.payload : RED.util.ensureString(msg.payload);
                        node.serverConfig.sendNotify(payload);
                    }
                    node.reportDepth();

                    node.intervalID = setInterval(function() {
                        if (node.buffer.length === 0) {
                            clearInterval(node.intervalID);
                            node.intervalID = -1;
                        }
                        if (node.buffer.length > 0) {
                            //node.send(node.buffer.shift());
                            var tempmsg = node.buffer.shift()
                            if (tempmsg.hasOwnProperty("payload") && node.serverConfig && node.serverConfig.logged) {
                                var payload = Buffer.isBuffer(tempmsg.payload) ? tempmsg.payload : RED.util.ensureString(tempmsg.payload);
                                node.serverConfig.sendNotify(payload);
                            }
                        }
                        node.reportDepth();
                    },node.rate);
                }               
                
            }
            else if (msg.hasOwnProperty("payload") && node.serverConfig && node.serverConfig.logged) {
                var payload = Buffer.isBuffer(msg.payload) ? msg.payload : RED.util.ensureString(msg.payload);
                node.serverConfig.sendNotify(payload);
            }
        });
        this.on("close", function() {
                clearInterval(node.intervalID);
                clearTimeout(node.busy);
                node.buffer = [];
                node.status({});
        });
    }
    RED.nodes.registerType("blynk-ws-out-notify", BlynkOutNotifyNode);
    
    /* Table Widget*/
    function BlynkOutTableNode(n) {
        RED.nodes.createNode(this, n);
        var node = this;
        this.server = n.client;
        this.pin = n.pin;
        
        this.rowIdx = 0;

        this.serverConfig = RED.nodes.getNode(this.server);
        if (!this.serverConfig) {
            this.error(RED._("websocket.errors.missing-conf"));
        } else {
            // TODO: nls
            this.serverConfig.on('opened', function(n) {
                node.status({
                    fill: "yellow",
                    shape: "dot",
                    text: "connecting " + n
                });
            });
            this.serverConfig.on('connected', function(n) {
                node.status({
                    fill: "green",
                    shape: "dot",
                    text: "connected to pin V" + node.pin
                });
            });
            this.serverConfig.on('erro', function() {
                node.status({
                    fill: "red",
                    shape: "ring",
                    text: "error"
                });
            });
            this.serverConfig.on('closed', function() {
                node.status({
                    fill: "red",
                    shape: "ring",
                    text: "disconnected"
                });
            });
        }
        this.on("input", function(msg) {
            if (msg.hasOwnProperty("payload") && node.serverConfig && node.serverConfig.logged) {
                var payload = Buffer.isBuffer(msg.payload) ? msg.payload : RED.util.ensureString(msg.payload);
                var subject = msg.topic ? msg.topic : payload;
                if (msg.hasOwnProperty("clear") && msg.clear == true) {
                  node.serverConfig.virtualWrite(node.pin, 'clr');
                }
                if (msg.hasOwnProperty("add")) {
                  var args = Array.isArray(msg.add) ? msg.add : ['',''];
                  var cmd = ['add', this.rowIdx];
                  this.rowIdx++;
                  node.serverConfig.virtualWrite(node.pin, cmd.concat(args));
                }
                if (msg.hasOwnProperty("loadtable")) {
                  var arrargs = Array.isArray(msg.loadtable) ? msg.loadtable : [];
                  for(var i=0; i<arrargs.length; i++) {
                        if(Array.isArray(arrargs[i])) { //array name : key
                            var cmd = ['add', this.rowIdx];
                            this.rowIdx++;
                            node.serverConfig.virtualWrite(node.pin, cmd.concat(arrargs[i]));
                        }
                        else{ //array  name
                            var cmd = ['add', this.rowIdx];
                            this.rowIdx++;
                            node.serverConfig.virtualWrite(node.pin, cmd.concat(arrargs[i],' '));
                        }
                    }
                }
                if (msg.hasOwnProperty("update")) {
                  var args = Array.isArray(msg.update) ? msg.update : ['',' ',' '];
                    if(args.length<=2) args.concat(' ');
                    var cmd = ['update'];
                  node.serverConfig.virtualWrite(node.pin, cmd.concat(args));
                }
                
                if (msg.hasOwnProperty("pick")) {
                  if(Number.isInteger(msg.pick) && msg.pick>=0) {
                        node.serverConfig.virtualWrite(node.pin, ['pick', msg.pick.toString()]);
                    }
                }
            }
        });
    }
    RED.nodes.registerType("blynk-ws-out-table", BlynkOutTableNode);


};
