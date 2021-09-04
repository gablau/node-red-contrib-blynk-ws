module.exports = (RED) => {
  function BlynkOutSyncNode(n) {
    RED.nodes.createNode(this, n);
    const node = this;
    this.client = n.client;
    this.pin = n.pin;
    this.pinmode = n.pinmode;

    if (this.pinmode == 1) this.connected_label = RED._('blynk-ws-out-sync.status.connected-all'); // eslint-disable-line eqeqeq
    else this.connected_label = RED._('blynk-ws-out-sync.status.connected-fixed') + this.pin;


    this.blynkClient = RED.nodes.getNode(this.client);
    if (this.blynkClient) {
      this.blynkClient.on('opened', (n) => { // eslint-disable-line no-shadow
        node.status({
          fill: 'yellow',
          shape: 'dot',
          text: RED._('blynk-ws-out-sync.status.connecting') + n,
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
          text: 'blynk-ws-out-sync.status.error',
        });
      });
      this.blynkClient.on('closed', () => {
        node.status({
          fill: 'red',
          shape: 'ring',
          text: 'blynk-ws-out-sync.status.disconnected',
        });
      });
      this.blynkClient.on('disabled', () => {
        node.status({
          fill: 'red',
          shape: 'dot',
          text: 'blynk-ws-out-sync.status.disabled',
        });
      });
    } else {
      this.error(RED._('blynk-ws-out-sync.errors.missing-conf'));
    }
    this.on('input', (msg, done) => {
      // no input operation if client not connected or disabled
      if (!node.blynkClient || !node.blynkClient.logged) {
        return;
      }

      if (msg.hasOwnProperty('payload')) {
        const pin = node.pin;
        if (node.pinmode == 1) { // eslint-disable-line eqeqeq
          node.blynkClient.syncAll();
        } else {
          node.blynkClient.syncVirtual(pin);
        }
      }

      if (done) {
        done();
      }
    });
  }

  RED.nodes.registerType('blynk-ws-out-sync', BlynkOutSyncNode);
};
