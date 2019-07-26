module.exports = (RED) => {
  function BlynkOutEmailNode(n) {
    RED.nodes.createNode(this, n);
    const node = this;
    this.client = n.client;
    this.email = n.email;

    this.blynkClient = RED.nodes.getNode(this.client);
    if (this.blynkClient) {
      this.blynkClient.registerGenericNode(this, 'email');

      this.blynkClient.on('opened', (n) => { // eslint-disable-line no-shadow
        node.status({
          fill: 'yellow',
          shape: 'dot',
          text: RED._('blynk-ws-out-email.status.connecting') + n,
        });
      });
      this.blynkClient.on('connected', (n) => { // eslint-disable-line no-shadow
        node.status({
          fill: 'green',
          shape: 'dot',
          text: RED._('blynk-ws-out-email.status.connected') + n,
        });
      });
      this.blynkClient.on('error', () => {
        node.status({
          fill: 'red',
          shape: 'ring',
          text: 'blynk-ws-out-email.status.error',
        });
      });
      this.blynkClient.on('closed', () => {
        node.status({
          fill: 'red',
          shape: 'ring',
          text: 'blynk-ws-out-email.status.disconnected',
        });
      });
      this.blynkClient.on('disabled', () => {
        node.status({
          fill: 'red',
          shape: 'dot',
          text: 'blynk-ws-out-email.status.disabled',
        });
      });
    } else {
      this.error(RED._('blynk-ws-out-email.errors.missing-conf'));
    }
    this.on('input', (msg) => {
      // no input operation if client not connected or disabled
      if (!node.blynkClient || !node.blynkClient.logged) {
        return;
      }

      if (msg.hasOwnProperty('payload')) {
        const payload = RED.util.ensureString(msg.payload);
        const subject = msg.topic ? RED.util.ensureString(msg.topic) : payload;
        node.blynkClient.sendEmail(node.email, subject, payload);
      }
    });
  }

  RED.nodes.registerType('blynk-ws-out-email', BlynkOutEmailNode);
};
