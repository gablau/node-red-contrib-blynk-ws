const blynkUtil = require('../libs/blynk-util');

module.exports = (RED) => {
  function BlynkZergbaNode(n) {
    RED.nodes.createNode(this, n);
    const node = this;
    this.client = n.client;
    this.pin = n.pin;
    this.nodeType = 'zergba';

    this.connected_label = RED._('blynk-ws-zergba.status.connected-fixed') + this.pin;

    this.blynkClient = RED.nodes.getNode(this.client);
    if (this.blynkClient) {
      this.blynkClient.registerInputNode(this);
      this.blynkClient.on('opened', (n) => { // eslint-disable-line no-shadow
        node.status({
          fill: 'yellow',
          shape: 'dot',
          text: RED._('blynk-ws-zergba.status.connecting') + n,
        });
      });
      this.blynkClient.on('connected', () => {
        node.status({
          fill: 'green',
          shape: 'dot',
          text: node.connected_label,
        });
      });
      this.blynkClient.on('error', () => {
        node.status({
          fill: 'red',
          shape: 'ring',
          text: 'blynk-ws-zergba.status.error',
        });
      });
      this.blynkClient.on('closed', () => {
        node.status({
          fill: 'red',
          shape: 'ring',
          text: 'blynk-ws-zergba.status.disconnected',
        });
      });
      this.blynkClient.on('disabled', () => {
        node.status({
          fill: 'red',
          shape: 'dot',
          text: 'blynk-ws-zergba.status.disabled',
        });
      });
    } else {
      this.error(RED._('blynk-ws-zergba.errors.missing-conf'));
    }

    this.on('input', (msg, send, done) => {
      // no input operation if client not connected or disabled
      if (!node.blynkClient || !node.blynkClient.logged) {
        return;
      }

      function checkRGB(r, g, b) {
        let ret = '';
        if (!blynkUtil.checkByte(r)) {
          ret = 'R';
        }
        if (!blynkUtil.checkByte(g)) {
          ret = (ret === '') ? 'G' : `${ret}, G`;
        }
        if (!blynkUtil.checkByte(b)) {
          ret = (ret === '') ? 'B' : `${ret}, B`;
        }

        if (ret === '') return true;
        ret = `zergba receive [${r},${g}, ${b}] but ${ret} value is not a valid byte (0-255)`;
        node.warn(ret);
        return ret;
      }

      if (msg.hasOwnProperty('payload')) {
        const payload = Array.isArray(msg.payload) ? msg.payload : RED.util.ensureString(msg.payload);
        const pin = node.pin;
        const newmsg = {};

        if (Array.isArray(payload) && payload.length === 3) {
          if (checkRGB(payload[0], payload[1], payload[2]) !== true) return;
          newmsg.hex = blynkUtil.rgbToHex(parseInt(payload[0], 10), parseInt(payload[1], 10), parseInt(payload[2], 10));
          const color = blynkUtil.hexToRgb(newmsg.hex);
          newmsg.r = color.r;
          newmsg.g = color.g;
          newmsg.b = color.b;
          newmsg.rgb = `${color.r};${color.g};${color.b}`;
          newmsg.payload = [color.r, color.g, color.b];
        } else if (msg.hasOwnProperty('hex')) {
          const hex = RED.util.ensureString(msg.hex);
          const color = blynkUtil.hexToRgb(hex);
          if (color === null) {
            node.warn(`zergba receive [${hex}] but cannot convert to RGB value`);
            return;
          }
          newmsg.hex = hex;
          newmsg.r = color.r;
          newmsg.g = color.g;
          newmsg.b = color.b;
          newmsg.rgb = `${color.r};${color.g};${color.b}`;
          newmsg.payload = [color.r, color.g, color.b];
        } else if (msg.hasOwnProperty('r') && msg.hasOwnProperty('g') && msg.hasOwnProperty('b')) {
          const r = RED.util.ensureString(msg.r);
          const g = RED.util.ensureString(msg.g);
          const b = RED.util.ensureString(msg.b);
          if (checkRGB(r, g, b) !== true) return;
          newmsg.hex = blynkUtil.rgbToHex(parseInt(r, 10), parseInt(g, 10), parseInt(b, 10));
          newmsg.r = r;
          newmsg.g = g;
          newmsg.b = b;
          newmsg.rgb = `${r};${g};${b}`;
          newmsg.payload = [r, g, b];
        } else {
          let tmpcolor = payload.split('\0');
          if (tmpcolor.length === 3) {
            if (checkRGB(tmpcolor[0], tmpcolor[1], tmpcolor[2]) !== true) return;
            newmsg.hex = blynkUtil.rgbToHex(parseInt(tmpcolor[0], 10), parseInt(tmpcolor[1], 10), parseInt(tmpcolor[2], 10));
            const color = blynkUtil.hexToRgb(newmsg.hex);
            newmsg.r = color.r;
            newmsg.g = color.g;
            newmsg.b = color.b;
            newmsg.rgb = `${color.r};${color.g};${color.b}`;
            newmsg.payload = [color.r, color.g, color.b];
          }
          tmpcolor = payload.split(';');
          if (tmpcolor.length === 3) {
            if (checkRGB(tmpcolor[0], tmpcolor[1], tmpcolor[2]) !== true) return;
            newmsg.hex = blynkUtil.rgbToHex(parseInt(tmpcolor[0], 10), parseInt(tmpcolor[1], 10), parseInt(tmpcolor[2], 10));
            const color = blynkUtil.hexToRgb(newmsg.hex);
            newmsg.r = color.r;
            newmsg.g = color.g;
            newmsg.b = color.b;
            newmsg.rgb = `${color.r};${color.g};${color.b}`;
            newmsg.payload = [color.r, color.g, color.b];
          }
        }

        this.status({
          fill: 'green',
          shape: 'dot',
          text: `${node.connected_label} [${newmsg.r}, ${newmsg.g}, ${newmsg.b}]`,
        });

        node.blynkClient.virtualWrite(pin, newmsg.payload);
        send(newmsg);
      }

      if (done) {
        done();
      }
    });

    this.on('close', () => {
      if (node.blynkClient) {
        node.blynkClient.removeInputNode(node);
      }
    });
  }

  RED.nodes.registerType('blynk-ws-zergba', BlynkZergbaNode);
};
