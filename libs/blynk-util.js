/* blynk helper function */
const utf8 = require('utf8');
const blynkEnum = require('./blynk-enum');

const { MsgStatus } = blynkEnum;
const { MsgType } = blynkEnum;

/* ##### BLYNK STUFF ###### */

function getKeyByValue(obj, value) {
  // return Object.keys(obj).find(key => obj[key] === value); //javascript ES6 only
  return Object.keys(obj).filter((key) => obj[key] === value)[0];
}

function getCommandByCode(cmd) {
  const key = getKeyByValue(MsgType, cmd);
  if (key !== undefined) return key;
  return cmd;
}

function getStatusByCode(statusCode) {
  const key = getKeyByValue(MsgStatus, statusCode);
  if (key !== undefined) return key;
  return statusCode;
}

/* return a decoded command for debug */
function commandToDebugString(cmd) {
  if (cmd.type === MsgType.RSP) {
    return `Cmd: ${cmd.typeString}, Id: ${cmd.msgId}, responseCode: ${getStatusByCode(cmd.len)}`;
  }
  let logdata = cmd.body;
  if (cmd.type === MsgType.LOGIN) logdata = String(`********************************${cmd.body.slice(-5)}`).slice(-32);
  if (cmd.type === MsgType.BRIDGE) {
    const values = cmd.body.split('\0');
    if (values.length === 3 && values[1] === 'i') {
      logdata = `${values[0]}\0${values[1]}\0${String(`********************************${values[2].slice(-5)}`).slice(-32)}`;
    }
  }

  logdata = logdata.replace(new RegExp('\u0000', 'g'), '|'); // eslint-disable-line no-control-regex
  logdata = utf8.decode(logdata);
  return `Cmd: ${cmd.typeString}, Id: ${cmd.msgId}, len: ${cmd.len}, data: ${JSON.stringify(logdata)}`;
}

/* decode a single blynk command */
function decodeCommand(data) {
  const cmd = {};

  cmd.type = data.charCodeAt(0);
  cmd.typeString = getCommandByCode(cmd.type);
  cmd.msgId = (data.charCodeAt(1) << 8) | data.charCodeAt(2); // eslint-disable-line no-bitwise
  cmd.len = (data.charCodeAt(3) << 8) | data.charCodeAt(4); // eslint-disable-line no-bitwise
  cmd.msgLength = 5;

  switch (cmd.type) {
    case MsgType.HW:
    case MsgType.BRIDGE:
      cmd.body = data.substr(5, cmd.len);
      cmd.msgLength += cmd.len;

      if (cmd.body !== '') {
        const values = cmd.body.split('\0');
        if (values.length > 1) {
          cmd.operation = values[0];
          cmd.pin = values[1];
          if (values.length > 2) {
            cmd.value = values[2];
            // we have an array of cmds, return array as well
            cmd.array = values.slice(2, values.length);
          }
        } else if (values.length === 1) { // /handle "pm" single message
          cmd.operation = values[0];
        }
      }
      break;
    case MsgType.RSP:
      cmd.status = (data.charCodeAt(3) << 8) | data.charCodeAt(4); // eslint-disable-line no-bitwise
      break;
    default:
      cmd.body = data.substr(5, cmd.len);
      cmd.msgLength += cmd.len;
      break;
  }

  return cmd;
}

/* return a full decoded message for debug */
function messageToDebugString(msg) {
  let data = msg;
  let msgCount = 0;
  let dbgStr = '';

  while (data.length > 0) {
    msgCount++;
    const cmd = decodeCommand(data);
    data = data.substr(cmd.msgLength); // remove current message from data
    if (msgCount > 1) dbgStr = `${dbgStr}\n${commandToDebugString(cmd)}`;
    else dbgStr = commandToDebugString(cmd);
  }
  if (msgCount > 1) return `Multiple Command, num: ${msgCount}\n${dbgStr}`;
  return dbgStr;
}

/* build a blynk header */
function blynkHeader(msgType, msgId, msgLen) {
  return String.fromCharCode(
    msgType,
    msgId >> 8, msgId & 0xFF, // eslint-disable-line no-bitwise
    msgLen >> 8, msgLen & 0xFF, // eslint-disable-line no-bitwise
  );
}

/* ##### END BLYNK STUFF ###### */

/* ### OTHER FUNCTION ### */
function rgbToHex(r, g, b) {
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`; // eslint-disable-line no-bitwise
}

function hexToRgb(paramHex) {
  let hex = paramHex;
  // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
  const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
  hex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);

  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  } : null;
}

function checkRangeInt(i, min, max) {
  const n = parseFloat(i);
  return (!Number.isNaN(n) && n >= min && n <= max && n == parseInt(i, 10)); // eslint-disable-line eqeqeq, max-len
}

function checkByte(b) {
  return checkRangeInt(b, 0, 255);
}

function check01(i) {
  return checkRangeInt(i, 0, 1);
}

function getTimestamp() {
  return parseInt(new Date().getTime() / 1000, 10);
}

/* ### END OTHER FUNCTION ### */
module.exports = {
  messageToDebugString,
  commandToDebugString,
  decodeCommand,
  blynkHeader,
  // getKeyByValue: getKeyByValue,
  // getCommandByCode: getCommandByCode,
  getStatusByCode,
  rgbToHex,
  hexToRgb,
  checkRangeInt,
  checkByte,
  check01,
  getTimestamp,
};
