// blynk enum
const srs = require('secure-random-string');
const utf8 = require('utf8');
const blynkEnum = require('./blynk-enum.js');

const MsgStatus = blynkEnum.MsgStatus;
const MsgType = blynkEnum.MsgType;

// blynk util
const blynkUtil = require('./blynk-util.js');

const messageToDebugString = blynkUtil.messageToDebugString;
const commandToDebugString = blynkUtil.commandToDebugString;
// var decodeCommand = blynkUtil.decodeCommand;
const blynkHeader = blynkUtil.blynkHeader;
const getStatusByCode = blynkUtil.getStatusByCode;
const getTimestamp = blynkUtil.getTimestamp;

// iniziate SRS
srs({ length: 16, alphanumeric: true });

/* ##### BLYNK STUFF ###### */

// C++ Library Version
// 0.4.7 - 2017-04-09
// 0.5.1 - 2018-02-20
// 0.5.2 - 2018-03-04
// 0.5.3 - 2018-06-11
// 0.5.4 - 2018-09-05
// 0.6.0 - 2018-02-01
// 0.6.1 - 2018-02-19

// Server Version
// 0.23.5 - 2017-04-07
// 0.32.2 - 2018-02-28
// 0.33.3 - 2018-03-20
// 0.34.0 - 2018-04-06
// 0.36.2 - 2018-05-11
// 0.39.4 - 2018-07-29

// Blynk library constant
const BLYNK_VERSION = '0.6.1'; // blynk library version
const BLYNK_HEARTBEAT = 15; // seconds
const BLYNK_PROTOCOL_MAX_LENGTH = 32767; // java Short.MAX_VALUE
const BLYNK_MAX_CMD_IN_MESSAGE = 1024; // max command in a single message

// ### PROTOCOL ###

/* build a blynk command */
const blynkCmd = function blynkCmd(msgType, vals, forceMsgId) {
  const self = this;
  let msgId = forceMsgId;
  let values = vals || [''];

  if (msgType === MsgType.RSP) {
    return blynkHeader(msgType, (forceMsgId - 1), values);
  }

  // set id and check max 2 byte limit
  if (self.msgId > 0xFFFF) self.msgId = 1;
  if (msgId > 0xFFFF) msgId = 1;

  msgId = msgId || (self.msgId++);

  if (typeof values === 'string' || typeof values === 'number') {
    values = [values];
  }

  // utf8 convert
  if (Array.isArray(values) && values.length > 0) {
    for (let i = 0; i < values.length; i++) {
      if (typeof values[i] === 'string') {
        values[i] = utf8.encode(values[i]);
      }
    }
  }

  const data = values.join('\0');
  return blynkHeader(msgType, msgId, data.length) + data;
};

const sendRsp = function sendRsp(msgType, msgId, msgLen, msgData) {
  const data = msgData || '';
  let msg = null;
  if (msgType === MsgType.RSP) {
    msg = this.blynkCmd(msgType, msgLen, msgId);
  } else {
    msg = this.blynkCmd(msgType, data, msgId);
  }

  this.sendMsg(msg);
};

/* send binary message througth websocket */
const sendMsg = function sendMsg(data) {
  if (data.length < 5 || data === undefined) {
    this.log('ERROR sendMsg - No data to send');
    return;
  }

  if (data.length > BLYNK_PROTOCOL_MAX_LENGTH) {
    this.log(`ERROR sendMsg - Message too long: ${data.length}bytes`);
    return;
  }
  if (this.dbg_low) {
    this.log(`SEND -> ${messageToDebugString(data)}`);
  }
  // convert to Uint8Array
  const rawdata = new Uint8Array(data.length);
  for (let i = 0, j = data.length; i < j; ++i) {
    rawdata[i] = data.charCodeAt(i);
  }
  const currTimestamp = getTimestamp();
  this.lastHeartBeat = currTimestamp;
  this.lastActivityOut = currTimestamp;
  // this.log(rawdata);
  this.websocket.send(rawdata);
};

/* Send multiple command message - delete key */
const sendMsgMulti = function sendMsgMulti(key) {
  this.sendMsg(this.msgList[key]);
  delete this.msgList[key]; // unset key
};

/* Start multiple command message - generate key */
const startMsgMulti = function startMsgMulti() {
  const key = srs({ length: 16, alphanumeric: true });
  this.msgList[key] = '';
  return key;
};

const processCommand = function processCommand(cmd) {
  const RED = this.RED;

  if (!this.logged) {
    if (cmd.type === MsgType.RSP && cmd.msgId === 1) {
      if (
        cmd.len === MsgStatus.OK
        || cmd.len === MsgStatus.ALREADY_REGISTERED
      ) {
        this.log('Client logged');
        this.logged = true;
        this.sendInfo();
        this.emit('connected', '');
      } else if (cmd.len === MsgStatus.BLYNK_INVALID_TOKEN) {
        this.log('Invalid auth token');
      } else if (cmd.len === MsgStatus.NOT_AUTHENTICATED) {
        this.log('Not autenticated');
      } else {
        this.log(`Connect failed. code: ${cmd.len}`);
      }
    }
    if (cmd.type === MsgType.RSP && cmd.len === MsgStatus.NOT_AUTHENTICATED) {
      this.log('Not autenticated');
    }
    if (cmd.type === MsgType.REDIRECT) {
      // handle server redirect
      let schema = 'ws://';
      let port = 80;
      if (this.path.startsWith('wss://')) {
        schema = 'wss://';
        port = 443;
      }
      const values = cmd.body.split('\0');
      const serverip = values[0];
      if (values[1] > 0) port = values[1];
      const newpath = `${schema + serverip}:${port}/websockets`;
      this.path = newpath;
      this.warn(RED._(`Connection redirecting to:  ${newpath}`));
    }
  } else {
    // logged

    // update received activity not update heartbeat
    if (cmd.type !== MsgType.RSP) {
      this.lastActivityIn = getTimestamp();
    }

    switch (cmd.type) {
      case MsgType.RSP:
        if (cmd.status !== MsgStatus.OK) {
          // handle not ok response message
          let error = false;
          for (const k in MsgStatus) {// eslint-disable-line 
            if (MsgStatus.hasOwnProperty(k)) { // eslint-disable-line
              if (cmd.status == MsgStatus[k]) error = true; // eslint-disable-line
            }
          }
          if (error) {
            // handle know error
            switch (cmd.status) {
              case MsgStatus.NOT_AUTHENTICATED:
                this.log('Not autenticated');
                break;
              case MsgStatus.BLYNK_INVALID_TOKEN:
                this.log('Invalid auth token');
                break;
              case MsgStatus.ILLEGAL_COMMAND_BODY:
                // this.log("Illegal command body");
                break;
              default:
                this.warn(
                  RED._(`Response Error: ${getStatusByCode(cmd.status)}`),
                );
                break;
            }
          } else {
            this.warn(
              RED._(`Unhandled RSP type: ${commandToDebugString(cmd)}`),
            );
          }
        }
        break;
      case MsgType.LOGIN:
      case MsgType.PING:
        this.sendRsp(MsgType.RSP, this.msgId, MsgStatus.OK);
        break;
      case MsgType.HW:
      case MsgType.BRIDGE:
        // this.warn(cmd.typeString+" cmd: " + JSON.stringify(cmd));
        switch (cmd.operation) {
          // input nodes
          case 'vw':
            this.handleWriteEvent(cmd);
            break;
          case 'vr':
            this.handleReadEvent(cmd);
            break;
          case 'pm':
            // skip message "pin mode"
            break;
          default:
            this.warn(
              RED._(
                `Invalid ${
                  cmd.typeString
                } cmd: ${
                  commandToDebugString(cmd)}`,
              ),
            );
            // this.sendRsp(MsgType.RSP, this.msgId, MsgStatus.ILLEGAL_COMMAND);
            this.sendRspIllegalCmd(this.msgId);
        }
        break;
      case MsgType.INTERNAL:
        switch (cmd.body) {
          // app event node
          case 'acon':
          case 'adis':
            this.handleAppEvent(cmd.body);
            break;
          default:
            this.warn(
              RED._(`Invalid INTERNAL cmd: ${commandToDebugString(cmd)}`),
            );
          // this.sendRsp(MsgType.RSP, this.msgId, MsgStatus.ILLEGAL_COMMAND);
        }
        break;
      case MsgType.DEBUG_PRINT:
        this.log(`Server: ${cmd.body}`);
        break;
      default:
        this.warn(RED._(`Invalid header type: ${commandToDebugString(cmd)}`));
        // this.sendRsp(MsgType.RSP, this.msgId, MsgStatus.ILLEGAL_COMMAND);
        this.sendRspIllegalCmd(this.msgId);
    }
  }
};

// ### PROTOCOL COMMAND ###

/* send login message */
const login = function login(token) {
  if (this.dbg_all) {
    this.log(
      `login -> ${
        String(`********************************${token.slice(-5)}`).slice(-32)}`,
    );
  }
  this.sendMsg(this.blynkCmd(MsgType.LOGIN, token, 1));
};

/* send Illegal command response message */
const sendRspIllegalCmd = function sendRspIllegalCmd(msgId) {
  this.sendRsp(MsgType.RSP, msgId, MsgStatus.ILLEGAL_COMMAND);
};

/* send info message */
const sendInfo = function sendInfo() {
  const info = [
    'ver',
    BLYNK_VERSION,
    'h-beat',
    BLYNK_HEARTBEAT,
    'buff-in',
    BLYNK_PROTOCOL_MAX_LENGTH,
    'dev',
    'node-red',
    'con',
    'Blynk-ws',
    'fw',
    this.LIBRARY_VERSION,
    'build',
    this.LIBRARY_DATE,
  ];
  this.msgId++;
  this.sendMsg(this.blynkCmd(MsgType.INTERNAL, info));
};

/* send ping message */
const ping = function ping() {
  if (this.dbg_all || this.dbg_read) {
    this.log('ping');
  }
  this.lastHeartbeat = getTimestamp();
  this.sendMsg(this.blynkCmd(MsgType.PING));
};

/* send syncAll message */
const syncAll = function syncAll(msgkey) {
  if (this.dbg_all || this.dbg_sync) {
    this.log('syncAll: -> all');
  }
  const msg = this.blynkCmd(MsgType.HW_SYNC);
  if (this.multi_cmd && msgkey !== undefined) {
    this.msgList[msgkey] = this.msgList[msgkey] + msg;
  } else this.sendMsg(msg);
};

/* send syncVirtual message */
const syncVirtual = function syncVirtual(vpin, msgkey) {
  if (this.dbg_all || this.dbg_sync || this.isLogPin(vpin)) {
    this.log(`syncVirtual: -> ${JSON.stringify(['vr', vpin])}`);
  }
  const msg = this.blynkCmd(MsgType.HW_SYNC, ['vr', vpin]);
  if (this.multi_cmd && msgkey !== undefined) {
    this.msgList[msgkey] = this.msgList[msgkey] + msg;
  } else this.sendMsg(msg);
};

/* send virtualWrite message */
const virtualWrite = function virtualWrite(vpin, val, msgkey) {
  if (this.dbg_all || this.dbg_write || this.isLogPin(vpin)) {
    this.log(`virtualWrite: -> ${JSON.stringify(['vw', vpin].concat(val))}`);
  }
  const msg = this.blynkCmd(MsgType.HW, ['vw', vpin].concat(val));
  if (this.multi_cmd && msgkey !== undefined) {
    this.msgList[msgkey] = this.msgList[msgkey] + msg;
  } else this.sendMsg(msg);
};

/* send setProperty message - set msgkey form multimple command message */
const setProperty = function setProperty(vpin, prop, val, msgkey) {
  if (this.dbg_all || this.dbg_prop || this.isLogPin(vpin)) {
    this.log(`setProperty -> ${JSON.stringify([vpin, prop].concat(val))}`);
  }
  const msg = this.blynkCmd(MsgType.PROPERTY, [vpin, prop].concat(val));
  if (this.multi_cmd && msgkey !== undefined) {
    this.msgList[msgkey] = this.msgList[msgkey] + msg;
  } else this.sendMsg(msg);
};

const sendEmail = function sendEmail(to, subject, message) {
  if (this.dbg_all || this.dbg_mail) {
    this.log(`sendEmail -> ${JSON.stringify([to, subject, message])}`);
  }
  this.sendMsg(this.blynkCmd(MsgType.EMAIL, [to, subject, message]));
};

const sendNotify = function sendNotify(message) {
  if (this.dbg_all || this.dbg_notify) {
    this.log(`sendNotify -> ${JSON.stringify([message])}`);
  }
  this.sendMsg(this.blynkCmd(MsgType.NOTIFY, [message]));
};

/* send bridgeSetAuthToken message */
const bridgeSetAuthToken = function bridgeSetAuthToken(bpin, token) {
  if (this.dbg_all || this.dbg_bridge || this.isLogPin(bpin)) {
    const logtoken = String(
      `********************************${token.slice(-5)}`,
    ).slice(-32);
    this.log(`bridgeSetAuthToken: -> ${JSON.stringify([bpin, 'i', logtoken])}`);
  }
  const msg = this.blynkCmd(MsgType.BRIDGE, [bpin, 'i', token]);
  this.sendMsg(msg);
};

/* send bridgeVirtualWrite message */
const bridgeVirtualWrite = function bridgeVirtualWrite(bpin, pin, val) {
  if (this.dbg_all || this.dbg_bridge || this.isLogPin(bpin)) {
    this.log(
      `bridgeVirtualWrite: -> ${JSON.stringify([bpin, 'vw', pin].concat(val))}`,
    );
  }
  const msg = this.blynkCmd(MsgType.BRIDGE, [bpin, 'vw', pin].concat(val));
  this.sendMsg(msg);
};

/* send bridgeAnalogWrite message */
const bridgeAnalogWrite = function bridgeAnalogWrite(bpin, pin, val) {
  if (this.dbg_all || this.dbg_bridge || this.isLogPin(bpin)) {
    this.log(
      `bridgeAnalogWrite: -> ${JSON.stringify([bpin, 'aw', pin].concat(val))}`,
    );
  }
  const msg = this.blynkCmd(MsgType.BRIDGE, [bpin, 'aw', pin].concat(val));
  this.sendMsg(msg);
};

/* send bridgeDigitalWrite message */
const bridgeDigitalWrite = function bridgeDigitalWrite(bpin, pin, val) {
  if (this.dbg_all || this.dbg_bridge || this.isLogPin(bpin)) {
    this.log(
      `bridgeDigitalWrite: -> ${JSON.stringify([bpin, 'dw', pin].concat(val))}`,
    );
  }
  const msg = this.blynkCmd(MsgType.BRIDGE, [bpin, 'dw', pin].concat(val));
  this.sendMsg(msg);
};

module.exports = {
  // constants
  BLYNK_VERSION,
  BLYNK_HEARTBEAT,
  BLYNK_PROTOCOL_MAX_LENGTH,
  BLYNK_MAX_CMD_IN_MESSAGE,
  // protocol functions
  blynkCmd,
  sendRsp,
  sendMsg,
  sendMsgMulti,
  startMsgMulti,
  processCommand,
  // protocol commands
  login,
  sendInfo,
  sendRspIllegalCmd,
  ping,
  syncAll,
  syncVirtual,
  virtualWrite,
  setProperty,
  sendEmail,
  sendNotify,
  bridgeSetAuthToken,
  bridgeVirtualWrite,
  bridgeAnalogWrite,
  bridgeDigitalWrite,
};
