module.exports = (RED) => {
  /* LCD Widget */
  function BlynkOutLCDNode(n) {
    RED.nodes.createNode(this, n);
    const node = this;
    this.client = n.client;
    this.pin = n.pin;

    this.blynkClient = RED.nodes.getNode(this.client);
    if (this.blynkClient) {
      this.blynkClient.registerGenericNode(this, 'LCD');

      this.blynkClient.on('opened', (n) => { // eslint-disable-line no-shadow
        node.status({
          fill: 'yellow',
          shape: 'dot',
          text: RED._('blynk-ws-out-lcd.status.connecting') + n,
        });
      });
      this.blynkClient.on('connected', () => {
        node.status({
          fill: 'green',
          shape: 'dot',
          text: RED._('blynk-ws-out-lcd.status.connected-fixed') + node.pin,
        });
      });
      this.blynkClient.on('error', () => {
        node.status({
          fill: 'red',
          shape: 'ring',
          text: 'blynk-ws-out-lcd.status.error',
        });
      });
      this.blynkClient.on('closed', () => {
        node.status({
          fill: 'red',
          shape: 'ring',
          text: 'blynk-ws-out-lcd.status.disconnected',
        });
      });
      this.blynkClient.on('disabled', () => {
        node.status({
          fill: 'red',
          shape: 'dot',
          text: 'blynk-ws-out-lcd.status.disabled',
        });
      });
    } else {
      this.error(RED._('blynk-ws-out-lcd.errors.missing-conf'));
    }
    this.on('input', (msg) => {
      // no input operation if client not connected or disabled
      if (!node.blynkClient || !node.blynkClient.logged) {
        return;
      }

      if (msg.hasOwnProperty('payload')) {
        if (node.pin < 0 || node.pin > 255) {
          node.warn(RED._('blynk-ws-out-lcd.warn.pin-value'));
          return;
        }

        let msgkey;
        if (node.blynkClient.multi_cmd) {
          msgkey = node.blynkClient.startMsgMulti();
        }

        if (msg.hasOwnProperty('clear') && msg.clear === true) {
          node.blynkClient.virtualWrite(node.pin, 'clr', msgkey);
        }
        if (msg.hasOwnProperty('text')) {
          const text = RED.util.ensureString(msg.text);

          let x = 0;
          if (msg.hasOwnProperty('x')) {
            if (msg.x < 0) x = 0;
            else if (msg.x > 15) x = 15;
            else x = msg.x;
          }

          let y = 0;
          if (msg.hasOwnProperty('y')) {
            if (msg.y < 0) y = 0;
            else if (msg.y > 1) y = 1;
            else y = msg.y;
          }

          const rawdata = ['p', x, y, text];
          node.blynkClient.virtualWrite(node.pin, rawdata, msgkey);
        }

        if (msg.hasOwnProperty('text1')) {
          const text1 = RED.util.ensureString(msg.text1);

          let x1 = 0;
          if (msg.hasOwnProperty('x1')) {
            if (msg.x1 < 0) x1 = 0;
            else if (msg.x1 > 15) x1 = 15;
            else x1 = msg.x1;
          }

          let y1 = 1;
          if (msg.hasOwnProperty('y1')) {
            if (msg.y1 < 0) y1 = 0;
            else if (msg.y1 > 1) y1 = 1;
            else y1 = msg.y1;
          }

          const rawdata1 = ['p', x1, y1, text1];
          node.blynkClient.virtualWrite(node.pin, rawdata1, msgkey);
        }

        if (node.blynkClient.multi_cmd) {
          node.blynkClient.sendMsgMulti(msgkey);
        }

        if (!msg.hasOwnProperty('text') && !msg.hasOwnProperty('text1') && !msg.hasOwnProperty('clear') && msg.hasOwnProperty('payload')) {
          const payload = RED.util.ensureString(msg.payload);
          if (payload !== '' && payload.length > 1) {
            node.warn(RED._('blynk-ws-out-lcd.warn.payload'));
          }
        }
      }
    });
  }

  RED.nodes.registerType('blynk-ws-out-lcd', BlynkOutLCDNode);
};
