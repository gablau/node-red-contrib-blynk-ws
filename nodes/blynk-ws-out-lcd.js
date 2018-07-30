module.exports = function(RED) {
	"use strict";

	/* LCD Widget*/
	function BlynkOutLCDNode(n) {
		RED.nodes.createNode(this, n);
		var node = this;
		this.client = n.client;
		this.pin = n.pin;

		this.blynkClient = RED.nodes.getNode(this.client);
		if (this.blynkClient) {
			this.blynkClient.registerGenericNode(this, 'LCD');
			
			this.blynkClient.on("opened", function(n) {
				node.status({
					fill: "yellow",
					shape: "dot",
					text: RED._("blynk-ws-out-lcd.status.connecting") + n
				});
			});
			this.blynkClient.on("connected", function() {
				node.status({
					fill: "green",
					shape: "dot",
					text: RED._("blynk-ws-out-lcd.status.connected-fixed") + node.pin
				});
			});
			this.blynkClient.on("error", function() {
				node.status({
					fill: "red",
					shape: "ring",
					text: "blynk-ws-out-lcd.status.error"
				});
			});
			this.blynkClient.on("closed", function() {
				node.status({
					fill: "red",
					shape: "ring",
					text: "blynk-ws-out-lcd.status.disconnected"
				});
			});
		}
		else {
			this.error(RED._("blynk-ws-out-lcd.errors.missing-conf"));
		}
		this.on("input", function(msg) {
			if (msg.hasOwnProperty("payload") && node.blynkClient && node.blynkClient.logged) {
				var payload = Buffer.isBuffer(msg.payload) ? msg.payload : RED.util.ensureString(msg.payload);
				
				if(node.pin<0 || node.pin>127) {
					node.warn(RED._("blynk-ws-out-lcd.warn.pin-value"));
					return;
				}

				var msgkey = undefined;
				if(node.blynkClient.multi_cmd) {
					msgkey = node.blynkClient.startMsgMulti();
				} 

				if (msg.hasOwnProperty("clear") && msg.clear == true) {
					node.blynkClient.virtualWrite(node.pin, "clr", msgkey);
				}
				if (msg.hasOwnProperty("text")) {
					var text = Buffer.isBuffer(msg.text) ? msg.text : RED.util.ensureString(msg.text);
                  
					var x=0;
					if (msg.hasOwnProperty("x")) {
						if(msg.x<0) x=0;
						else if(msg.x>15) x=15;
						else x=msg.x; 
					}
                  
					var y=0;
					if (msg.hasOwnProperty("y")) {
						if(msg.y<0) y=0;
						else if(msg.y>1) y=1;
						else y=msg.y;  
					}
                  
					var rawdata = ["p", x, y, text];
					node.blynkClient.virtualWrite(node.pin, rawdata, msgkey);
				}
                
				if (msg.hasOwnProperty("text1")) {
					var text1 = Buffer.isBuffer(msg.text1) ? msg.text : RED.util.ensureString(msg.text1);
                  
					var x1=0;
					if (msg.hasOwnProperty("x1")) {
						if(msg.x1<0) x1=0;
						else if(msg.x1>15) x1=15;
						else x1=msg.x1; 
					}
                  
					var y1=1;
					if (msg.hasOwnProperty("y1")) {
						if(msg.y1<0) y1=0;
						else if(msg.y1>1) y1=1;
						else y1=msg.y1;  
					}
                  
					var rawdata1 = ["p", x1, y1, text1];
					node.blynkClient.virtualWrite(node.pin, rawdata1, msgkey);
				}

				if(node.blynkClient.multi_cmd) {
					node.blynkClient.sendMsgMulti(msgkey);
				} 
                
				if(!msg.hasOwnProperty("text") && !msg.hasOwnProperty("text1") && !msg.hasOwnProperty("clear") && msg.hasOwnProperty("payload")){
					var payload = Buffer.isBuffer(msg.payload) ? msg.payload : RED.util.ensureString(msg.payload);
					if(payload != "" && payload.length > 1 ){
						node.warn(RED._("blynk-ws-out-lcd.warn.payload"));
					}
				}
			}
		});
	}

	RED.nodes.registerType("blynk-ws-out-lcd", BlynkOutLCDNode); 
};