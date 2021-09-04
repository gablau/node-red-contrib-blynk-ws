module.exports = (RED) => {
  function BlynkOutBridgeNode(n) {
    RED.nodes.createNode(this, n);
    const node = this;
    this.client = n.client;
    this.pin = n.pin;
    this.pinmode = n.pinmode;
    this.pintype = n.pintype;
    this.bpin = n.bpin;
    this.key = n.key;

    if (this.pinmode == 1) this.connected_label = RED._('blynk-ws-out-bridge.status.connected-dynamic'); // eslint-disable-line eqeqeq
    else {
      const type = node.pintype.charAt(0).toUpperCase();
      this.connected_label = RED._('blynk-ws-out-bridge.status.connected-fixed') + type + this.pin;
    }


    this.blynkClient = RED.nodes.getNode(this.client);
    if (this.blynkClient) {
      this.blynkClient.on('opened', (n) => { // eslint-disable-line no-shadow
        node.status({
          fill: 'yellow',
          shape: 'dot',
          text: RED._('blynk-ws-out-bridge.status.connecting') + n,
        });
      });
      this.blynkClient.on('connected', () => {
        node.status({
          fill: 'green',
          shape: 'dot',
          text: node.connected_label,
        });
        node.blynkClient.bridgeSetAuthToken(node.bpin, node.key);
      });
      this.blynkClient.on('error', () => {
        node.status({
          fill: 'red',
          shape: 'ring',
          text: 'blynk-ws-out-bridge.status.error',
        });
      });
      this.blynkClient.on('closed', () => {
        node.status({
          fill: 'red',
          shape: 'ring',
          text: 'blynk-ws-out-bridge.status.disconnected',
        });
      });
      this.blynkClient.on('disabled', () => {
        node.status({
          fill: 'red',
          shape: 'dot',
          text: 'blynk-ws-out-bridge.status.disabled',
        });
      });
    } else {
      this.error(RED._('blynk-ws-out-bridge.errors.missing-conf'));
    }

    this.on('input', (msg, done) => {
      // no input operation if client not connected or disabled
      if (!node.blynkClient || !node.blynkClient.logged) {
        return;
      }

      if (msg.hasOwnProperty('payload')) {
        const payload = Array.isArray(msg.payload) ? msg.payload : RED.util.ensureString(msg.payload);
        let pin = node.pin;
        if (node.pinmode == 1) { // eslint-disable-line eqeqeq
          if (!msg.hasOwnProperty('pin')) {
            node.warn('Bridge node - Setting "pin mode" to "dynamic" but no msg.pin found.');
            return;
          }
          if (msg.pin < 0 || msg.pin > 255) {
            node.warn('Bridge node - The msg.pin must be between 0 and 255.');
            return;
          }
          pin = msg.pin;
        }
        switch (node.pintype) {
          case 'vw':
            node.blynkClient.bridgeVirtualWrite(node.bpin, pin, payload);
            break;
          case 'aw':
            node.blynkClient.bridgeAnalogWrite(node.bpin, pin, payload);
            break;
          case 'dw':
            node.blynkClient.bridgeDigitalWrite(node.bpin, pin, payload);
            break;
          default:
            break;
        }
      }
      if (done) {
        done();
      }
    });
  }

  RED.nodes.registerType('blynk-ws-out-bridge', BlynkOutBridgeNode);
};
