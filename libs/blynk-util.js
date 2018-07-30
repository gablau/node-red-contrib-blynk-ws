/* blynk helper function */

var blynkEnum = require('./../libs/blynk-enum.js');
var MsgStatus = blynkEnum.MsgStatus;
var MsgType = blynkEnum.MsgType;

/* ##### BLYNK STUFF ###### */

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

/* ### OTHER FUNCTION ### */
function rgbToHex(r, g, b) {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

function hexToRgb(hex) {
    // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
    var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, function(m, r, g, b) {
        return r + r + g + g + b + b;
    });

    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}
/* ### END OTHER FUNCTION ### */

exports.messageToDebugString = messageToDebugString;
exports.commandToDebugString = commandToDebugString;
exports.decodeCommand = decodeCommand;
exports.blynkHeader = blynkHeader;
//exports.getKeyByValue = getKeyByValue;
//exports.getCommandByCode = getCommandByCode;
exports.getStatusByCode = getStatusByCode;

exports.rgbToHex = rgbToHex;
exports.hexToRgb = hexToRgb;