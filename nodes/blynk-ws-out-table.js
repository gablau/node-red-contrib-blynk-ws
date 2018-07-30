module.exports = function(RED) {
	"use strict";

	/* Table Widget*/
	function BlynkOutTableNode(n) {
		RED.nodes.createNode(this, n);
		var node = this;
		this.client = n.client;
		this.pin = n.pin;
		this.rowIdx = 0;
    
		this.blynkClient = RED.nodes.getNode(this.client);
		if (this.blynkClient) {
			this.blynkClient.registerGenericNode(this, 'table');
			
			this.blynkClient.on("opened", function(n) {
				node.status({
					fill: "yellow",
					shape: "dot",
					text: RED._("blynk-ws-out-table.status.connecting") + n
				});
			});
			this.blynkClient.on("connected", function() {
				node.status({
					fill: "green",
					shape: "dot",
					text: RED._("blynk-ws-out-table.status.connected") + node.pin
				});
			});
			this.blynkClient.on("error", function() {
				node.status({
					fill: "red",
					shape: "ring",
					text: "blynk-ws-out-table.status.error"
				});
			});
			this.blynkClient.on("closed", function() {
				node.status({
					fill: "red",
					shape: "ring",
					text: "blynk-ws-out-table.status.disconnected"
				});
			});
		}
		else {
			this.error(RED._("blynk-ws-out-table.errors.missing-conf"));
		}
		this.on("input", function(msg) {
			if (msg.hasOwnProperty("payload") && node.blynkClient && node.blynkClient.logged) {
				var payload = Buffer.isBuffer(msg.payload) ? msg.payload : RED.util.ensureString(msg.payload);
				
				if(node.pin<0 || node.pin>127) {
					node.warn(RED._("blynk-ws-out-table.warn.pin-value"));
					return;
				}

				var msgkey = undefined;
				if(node.blynkClient.multi_cmd) {
					msgkey = node.blynkClient.startMsgMulti();
				} 

				if (msg.hasOwnProperty("clear") && msg.clear == true) {
					node.blynkClient.virtualWrite(node.pin, "clr", msgkey);
				}
				if (msg.hasOwnProperty("add")) {
					var args = Array.isArray(msg.add) ? msg.add : ["",""];
					var cmd = ["add", this.rowIdx];
					this.rowIdx++;
					node.blynkClient.virtualWrite(node.pin, cmd.concat(args), msgkey);
				}
				if (msg.hasOwnProperty("loadtable")) {
					var arrargs = Array.isArray(msg.loadtable) ? msg.loadtable : [];
					for(var i=0; i<arrargs.length; i++) {
						var cmd = ["add", this.rowIdx];
						this.rowIdx++;
						if(Array.isArray(arrargs[i])) { //array - name : key
							node.blynkClient.virtualWrite(node.pin, cmd.concat(arrargs[i]), msgkey);
						}
						else{ //array - name
							node.blynkClient.virtualWrite(node.pin, cmd.concat(arrargs[i]," "), msgkey);
						}
					}
				}
				if (msg.hasOwnProperty("update")) {
					var args = Array.isArray(msg.update) ? msg.update : [""," "," "];
					if(args.length<=2) args.concat(" ");
					var cmd = ["update"];
					node.blynkClient.virtualWrite(node.pin, cmd.concat(args), msgkey);
				}
				if (msg.hasOwnProperty("pick")) {
					if(Number.isInteger(msg.pick) && msg.pick>=0) {
						node.blynkClient.virtualWrite(node.pin, ["pick", msg.pick.toString()], msgkey);
					}
				}
				if (msg.hasOwnProperty("select")) {
					if(Number.isInteger(msg.select) && msg.select>=0) {
						node.blynkClient.virtualWrite(node.pin, ["select", msg.select.toString()], msgkey);
					}
				}
				if (msg.hasOwnProperty("deselect")) {
					if(Number.isInteger(msg.deselect) && msg.deselect>=0) {
						node.blynkClient.virtualWrite(node.pin, ["deselect", msg.deselect.toString()], msgkey);
					}
				}

				if (msg.hasOwnProperty("order")) {
					var args = Array.isArray(msg.order) ? msg.order : [];
					if(args.length==2) {
						var cmd = ["order"];
						node.blynkClient.virtualWrite(node.pin, cmd.concat(args), msgkey);
					}
				}

				if(node.blynkClient.multi_cmd) {
					node.blynkClient.sendMsgMulti(msgkey);
				} 
			}
		});
	}

	RED.nodes.registerType("blynk-ws-out-table", BlynkOutTableNode);
};