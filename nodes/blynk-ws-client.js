module.exports = function(RED) {
	"use strict";

	

	var ws = require("ws");

	var LIBRARY_INFO = "0.7.0 2018-07-30"; //node-red lib version

    
	//blynk util
	var blynkUtil = require('./../libs/blynk-util.js');

	//blynk lib
	var blynkLib = require('./../libs/blynk-lib.js');

	function getTimestamp(){
		return parseInt((new Date).getTime()/1000);	
	}

	// A node red node that setup a websocket to server
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
		this.dbg_sync = n.dbg_sync;
		this.dbg_bridge = n.dbg_bridge;
		this.dbg_pins = n.dbg_pins;
		this.multi_cmd = n.multi_cmd;
		this.proxy_type = n.proxy_type;
		this.proxy_url = n.proxy_url;

		this.log_pins = [];
		if (typeof this.dbg_pins === "string" ) {
			var tmp_pins = this.dbg_pins.split(",");
			for(var i=0; i<tmp_pins.length; i++) { 
				tmp_pins[i] = +tmp_pins[i]; 
				if(Number.isInteger(tmp_pins[i]) && Number.parseInt(tmp_pins[i])>=0 && Number.parseInt(tmp_pins[i])<=127) {
					this.log_pins.push(tmp_pins[i].toString());
				}
			} 
		}

		this._inputNodes = []; // collection of nodes that want to receive events
		this.closing = false;
		this.logged = false;
		this.msg_id = 1;

		this.LIBRARY_INFO = LIBRARY_INFO;
		this.RED = RED;

		//heartbit
		this.last_activity_in  = 0;
		this.last_activity_out = 0;
		this.last_heart_beat   = 0;
		


		this.setMaxListeners(100);

		this.pinger = setInterval(function() {
			//only ping if connected and working
			if (node.logged) {
				//var t = getTimestamp();
				//if( t - node.last_heart_beat   > BLYNK_HEARTBEAT ) {
				node.ping();
			//	}
			//	else{
			//		if (node.dbg_low) {
			//		node.log("no " + t + " - "+node.last_heart_beat+" "+node.last_activity_in+" "+node.last_activity_out);
			//		}
			//	}
			}
		}, blynkLib.BLYNK_HEARTBEAT * 1000);

		this.closing = false;
		this.msgList = {};
		var node = this;
		
		node.log("LOG PINS " + JSON.stringify(this.log_pins));

		function startconn() { // Connect to remote endpoint
			//should not start connection if no server or key
			node.logged = false;
			var ws_args = {};
			var ws_log_secure = "";
			if (node.path.startsWith("wss://")) {
				ws_args = {
					rejectUnauthorized: false,
					//ecdhCurve: "auto", //not work < 8.6.0
				};
				//check if node >= 8.6.0 and apply curve parameter for ssl 
				var compVer = require("compare-versions");
				if(compVer(process.version, "8.6.4")>=0){
					ws_args.ecdhCurve = "auto";
				}
				ws_log_secure = "secure ";
			}

			var proxy = "";
			if(node.proxy_type == "system") { 
				proxy = process.env.http_proxy || "";
				if (proxy != "") proxy = "http://" + proxy;
			}
			if(node.proxy_type == "custom") proxy = node.proxy_url || "";
			if(node.proxy_type != undefined && node.proxy_type != "no" && node.proxy != "") {
				node.log("Using proxy server " + proxy);
				var url = require("url");
				var HttpsProxyAgent = require("https-proxy-agent");
				var options = url.parse(proxy);
				var agent = new HttpsProxyAgent(options);
				ws_args.agent = agent;
			}
			node.log(RED._("Start "+ws_log_secure+"connection: ") + node.path);
			var websocket = new ws(node.path, ws_args);
			node.websocket = websocket; // keep for closing
			websocket.setMaxListeners(100);

			node.last_heart_beat = node.last_activity_in = node.last_activity_out = getTimestamp();
			//node.log(node.last_heart_beat+" "+node.last_activity_in+" "+node.last_activity_out);

			websocket.on("open", function() {
				node.login(node.key);
			});

			websocket.on("close", function() {
				node.log(RED._("Connection closed: ") + node.path);
				node.emit("closed");
				node.logged = false;
				if (!node.closing) {
					clearTimeout(node.tout);
					node.tout = setTimeout(function() {
						startconn();
					}, 5000); // try to reconnect every 5 secs... bit fast ?
				}
			});

			websocket.on("message", function (data, flags) {
				data = data.toString("binary"); //convert to string
				if(data.length > blynkLib.BLYNK_PROTOCOL_MAX_LENGTH){
					node.warn(RED._("Message too long: "+data.length+"bytes"));
					node.sendRspIllegalCmd(node.msg_id);
					return;	
				}
				var msgcount = 0;

				if (node.dbg_low) {
					node.log("RECV <- " + blynkUtil.messageToDebugString(data));
				}
				while(data.length>0) {
					msgcount++;
					if(msgcount > blynkLib.BLYNK_MAX_CMD_IN_MESSAGE) {
						node.warn(RED._("Too Blynk commands in a single message: "+msgcount));
						node.sendRspIllegalCmd(node.msg_id);
						break;
					}
					
					var cmd = blynkUtil.decodeCommand(data);
					data=data.substr(cmd.msgLength); //remove current message from data

					node.processCommand(cmd);
				} //process message
			});

			websocket.on("error", function(err) {
				node.error(RED._("Websocket error: ") + err);
				node.emit("error");
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
			node.websocket.close();
			if (node.tout) {
				clearTimeout(node.tout);
			}
		});

		startconn(); // start outbound connection

	}

	RED.nodes.registerType("blynk-ws-client", BlynkClientNode);

	BlynkClientNode.prototype.registerInputNode = function (handler) {
		var pinlog = "";
		if(handler.pin != undefined) {
			pinlog = " pin: " + handler.pin;
		}
		this.log("Register input node" + " - type: " + handler.nodeType + pinlog);
		this._inputNodes.push(handler);
	};

	BlynkClientNode.prototype.removeInputNode = function (handler) {
		var pinlog = "";
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

	BlynkClientNode.prototype.registerGenericNode = function (handler, name) {
		var pinlog = "";
		var nodeType = "";
		if(handler.pin != undefined) {
			pinlog = " pin: " + handler.pin;
		}
		if(handler.nodeType != undefined) {
			nodeType = " type: " + handler.nodeType;
		}
		this.log("Register "+name+" node" + nodeType + pinlog);

	};
	
	/* check is pin need to be logged */
	BlynkClientNode.prototype.isLogPin = function (pin) {
		return this.log_pins.indexOf(pin) > -1 ? true : false;
	};

	/* build a blynk command */
	BlynkClientNode.prototype.blynkCmd = blynkLib.blynkCmd;
	
	/* send a response message */
	BlynkClientNode.prototype.sendRsp =  blynkLib.sendRsp;

	/* send binary message througth websocket */
	BlynkClientNode.prototype.sendMsg = blynkLib.sendMsg;

	/* Send multiple command message - delete key */
	BlynkClientNode.prototype.sendMsgMulti = blynkLib.sendMsgMulti;

	/* Start multiple command message - generate key */
	BlynkClientNode.prototype.startMsgMulti = blynkLib.startMsgMulti;

	/* process received Command */
	BlynkClientNode.prototype.processCommand = blynkLib.processCommand;
	
	/* send login message */
	BlynkClientNode.prototype.login = blynkLib.login; 

	/* send Illegal command response message */
	BlynkClientNode.prototype.sendRspIllegalCmd = blynkLib.sendRspIllegalCmd; 

	/* send ping message */
	BlynkClientNode.prototype.ping = blynkLib.ping;

	/* send info message */
	BlynkClientNode.prototype.sendInfo = blynkLib.sendInfo;

	/* send syncAll message */
	BlynkClientNode.prototype.syncAll = blynkLib.ping;

	/* send syncVirtual message */
	BlynkClientNode.prototype.syncVirtual = blynkLib.syncVirtual;

	/* send virtualWrite message */
	BlynkClientNode.prototype.virtualWrite = blynkLib.virtualWrite;
	
	/* send setProperty message - set msgkey form multimple command message*/
	BlynkClientNode.prototype.setProperty = blynkLib.setProperty;

	/* send mail message */
	BlynkClientNode.prototype.sendEmail = blynkLib.sendEmail;

	/* send notify message */
	BlynkClientNode.prototype.sendNotify = blynkLib.sendNotify;

	/* send bridgeSetAuthToken message */
	BlynkClientNode.prototype.bridgeSetAuthToken = blynkLib.bridgeSetAuthToken;

	/* send bridgeVirtualWrite message */
	BlynkClientNode.prototype.bridgeVirtualWrite = blynkLib.bridgeVirtualWrite;

	/* send bridgeAnalogWrite message */
	BlynkClientNode.prototype.bridgeAnalogWrite = blynkLib.bridgeAnalogWrite;

	/* send bridgeDigitalWrite message */
	BlynkClientNode.prototype.bridgeDigitalWrite = blynkLib.bridgeDigitalWrite;

	BlynkClientNode.prototype.handleWriteEvent = function(command) {
		if(this.dbg_all || this.dbg_write || this.isLogPin(command.pin)){
			this.log("writeEvent: -> cmd " + JSON.stringify(command));
		}
		//const util = require('util');
		for (var i = 0; i < this._inputNodes.length; i++) {
			//this.log(util.inspect(this._inputNodes[i], false, 1))
			if ((this._inputNodes[i].nodeType == "write" || this._inputNodes[i].nodeType == "zergba" || 
			     this._inputNodes[i].nodeType == "style-btn") && 
			(this._inputNodes[i].pin == command.pin || this._inputNodes[i].pin_all ) ) {
				var msg;

				switch (this._inputNodes[i].nodeType){
					case 'write':
					case 'style-btn':

						msg = {
							payload: command.value,
							pin: command.pin,
						};

						if (command.array) {
							msg.arrayOfValues = command.array;
						}
						break;
					case 'zergba':

						msg = {
							payload: command.value,
							pin: command.pin,
						};

						if (Array.isArray(command.array) && command.array.length == 3) {

							msg.hex = blynkUtil.rgbToHex(parseInt(command.array[0]), parseInt(command.array[1]), parseInt(command.array[2]));
							var color = blynkUtil.hexToRgb(msg.hex);
							msg.r = color.r;
							msg.g = color.g;
							msg.b = color.b;
							msg.rgb = color.r+";"+color.g+";"+color.b;
							msg.payload = [color.r, color.g, color.b];

							this._inputNodes[i].status({
								fill: "green",
								shape: "dot",
								text: this._inputNodes[i].connected_label + " ["+color.r+", "+color.g+", "+color.b+"]",
							});
						}
						else {
							this.warn(RED._("blynk-ws-client.warn.zergba"));
						}
						break;

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
			if (this._inputNodes[i].nodeType == "read"  && (this._inputNodes[i].pin == command.pin || this._inputNodes[i].pin_all ) ) {
				var msg;
                    
				msg = {
					payload: command.pin
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
			if (this._inputNodes[i].nodeType == "app") {
				var msg;

				msg = {
					payload: command
				};

				this._inputNodes[i].send(msg);
			}
		}
	};
};