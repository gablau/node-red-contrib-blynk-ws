module.exports = (RED) => {
  function BlynkOutNotifyNode(n) {
    RED.nodes.createNode(this, n);
    const node = this;
    this.client = n.client;
    this.queue = n.queue;
    this.rate = 1000 * (n.rate > 0 ? n.rate : 1);
    this.buffer = [];
    this.intervalID = -1;

    this.blynkClient = RED.nodes.getNode(this.client);
    if (this.blynkClient) {
      // this.log("Register notify node - on client: " + this.blynkClient.name);
      this.blynkClient.registerGenericNode(this, 'notify');

      this.blynkClient.on('opened', (n) => { // eslint-disable-line no-shadow
        node.status({
          fill: 'yellow',
          shape: 'dot',
          text: RED._('blynk-ws-out-notify.status.connecting') + n,
        });
      });
      this.blynkClient.on('connected', () => {
        let queuestr = '';
        if (node.queue) {
          queuestr = ' - queue: 0';
        }
        node.status({
          fill: 'green',
          shape: 'dot',
          text: RED._('blynk-ws-out-notify.status.connected') + queuestr,
        });
      });
      this.blynkClient.on('error', () => {
        node.status({
          fill: 'red',
          shape: 'ring',
          text: 'blynk-ws-out-notify.status.error',
        });
      });
      this.blynkClient.on('closed', () => {
        node.status({
          fill: 'red',
          shape: 'ring',
          text: 'blynk-ws-out-notify.status.disconnected',
        });
      });
      this.blynkClient.on('disabled', () => {
        node.status({
          fill: 'red',
          shape: 'dot',
          text: 'blynk-ws-out-notify.status.disabled',
        });
      });
    } else {
      this.error(RED._('blynk-ws-out-notify.errors.missing-conf'));
    }
    this.on('input', (msg, done) => {
      // no input operation if client not connected or disabled
      if (!node.blynkClient || !node.blynkClient.logged) {
        return;
      }

      node.reportDepth = function reportDepth() {
        if (!node.busy) {
          node.busy = setTimeout(() => {
            if (node.buffer.length > 0) {
              node.status({
                fill: 'green',
                shape: 'dot',
                text: `blynk-ws-out-notify.status.connected-queue ${node.buffer.length}`,
              });
            } else {
              node.status({
                fill: 'green',
                shape: 'dot',
                text: 'blynk-ws-out-notify.status.connected-queue 0',
              });
            }
            node.busy = null;
          }, 500);
        }
      };

      if (node.queue) {
        node.log('queue');
        if (node.intervalID !== -1) {
          node.buffer.push(msg);
          node.reportDepth();
        } else {
          if (msg.hasOwnProperty('payload')) {
            const payload = RED.util.ensureString(msg.payload);
            node.blynkClient.sendNotify(payload);
          }
          node.reportDepth();

          node.intervalID = setInterval(() => {
            if (node.buffer.length === 0) {
              clearInterval(node.intervalID);
              node.intervalID = -1;
            }
            if (node.buffer.length > 0) {
              const tempmsg = node.buffer.shift();
              if (tempmsg.hasOwnProperty('payload')) {
                const payload = RED.util.ensureString(tempmsg.payload);
                node.blynkClient.sendNotify(payload);
              }
            }
            node.reportDepth();
          }, node.rate);
        }
      } else if (msg.hasOwnProperty('payload')) {
        const payload = RED.util.ensureString(msg.payload);
        node.blynkClient.sendNotify(payload);
      }
      if (done) {
        done();
      }
    });

    this.on('close', () => {
      clearInterval(node.intervalID);
      clearTimeout(node.busy);
      node.buffer = [];
      node.status({});
    });
  }

  RED.nodes.registerType('blynk-ws-out-notify', BlynkOutNotifyNode);
};
