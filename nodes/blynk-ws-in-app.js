module.exports = (RED) => {
  function BlynkInAppNode(n) {
    RED.nodes.createNode(this, n);
    this.client = n.client;
    const node = this;
    this.blynkClient = RED.nodes.getNode(this.client);

    this.nodeType = 'app';

    if (this.blynkClient) {
      this.blynkClient.registerInputNode(this);

      this.blynkClient.on('opened', (n) => { // eslint-disable-line no-shadow
        node.status({
          fill: 'yellow',
          shape: 'dot',
          text: RED._('blynk-ws-in-app.status.connecting') + n,
        });
      });
      this.blynkClient.on('connected', () => {
        node.status({
          fill: 'green',
          shape: 'dot',
          text: 'blynk-ws-in-app.status.connected',
        });
      });
      this.blynkClient.on('error', () => {
        node.status({
          fill: 'red',
          shape: 'ring',
          text: 'blynk-ws-in-app.status.error',
        });
      });
      this.blynkClient.on('closed', () => {
        node.status({
          fill: 'red',
          shape: 'ring',
          text: 'blynk-ws-in-app.status.disconnected',
        });
      });
      this.blynkClient.on('disabled', () => {
        node.status({
          fill: 'red',
          shape: 'dot',
          text: 'blynk-ws-in-app.status.disabled',
        });
      });
    } else {
      this.error(RED._('blynk-ws-in-app.errors.missing-conf'));
    }

    this.on('close', () => {
      if (node.blynkClient) {
        node.blynkClient.removeInputNode(node);
      }
    });
  }

  RED.nodes.registerType('blynk-ws-in-app', BlynkInAppNode);
};
