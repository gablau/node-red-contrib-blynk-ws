module.exports = (RED) => {
  /* Table Widget */
  function BlynkOutTableNode(n) {
    RED.nodes.createNode(this, n);
    const node = this;
    this.client = n.client;
    this.pin = n.pin;
    this.rowIdx = 0;

    this.blynkClient = RED.nodes.getNode(this.client);
    if (this.blynkClient) {
      this.blynkClient.registerGenericNode(this, 'table');

      this.blynkClient.on('opened', (n) => { // eslint-disable-line no-shadow
        node.status({
          fill: 'yellow',
          shape: 'dot',
          text: RED._('blynk-ws-out-table.status.connecting') + n,
        });
      });
      this.blynkClient.on('connected', () => {
        node.status({
          fill: 'green',
          shape: 'dot',
          text: RED._('blynk-ws-out-table.status.connected') + node.pin,
        });
      });
      this.blynkClient.on('error', () => {
        node.status({
          fill: 'red',
          shape: 'ring',
          text: 'blynk-ws-out-table.status.error',
        });
      });
      this.blynkClient.on('closed', () => {
        node.status({
          fill: 'red',
          shape: 'ring',
          text: 'blynk-ws-out-table.status.disconnected',
        });
      });
      this.blynkClient.on('disabled', () => {
        node.status({
          fill: 'red',
          shape: 'dot',
          text: 'blynk-ws-out-table.status.disabled',
        });
      });
    } else {
      this.error(RED._('blynk-ws-out-table.errors.missing-conf'));
    }
    this.on('input', function input(msg) {
      // no input operation if client not connected or disabled
      if (!node.blynkClient || !node.blynkClient.logged) {
        return;
      }

      if (msg.hasOwnProperty('payload')) {
        if (node.pin < 0 || node.pin > 255) {
          node.warn(RED._('blynk-ws-out-table.warn.pin-value'));
          return;
        }

        let msgkey;
        if (node.blynkClient.multi_cmd) {
          msgkey = node.blynkClient.startMsgMulti();
        }

        if (msg.hasOwnProperty('clear') && msg.clear === true) {
          this.rowIdx = 0;
          node.blynkClient.virtualWrite(node.pin, 'clr', msgkey);
        }
        if (msg.hasOwnProperty('add')) {
          const args = Array.isArray(msg.add) ? msg.add : ['', ''];
          const cmd = ['add', this.rowIdx];
          this.rowIdx++;
          node.blynkClient.virtualWrite(node.pin, cmd.concat(args), msgkey);
        }
        if (msg.hasOwnProperty('loadtable')) {
          const arrargs = Array.isArray(msg.loadtable) ? msg.loadtable : [];
          for (let i = 0; i < arrargs.length; i++) {
            const cmd = ['add', this.rowIdx];
            this.rowIdx++;
            if (Array.isArray(arrargs[i])) { // array - name : key
              node.blynkClient.virtualWrite(node.pin, cmd.concat(arrargs[i]), msgkey);
            } else { // array - name
              node.blynkClient.virtualWrite(node.pin, cmd.concat(arrargs[i], ' '), msgkey);
            }
          }
        }
        if (msg.hasOwnProperty('update')) {
          const args = Array.isArray(msg.update) ? msg.update : ['', ' ', ' '];
          if (args.length <= 2) args.concat(' ');
          const cmd = ['update'];
          node.blynkClient.virtualWrite(node.pin, cmd.concat(args), msgkey);
        }
        if (msg.hasOwnProperty('pick')) {
          if (Number.isInteger(msg.pick) && msg.pick >= 0) {
            node.blynkClient.virtualWrite(node.pin, ['pick', msg.pick.toString()], msgkey);
          }
        }
        if (msg.hasOwnProperty('select')) {
          if (Number.isInteger(msg.select) && msg.select >= 0) {
            node.blynkClient.virtualWrite(node.pin, ['select', msg.select.toString()], msgkey);
          }
        }
        if (msg.hasOwnProperty('deselect')) {
          if (Number.isInteger(msg.deselect) && msg.deselect >= 0) {
            node.blynkClient.virtualWrite(node.pin, ['deselect', msg.deselect.toString()], msgkey);
          }
        }

        if (msg.hasOwnProperty('order')) {
          const args = Array.isArray(msg.order) ? msg.order : [];
          if (args.length === 2) {
            const cmd = ['order'];
            node.blynkClient.virtualWrite(node.pin, cmd.concat(args), msgkey);
          }
        }

        if (node.blynkClient.multi_cmd) {
          node.blynkClient.sendMsgMulti(msgkey);
        }

        if (!msg.hasOwnProperty('clear') && !msg.hasOwnProperty('add') && !msg.hasOwnProperty('loadtable') && !msg.hasOwnProperty('update')
                && !msg.hasOwnProperty('pick') && !msg.hasOwnProperty('select') && !msg.hasOwnProperty('deselect') && !msg.hasOwnProperty('order') // eslint-disable-line max-len
                && msg.hasOwnProperty('payload')) {
          const payload = RED.util.ensureString(msg.payload);
          if (payload !== '' && payload.length > 1) {
            node.warn(RED._('blynk-ws-out-table.warn.payload'));
          }
        }
      }
    });
  }

  RED.nodes.registerType('blynk-ws-out-table', BlynkOutTableNode);
};
