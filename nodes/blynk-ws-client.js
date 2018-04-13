module.exports = function(RED) {
	"use strict";

	var ws = require("ws");
	var srs = require("secure-random-string");

	var LIBRARY_INFO = "0.5.0 2018-04-14";

	/* ##### BLYNK STUFF ###### */

	//library 0.4.7 - 2017-04-09
	//library 0.5.1 - 2018-02-20
	//library 0.5.2 - 2018-03-04
	//server 0.23.5 - 2017-04-07
	//server 0.32.2 - 2018-02-28
	//server 0.34.0 - 2018-04-06
    
	var BLYNK_VERSION = "0.5.2"; //blynk library version
	var BLYNK_HEARTBEAT = 10; //seconds
	var BLYNK_PROTOCOL_MAX_LENGTH = 32767; //java Short.MAX_VALUE
	var BLYNK_MAX_CMD_IN_MESSAGE = 1024; //max command in a single message 


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
		
		CREATE_APP 					: 55,
		UPDATE_APP 					: 56,
		DELETE_APP 					: 57,
		GET_PROJECT_BY_TOKEN 		: 58,
		EMAIL_QR 					: 59,
		GET_ENHANCED_GRAPH_DATA 	: 60,
		DELETE_ENHANCED_GRAPH_DATA 	: 61,

		GET_CLONE_CODE 				: 62,
		GET_PROJECT_BY_CLONE_CODE 	: 63,

		HARDWARE_LOG_EVENT 			: 64,
		HARDWARE_RESEND_FROM_BLUETOOTH : 65,
		LOGOUT 						: 66,

		CREATE_TILE_TEMPLATE : 67,
		UPDATE_TILE_TEMPLATE : 68,
		DELETE_TILE_TEMPLATE : 69,
		GET_WIDGET			 : 70,
		DEVICE_OFFLINE 		 : 71,
		OUTDATED_APP_NOTIFICATION : 72,

		/*
		//http codes. Used only for stats
		HTTP_IS_HARDWARE_CONNECTED 	: 82,
		HTTP_IS_APP_CONNECTED 		: 83,
		HTTP_GET_PIN_DATA 			: 84,
		HTTP_UPDATE_PIN_DATA 		: 85,
		HTTP_NOTIFY	 				: 86,
		HTTP_EMAIL 					: 87,
		HTTP_GET_PROJECT 			: 88,
		HTTP_QR 					: 89,
		HTTP_GET_HISTORY_DATA 		: 90,
		HTTP_START_OTA 				: 91,
		HTTP_STOP_OTA 				: 92,
		HTTP_CLONE 					: 93,
		HTTP_TOTAL 					: 94,
		*/
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
		NOTIFICATION_INVALID_BODY 	: 13,
		NOTIFICATION_NOT_AUTHORIZED : 14,
		NOTIFICATION_ERROR 			: 15,
		//reserved
		BLYNK_TIMEOUT               : 16,
		NO_DATA_EXCEPTION           : 17,
		//DEVICE_WENT_OFFLINE       : 18, //removed
		SERVER_EXCEPTION            : 19,
		//NOT_SUPPORTED_VERSION       : 20, //removed
		ENERGY_LIMIT                  : 21,
		FACEBOOK_USER_LOGIN_WITH_PASS : 22,
	};

	/* return a full decoded message for debug */
	function messageToDebugString(data) {
		var msgCount = 0;
		var dbgStr= "";

		while(data.length>0) {
			msgCount++;
			var cmd = decodeCommand(data);
			data=data.substr(cmd.msgLength); //remove current message from data
			if(msgCount>1)  dbgStr = dbgStr + "\n" + commandToDebugString(cmd);
			else dbgStr = commandToDebugString(cmd);
		}
		if(msgCount>1) return "Multiple Command, num: "+msgCount + "\n"+ dbgStr;
		else return dbgStr;
	}

	/* return a decoded command for debug */
	function commandToDebugString(cmd) {
		var dbgStr= "";
		if (cmd.type !== MsgType.RSP ) {
			var logdata = cmd.body;
			if (cmd.type === MsgType.LOGIN) logdata = String("********************************" + cmd.body.slice(-5)).slice(-32);
			if (cmd.type === MsgType.BRIDGE) {
				var values = cmd.body.split("\0");
				if(values.length == 3 && values[1] == "i") {
					logdata = values[0]+"\0"+values[1]+"\0"+String("********************************" + values[2].slice(-5)).slice(-32);
				}
			}
			dbgStr="Cmd: " + cmd.typeString + ", Id: " + cmd.msgId + ", len: " + cmd.len + ", data: " + JSON.stringify(logdata.replace(new RegExp("\u0000", "g"),"|"));
		}
		else {
			dbgStr="Cmd: " + cmd.typeString + ", Id: " + cmd.msgId + ", responseCode: " + getStatusByCode(cmd.len);
		}
		return dbgStr;
	}
	
	/* decode a single blynk command */
	function decodeCommand(data) {
		var cmd = {};

		cmd.type = data.charCodeAt(0);
		cmd.typeString = getCommandByCode(cmd.type);
		cmd.msgId = data.charCodeAt(1) << 8 | data.charCodeAt(2);
		cmd.len = data.charCodeAt(3) << 8 | data.charCodeAt(4);
		cmd.msgLength = 5;

		switch(cmd.type) {
		case MsgType.HW:
		case MsgType.BRIDGE:
			cmd.body = data.substr(5, cmd.len);
			cmd.msgLength = cmd.msgLength + cmd.len;

			if (cmd.body !== "") {
				var values = cmd.body.split("\0");
				if (values.length > 1) {
					cmd.operation = values[0];
					cmd.pin = values[1];
					if (values.length > 2) {
						cmd.value = values[2];
						//we have an array of cmds, return array as well
						cmd.array = values.slice(2, values.length);
					}
				}
				else if (values.length == 1)  { ///handle "pm" single message
					cmd.operation = values[0];
				}
			}
			break;
		case MsgType.RSP:
			cmd.status = data.charCodeAt(3) << 8 | data.charCodeAt(4);
			break;
		default:
			cmd.body = data.substr(5, cmd.len);
			cmd.msgLength = cmd.msgLength + cmd.len;
			break;
		}

		return cmd;
	}
	
	/* build a blynk header */
	function blynkHeader(msg_type, msg_id, msg_len) {
		return String.fromCharCode(
			msg_type,
			msg_id  >> 8, msg_id  & 0xFF,
			msg_len >> 8, msg_len & 0xFF
		);
	}

	function getKeyByValue(obj, value) {
		//return Object.keys(obj).find(key => obj[key] === value); //javascript ES6 only
		return Object.keys(obj).filter(function(key) {return obj[key] === value;})[0];
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
	/* ##### END BLYNK STUFF ###### */

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

		//heartbit
		this.last_activity_in  = 0;
		this.last_activity_out = 0;
		this.last_heart_beat   = 0;
		
		//iniziate SRS
		srs({length: 16, alphanumeric: true});

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
		}, BLYNK_HEARTBEAT * 1000);

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
				if(data.length > BLYNK_PROTOCOL_MAX_LENGTH){
					node.warn(RED._("Message too long: "+data.length+"bytes"));
					node.sendRsp(MsgType.RSP, node.msg_id, MsgStatus.ILLEGAL_COMMAND);
					return;	
				}
				var msgcount = 0;

				if (node.dbg_low) {
					node.log("RECV <- " + messageToDebugString(data));
				}
				while(data.length>0) {
					msgcount++;
					if(msgcount>BLYNK_MAX_CMD_IN_MESSAGE) {
						node.warn(RED._("Too Blynk commands in a single message: "+msgcount));
						node.sendRsp(MsgType.RSP, node.msg_id, MsgStatus.ILLEGAL_COMMAND);
						break;
					}
					
					var cmd = decodeCommand(data);
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

	/* process received Command */
	BlynkClientNode.prototype.processCommand = function (cmd) {

		if (!this.logged) {
			if (cmd.type === MsgType.RSP && cmd.msgId === 1) {
				if (cmd.len === MsgStatus.OK || cmd.len === MsgStatus.ALREADY_REGISTERED) {
					this.log("Client logged");
					this.logged = true;
					this.sendInfo();
					this.emit("connected", "");
				}
				else if(cmd.len === MsgStatus.BLYNK_INVALID_TOKEN) {
					this.log("Invalid auth token");
				}
				else if(cmd.len === MsgStatus.NOT_AUTHENTICATED) {
					this.log("Not autenticated");
				}
				else {
					this.log("Connect failed. code: "+cmd.len);
				}
			}
			if(cmd.type === MsgType.RSP && cmd.len === MsgStatus.NOT_AUTHENTICATED) {
				this.log("Not autenticated");
			}
			if(cmd.type === MsgType.CONNECT_REDIRECT) {
				//handle server redirect 
				var schema = "ws://";
				var port = 80;
				if (this.path.startsWith("wss://")) {
					schema = "wss://";
					port = 443;
				}
				var values = cmd.body.split("\0");
				var serverip = values[0];
				if(values[1]>0) port = values[1];
				var newpath = schema + serverip + ":" + port + "/websockets";
				this.path = newpath; 
				this.warn(RED._("Connection redirecting to:  ") + newpath);
			}
		} else { //
			this.last_activity_in = getTimestamp();
			switch (cmd.type) {
			case MsgType.RSP:
				if (cmd.status !== MsgStatus.OK) { //handle not ok response message
					var error=false;
					for (var k in MsgStatus) {
						if (MsgStatus.hasOwnProperty(k)) {
							if(cmd.status == MsgStatus[k]) error=true;
						}
					}
					if(error) {
						switch(cmd.status){
							case MsgStatus.NOT_AUTHENTICATED: 
								this.log("Not autenticated");
								break;
							case MsgStatus.BLYNK_INVALID_TOKEN: 
								this.log("Invalid auth token");
								break;
							case MsgStatus.ILLEGAL_COMMAND_BODY: 
								//this.log("Illegal command body");
								break;	
						}
					}
					else {
						this.warn(RED._("Unhandled RSP type: ") + commandToDebugString(cmd));
					}
				}
				break;
			case MsgType.LOGIN:
			case MsgType.PING:
				this.sendRsp(MsgType.RSP, this.msg_id, MsgStatus.OK);
				break;
			case MsgType.HW:
			case MsgType.BRIDGE:
				//this.warn(RED._(cmd.typeString+" cmd: ") + JSON.stringify(cmd));
				switch (cmd.operation) {
				//input nodes
				case "vw":
					this.handleWriteEvent(cmd);
					break;
				case "vr":
					this.handleReadEvent(cmd);
					break;
				case "pm":
				// skip message "pin mode"
					break;
				default:
					this.warn(RED._("Invalid "+cmd.typeString+" cmd: ") + commandToDebugString(cmd));
					this.sendRsp(MsgType.RSP, this.msg_id, MsgStatus.ILLEGAL_COMMAND);
				}
				break;
			
			case MsgType.INTERNAL:
				switch (cmd.body) {
				//app event node
				case "acon":
				case "adis":
					this.handleAppEvent(cmd.body);
					break;
				default:
					this.warn(RED._("Invalid INTERNAL cmd: ") + commandToDebugString(cmd));
					//this.sendRsp(MsgType.RSP, this.msg_id, MsgStatus.ILLEGAL_COMMAND);
				}
				break;
			case MsgType.GET_TOKEN:
				this.sendRsp(MsgType.GET_TOKEN, this.msg_id, this.key.length, this.key);
				break;
			case MsgType.LOAD_PROF:
				//this.sendRsp(MsgType.LOAD_PROF, this.msg_id, profile.length, self.profile);
				break;
			case MsgType.DEBUG_PRINT:
				this.log("Server: " + cmd.body);
				break;
			case MsgType.REGISTER:
			case MsgType.SAVE_PROF:
			case MsgType.ACTIVATE:
			case MsgType.DEACTIVATE:
			case MsgType.REFRESH:
			// skip this message types
				break;
			default:
				this.warn(RED._("Invalid header type: ") + commandToDebugString(cmd));
				this.sendRsp(MsgType.RSP, this.msg_id, MsgStatus.ILLEGAL_COMMAND);
			}
		}
	};

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
	
	/* check is pin need to be logged */
	BlynkClientNode.prototype.isLogPin = function (pin) {
		return this.log_pins.indexOf(pin) > -1 ? true : false;
	};

	/* build a blynk command */
	BlynkClientNode.prototype.blynkCmd = function (msg_type, values, msg_id) {
		var self = this;
		values = values || [""];
		if (msg_type === MsgType.RSP) {
			return blynkHeader(msg_type, (msg_id-1), values);
		}
		else {
			msg_id = msg_id || (self.msg_id++);
			if( typeof values === "string" || typeof values === "number" ) {
				values = [ values ];
			}
		
			var data = values.join("\0");
			return blynkHeader(msg_type, msg_id, data.length) + data;
		}
	};
	
	/* send a response message */
	BlynkClientNode.prototype.sendRsp = function (msg_type, msg_id, msg_len, msg_data) {
		var data = msg_data || "";
		var msg = null;
		if (msg_type === MsgType.RSP) {
			msg = this.blynkCmd(msg_type, msg_len, msg_id);
		}
		else {
			msg = this.blynkCmd(msg_type, data, msg_id);
		}

		this.sendMsg(msg);
	};

	/* send binary message througth websocket */
	BlynkClientNode.prototype.sendMsg = function (data) {
		if (this.dbg_low) {
			this.log("SEND -> " + messageToDebugString(data));
		}

		//convert to Uint8Array
		var rawdata = new Uint8Array(data.length);
		for (var i = 0, j = data.length; i < j; ++i) {
			rawdata[i] = data.charCodeAt(i);
		}
		this.last_activity_out = this.last_heart_beat = getTimestamp();
		this.websocket.send(rawdata);
	};

	/* Send multiple command message - delete key */
	BlynkClientNode.prototype.sendMsgMulti = function (key) {
		this.sendMsg(this.msgList[key]);
		delete this.msgList[key]; //unset key
	};

	/* Start multiple command message - generate key */
	BlynkClientNode.prototype.startMsgMulti = function () {
		var key = srs({length: 16, alphanumeric: true});
		this.msgList[key] = "";
		return key;
	};

	/* send login message */
	BlynkClientNode.prototype.login = function(token) {
		if(this.dbg_all){
			this.log("login -> " + String("********************************" + token.slice(-5)).slice(-32));
		}
		this.sendMsg(this.blynkCmd(MsgType.LOGIN, token, 1));
	};

	/* send ping message */
	BlynkClientNode.prototype.ping = function() {
		if(this.dbg_all || this.dbg_read){
			this.log("ping");
		}
		this.last_heart_beat = getTimestamp();
		this.sendMsg(this.blynkCmd(MsgType.PING));
	};

	/* send info message */
	BlynkClientNode.prototype.sendInfo = function () {
		var info = [
			"ver", BLYNK_VERSION, 
			"h-beat", BLYNK_HEARTBEAT, 
			"buff-in", BLYNK_PROTOCOL_MAX_LENGTH, 
			"dev", "node-red", 
			"con", "Blynk-ws",
			"build", LIBRARY_INFO,
		];
		this.msg_id++;
		this.sendMsg(this.blynkCmd(MsgType.INTERNAL, info));
	};

	/* send syncAll message */
	BlynkClientNode.prototype.syncAll = function(msgkey) {
		if(this.dbg_all || this.dbg_sync){
			this.log("syncAll: -> all");
		}
		var msg = this.blynkCmd(MsgType.HW_SYNC);
		if(this.multi_cmd && msgkey != undefined) 
			this.msgList[msgkey] = this.msgList[msgkey] + msg;
		else this.sendMsg(msg);
	};


	/* send syncVirtual message */
	BlynkClientNode.prototype.syncVirtual = function(vpin, msgkey) {
		if(this.dbg_all || this.dbg_sync || this.isLogPin(vpin)){
			this.log("syncVirtual: -> " + JSON.stringify(["vr", vpin]));
		}
		var msg = this.blynkCmd(MsgType.HW_SYNC , ["vr", vpin]);
		if(this.multi_cmd && msgkey != undefined) 
			this.msgList[msgkey] = this.msgList[msgkey] + msg;
		else this.sendMsg(msg);
	};

	/* send virtualWrite message */
	BlynkClientNode.prototype.virtualWrite = function(vpin, val, msgkey) {
		if(this.dbg_all || this.dbg_write || this.isLogPin(vpin)){
			this.log("virtualWrite: -> " + JSON.stringify(["vw", vpin].concat(val)));
		}
		var msg = this.blynkCmd(MsgType.HW, ["vw", vpin].concat(val));
		if(this.multi_cmd && msgkey != undefined) 
			this.msgList[msgkey] = this.msgList[msgkey] + msg;
		else this.sendMsg(msg);
	};
	
	/* send setProperty message - set msgkey form multimple command message*/
	BlynkClientNode.prototype.setProperty = function(vpin, prop, val, msgkey) {
		if(this.dbg_all  || this.dbg_prop || this.isLogPin(vpin)){
			this.log("setProperty -> " + JSON.stringify([vpin, prop].concat(val)));
		}
		var msg = this.blynkCmd(MsgType.PROPERTY, [vpin, prop].concat(val));
		if(this.multi_cmd && msgkey != undefined) 
			this.msgList[msgkey] = this.msgList[msgkey] + msg;
		else this.sendMsg(msg);
	};

	BlynkClientNode.prototype.sendEmail = function(to, subject, message) {
		if(this.dbg_all || this.dbg_mail){
			this.log("sendEmail -> " + JSON.stringify([to, subject, message]));
		}
		this.sendMsg(this.blynkCmd(MsgType.EMAIL, [to, subject, message]));
	};
    
	BlynkClientNode.prototype.sendNotify = function(message) {
		if(this.dbg_all || this.dbg_notify){
			this.log("sendNotify -> " + JSON.stringify([message]));
		}
		this.sendMsg(this.blynkCmd(MsgType.NOTIFY, [message]));
	};

	/* send bridgeSetAuthToken message */
	BlynkClientNode.prototype.bridgeSetAuthToken = function(bpin, token) {
		if(this.dbg_all || this.dbg_bridge || this.isLogPin(bpin)){
			var logtoken = String("********************************" + token.slice(-5)).slice(-32);
			this.log("bridgeSetAuthToken: -> " + JSON.stringify([bpin, "i", logtoken]));
		}
		var msg = this.blynkCmd(MsgType.BRIDGE, [bpin, "i", token]);
		this.sendMsg(msg);
	};

	/* send bridgeVirtualWrite message */
	BlynkClientNode.prototype.bridgeVirtualWrite = function(bpin, pin, val) {
		if(this.dbg_all || this.dbg_bridge || this.isLogPin(bpin)){
			this.log("bridgeVirtualWrite: -> " + JSON.stringify([bpin, "vw", pin].concat(val)));
		}
		var msg = this.blynkCmd(MsgType.BRIDGE, [bpin, "vw", pin].concat(val));
		this.sendMsg(msg);
	};

	/* send bridgeAnalogWrite message */
	BlynkClientNode.prototype.bridgeAnalogWrite = function(bpin, pin, val) {
		if(this.dbg_all || this.dbg_bridge || this.isLogPin(bpin)){
			this.log("bridgeAnalogWrite: -> " + JSON.stringify([bpin, "aw", pin].concat(val)));
		}
		var msg = this.blynkCmd(MsgType.BRIDGE, [bpin, "aw", pin].concat(val));
		this.sendMsg(msg);
	};

	/* send bridgeDigitalWrite message */
	BlynkClientNode.prototype.bridgeDigitalWrite = function(bpin, pin, val) {
		if(this.dbg_all || this.dbg_bridge || this.isLogPin(bpin)){
			this.log("bridgeDigitalWrite: -> " + JSON.stringify([bpin, "dw", pin].concat(val)));
		}
		var msg = this.blynkCmd(MsgType.BRIDGE, [bpin, "dw", pin].concat(val));
		this.sendMsg(msg);
	};

	BlynkClientNode.prototype.handleWriteEvent = function(command) {
		if(this.dbg_all || this.dbg_write || this.isLogPin(command.pin)){
			this.log("writeEvent: -> cmd " + JSON.stringify(command));
		}
		for (var i = 0; i < this._inputNodes.length; i++) {
			if (this._inputNodes[i].nodeType == "write" && (this._inputNodes[i].pin == command.pin || this._inputNodes[i].pin_all ) ) {
				var msg;

				msg = {
					payload: command.value,
					pin: command.pin,
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
			this.log("readEvent: -> cmd " + JSON.stringify(command.replace(new RegExp("\u0000", "g"),"|")));
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