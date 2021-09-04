const blynkUtil = require('../libs/blynk-util.js');

module.exports = (RED) => {
  function BlynkImageGalleryNode(n) {
    RED.nodes.createNode(this, n);
    const node = this;
    this.client = n.client;
    this.pin = n.pin;
    this.onlabel = n.onlabel;
    this.offlabel = n.offlabel;
    this.oncolor = n.oncolor;
    this.onbackcolor = n.onbackcolor;
    this.offcolor = n.offcolor;
    this.offbackcolor = n.offbackcolor;
    this.nodeType = 'image-gallery';

    this.connected_label = RED._('blynk-ws-image-gallery.status.connected-fixed') + this.pin;

    this.blynkClient = RED.nodes.getNode(this.client);
    if (this.blynkClient) {
      // this.blynkClient.registerInputNode(this);
      this.blynkClient.on('opened', (n) => { // eslint-disable-line no-shadow
        node.status({
          fill: 'yellow',
          shape: 'dot',
          text: RED._('blynk-ws-image-gallery.status.connecting') + n,
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
          text: 'blynk-ws-image-gallery.status.error',
        });
      });
      this.blynkClient.on('closed', () => {
        node.status({
          fill: 'red',
          shape: 'ring',
          text: 'blynk-ws-image-gallery.status.disconnected',
        });
      });
      this.blynkClient.on('disabled', () => {
        node.status({
          fill: 'red',
          shape: 'dot',
          text: 'blynk-ws-image-gallery.status.disabled',
        });
      });
    } else {
      this.error(RED._('blynk-ws-image-gallery.errors.missing-conf'));
    }

    this.on('input', (msg, done) => {
      // no input operation if client not connected or disabled
      if (!node.blynkClient || !node.blynkClient.logged) {
        return;
      }

      if (msg.hasOwnProperty('payload') || msg.hasOwnProperty('topic')) {
        const topic = RED.util.ensureString(msg.topic);

        // virtualwrite to node
        if (topic !== 'write-property') {
          let payload = RED.util.ensureString(msg.payload);
          if (payload === 'true') payload = '1';
          if (payload === 'false') payload = '0';
          /*
          if(!blynkUtil.check01(payload)) {
              node.warn("style button receive [" + payload + "] but cannot convert to 0/1 value");
              return;
          } */
          node.blynkClient.virtualWrite(node.pin, payload);
          return;
        }

        // set property to node
        const pin = node.pin;

        // multiple property by code
        let msgkey;
        if (node.blynkClient.multi_cmd) {
          msgkey = node.blynkClient.startMsgMulti();
        }

        // image gallery widget (need server v0.40.x ??)
        if (msg.hasOwnProperty('imgid') && msg.hasOwnProperty('url')) {
          const imgid = RED.util.ensureString(msg.imgid);
          const url = RED.util.ensureString(msg.url);
          node.blynkClient.setProperty(pin, 'url', [imgid, url], msgkey);
        } else if (msg.hasOwnProperty('opacity')) {
          const opacity = RED.util.ensureString(msg.opacity);
          if (blynkUtil.checkRangeInt(opacity, 0, 100)) { node.blynkClient.setProperty(pin, 'opacity', opacity, msgkey); }
        } else if (msg.hasOwnProperty('scale')) {
          const scale = RED.util.ensureString(msg.scale);
          if (blynkUtil.checkRangeInt(scale, 0, 100)) { node.blynkClient.setProperty(pin, 'scale', scale, msgkey); }
        } else if (msg.hasOwnProperty('rotation')) {
          const rotation = RED.util.ensureString(msg.rotation);
          if (blynkUtil.checkRangeInt(rotation, 0, 360)) { node.blynkClient.setProperty(pin, 'rotation', rotation, msgkey); }
        } else if (msg.hasOwnProperty('urls') && Array.isArray(msg.urls)) {
          node.blynkClient.setProperty(pin, 'urls', msg.urls, msgkey);
        }

        if (node.blynkClient.multi_cmd) {
          node.blynkClient.sendMsgMulti(msgkey);
        }
      }
      if (done) {
        done();
      }
    });
  }

  RED.nodes.registerType('blynk-ws-image-gallery', BlynkImageGalleryNode);
};
