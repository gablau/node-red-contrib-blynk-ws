//blynk enum
var blynkEnum = require('./../libs/blynk-enum.js');
var MsgStatus = blynkEnum.MsgStatus;
var MsgType = blynkEnum.MsgType;
//console.log(MsgType);

//blynk util
var blynkUtil = require('./../libs/blynk-util.js');
var messageToDebugString = blynkUtil.messageToDebugString;
var commandToDebugString = blynkUtil.commandToDebugString;
//var decodeCommand 		 = blynkUtil.decodeCommand;
var blynkHeader 		 = blynkUtil.blynkHeader;
var getStatusByCode = blynkUtil.getStatusByCode;

var srs = require("secure-random-string");
//iniziate SRS
srs({length: 16, alphanumeric: true});

function getTimestamp(){
	return parseInt((new Date).getTime()/1000);	
}

/* ##### BLYNK STUFF ###### */

//library 0.4.7 - 2017-04-09
//library 0.5.1 - 2018-02-20
//library 0.5.2 - 2018-03-04
//library 0.5.3 - 2018-06-11

//Server Version
// 0.23.5 - 2017-04-07
// 0.32.2 - 2018-02-28
// 0.33.3 - 2018-03-20
// 0.34.0 - 2018-04-06
// 0.36.2 - 2018-05-11

// Blynk library constant 
var BLYNK_VERSION = "0.5.3"; //blynk library version
var BLYNK_HEARTBEAT = 10; //seconds
var BLYNK_PROTOCOL_MAX_LENGTH = 32767; //java Short.MAX_VALUE
var BLYNK_MAX_CMD_IN_MESSAGE = 1024; //max command in a single message 

//### PROTOCOL ###

/* build a blynk command */
var blynkCmd = function (msg_type, values, msg_id) {
	var self = this;
	values = values || [""];
	if (msg_type === MsgType.RSP) {
		return blynkHeader(msg_type, (msg_id-1), values);
	}
	else {
		if( self.msg_id > 0xFFFF ) self.msg_id = 1; //max 2 byte
		if( msg_id > 0xFFFF ) msg_id = 1; //max 2 byte
		msg_id = msg_id || (self.msg_id++);
  
		if( typeof values === "string" || typeof values === "number" ) {
			values = [ values ];
		}
    
		var data = values.join("\0");
		return blynkHeader(msg_type, msg_id, data.length) + data;
	}
};

var sendRsp = function (msg_type, msg_id, msg_len, msg_data) {
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
var sendMsg = function (data) {
	if(data.length<5 || data == undefined) {
		this.log("ERROR sendMsg - No data to send");
		return;
	}
	if (this.dbg_low) {
		this.log("SEND -> " + messageToDebugString(data));
	}
	//convert to Uint8Array
	var rawdata = new Uint8Array(data.length);
	for (var i = 0, j = data.length; i < j; ++i) {
		rawdata[i] = data.charCodeAt(i);
	}
	this.last_activity_out = this.last_heart_beat = getTimestamp();
	//this.log(rawdata);
	this.websocket.send(rawdata);
};

/* Send multiple command message - delete key */
var sendMsgMulti = function (key) {
	this.sendMsg(this.msgList[key]);
	delete this.msgList[key]; //unset key
};

/* Start multiple command message - generate key */
var startMsgMulti = function () {
	var key = srs({length: 16, alphanumeric: true});
	this.msgList[key] = "";
	return key;
};

var processCommand = function (cmd) {

	var RED = this.RED;

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
			this.warn(RED._("Connection redirecting to:  " + newpath));
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
				if(error) { //handle know error 
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
						default:
							this.warn(RED._("Response Error: "+getStatusByCode(cmd.status)));
							break;
					}
				}
				else { 
					this.warn(RED._("Unhandled RSP type: " + commandToDebugString(cmd)));
				}
			}
			break;
		case MsgType.LOGIN:
		case MsgType.PING:
			this.sendRsp(MsgType.RSP, this.msg_id, MsgStatus.OK);
			break;
		case MsgType.HW:
		case MsgType.BRIDGE:
			//this.warn(cmd.typeString+" cmd: " + JSON.stringify(cmd));
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
				this.warn(RED._("Invalid "+cmd.typeString+" cmd: " + commandToDebugString(cmd)));
				//this.sendRsp(MsgType.RSP, this.msg_id, MsgStatus.ILLEGAL_COMMAND);
				this.sendRspIllegalCmd(this.msg_id);
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
				this.warn(RED._("Invalid INTERNAL cmd: " + commandToDebugString(cmd)));
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
			this.warn(RED._("Invalid header type: " + commandToDebugString(cmd)));
			//this.sendRsp(MsgType.RSP, this.msg_id, MsgStatus.ILLEGAL_COMMAND);
			this.sendRspIllegalCmd(this.msg_id);

		}
	}
};


//### PROTOCOL COMMAND ###

/* send login message */
var login = function(token) {
	if(this.dbg_all){
		this.log("login -> " + String("********************************" + token.slice(-5)).slice(-32));
	}
	this.sendMsg(this.blynkCmd(MsgType.LOGIN, token, 1));
};

/* send Illegal command response message */
var sendRspIllegalCmd = function (msg_id) {
	this.sendRsp(MsgType.RSP, msg_id, MsgStatus.ILLEGAL_COMMAND);
};

/* send info message */
var sendInfo = function () {
	var info = [
		"ver", BLYNK_VERSION, 
		"h-beat", BLYNK_HEARTBEAT, 
		"buff-in", BLYNK_PROTOCOL_MAX_LENGTH, 
		"dev", "node-red", 
		"con", "Blynk-ws",
		"build", this.LIBRARY_INFO,
	];
	this.msg_id++;
	this.sendMsg(this.blynkCmd(MsgType.INTERNAL, info));
};

/* send ping message */
var ping = function() {
	if(this.dbg_all || this.dbg_read){
		this.log("ping");
	}
	this.last_heart_beat = getTimestamp();
	this.sendMsg(this.blynkCmd(MsgType.PING));
};

/* send syncAll message */
var syncAll = function(msgkey) {
	if(this.dbg_all || this.dbg_sync){
		this.log("syncAll: -> all");
	}
	var msg = this.blynkCmd(MsgType.HW_SYNC);
	if(this.multi_cmd && msgkey != undefined) 
		this.msgList[msgkey] = this.msgList[msgkey] + msg;
	else this.sendMsg(msg);
};


/* send syncVirtual message */
var syncVirtual = function(vpin, msgkey) {
	if(this.dbg_all || this.dbg_sync || this.isLogPin(vpin)){
		this.log("syncVirtual: -> " + JSON.stringify(["vr", vpin]));
	}
	var msg = this.blynkCmd(MsgType.HW_SYNC , ["vr", vpin]);
	if(this.multi_cmd && msgkey != undefined) 
		this.msgList[msgkey] = this.msgList[msgkey] + msg;
	else this.sendMsg(msg);
};

/* send virtualWrite message */
var virtualWrite = function(vpin, val, msgkey) {
	if(this.dbg_all || this.dbg_write || this.isLogPin(vpin)){
		this.log("virtualWrite: -> " + JSON.stringify(["vw", vpin].concat(val)));
	}
	var msg = this.blynkCmd(MsgType.HW, ["vw", vpin].concat(val));
	if(this.multi_cmd && msgkey != undefined) 
		this.msgList[msgkey] = this.msgList[msgkey] + msg;
	else this.sendMsg(msg);
};

/* send setProperty message - set msgkey form multimple command message*/
var setProperty = function(vpin, prop, val, msgkey) {
	if(this.dbg_all  || this.dbg_prop || this.isLogPin(vpin)){
		this.log("setProperty -> " + JSON.stringify([vpin, prop].concat(val)));
	}
	var msg = this.blynkCmd(MsgType.PROPERTY, [vpin, prop].concat(val));
	if(this.multi_cmd && msgkey != undefined) 
		this.msgList[msgkey] = this.msgList[msgkey] + msg;
	else this.sendMsg(msg);
};

var sendEmail = function(to, subject, message) {
	if(this.dbg_all || this.dbg_mail){
		this.log("sendEmail -> " + JSON.stringify([to, subject, message]));
	}
	this.sendMsg(this.blynkCmd(MsgType.EMAIL, [to, subject, message]));
};

var sendNotify = function(message) {
	if(this.dbg_all || this.dbg_notify){
		this.log("sendNotify -> " + JSON.stringify([message]));
	}
	this.sendMsg(this.blynkCmd(MsgType.NOTIFY, [message]));
};

/* send bridgeSetAuthToken message */
var bridgeSetAuthToken = function(bpin, token) {
	if(this.dbg_all || this.dbg_bridge || this.isLogPin(bpin)){
		var logtoken = String("********************************" + token.slice(-5)).slice(-32);
		this.log("bridgeSetAuthToken: -> " + JSON.stringify([bpin, "i", logtoken]));
	}
	var msg = this.blynkCmd(MsgType.BRIDGE, [bpin, "i", token]);
	this.sendMsg(msg);
};

/* send bridgeVirtualWrite message */
var bridgeVirtualWrite = function(bpin, pin, val) {
	if(this.dbg_all || this.dbg_bridge || this.isLogPin(bpin)){
		this.log("bridgeVirtualWrite: -> " + JSON.stringify([bpin, "vw", pin].concat(val)));
	}
	var msg = this.blynkCmd(MsgType.BRIDGE, [bpin, "vw", pin].concat(val));
	this.sendMsg(msg);
};

/* send bridgeAnalogWrite message */
var bridgeAnalogWrite = function(bpin, pin, val) {
	if(this.dbg_all || this.dbg_bridge || this.isLogPin(bpin)){
		this.log("bridgeAnalogWrite: -> " + JSON.stringify([bpin, "aw", pin].concat(val)));
	}
	var msg = this.blynkCmd(MsgType.BRIDGE, [bpin, "aw", pin].concat(val));
	this.sendMsg(msg);
};

/* send bridgeDigitalWrite message */
var bridgeDigitalWrite = function(bpin, pin, val) {
	if(this.dbg_all || this.dbg_bridge || this.isLogPin(bpin)){
		this.log("bridgeDigitalWrite: -> " + JSON.stringify([bpin, "dw", pin].concat(val)));
	}
	var msg = this.blynkCmd(MsgType.BRIDGE, [bpin, "dw", pin].concat(val));
	this.sendMsg(msg);
};

exports.BLYNK_VERSION = BLYNK_VERSION;
exports.BLYNK_HEARTBEAT = BLYNK_HEARTBEAT;
exports.BLYNK_PROTOCOL_MAX_LENGTH = BLYNK_PROTOCOL_MAX_LENGTH;
exports.BLYNK_MAX_CMD_IN_MESSAGE = BLYNK_MAX_CMD_IN_MESSAGE; 

//protocol 
exports.blynkCmd = blynkCmd;
exports.sendRsp = sendRsp;
exports.sendMsg = sendMsg;
exports.sendMsgMulti = sendMsgMulti;
exports.startMsgMulti = startMsgMulti;
exports.processCommand = processCommand;


//protocol command
exports.login = login;
exports.sendInfo = sendInfo;
exports.sendRspIllegalCmd = sendRspIllegalCmd;
exports.ping = ping;
exports.syncAll = syncAll;
exports.syncVirtual = syncVirtual;
exports.virtualWrite = virtualWrite;
exports.setProperty = setProperty;
exports.sendEmail = sendEmail;
exports.sendNotify = sendNotify;
exports.bridgeSetAuthToken = bridgeSetAuthToken;
exports.bridgeVirtualWrite = bridgeVirtualWrite;
exports.bridgeAnalogWrite = bridgeAnalogWrite;
exports.bridgeDigitalWrite = bridgeDigitalWrite;
