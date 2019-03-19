module.exports = function(RED) {
	"use strict";

	var blynkUtil = require('./../libs/blynk-util.js');

	function BlynkImageGalleryNode(n) {
		RED.nodes.createNode(this, n);
		var node = this;
		this.client = n.client;
		this.pin = n.pin;
		this.onlabel = n.onlabel;
		this.offlabel = n.offlabel;
		this.oncolor = n.oncolor;
		this.onbackcolor = n.onbackcolor;
		this.offcolor = n.offcolor;
		this.offbackcolor = n.offbackcolor;
		this.nodeType = "image-gallery";
        
		this.connected_label = RED._("blynk-ws-image-gallery.status.connected-fixed") + this.pin; 

		this.blynkClient = RED.nodes.getNode(this.client);
		if (this.blynkClient) {
			//this.blynkClient.registerInputNode(this);
			this.blynkClient.on("opened", function(n) {
				node.status({
					fill: "yellow",
					shape: "dot",
					text: RED._("blynk-ws-image-gallery.status.connecting") + n
				});
			});
			this.blynkClient.on("connected", function() {
				node.status({
					fill: "green",
					shape: "dot",
					text: node.connected_label
				});
			});
			this.blynkClient.on("error", function() {
				node.status({
					fill: "red",
					shape: "ring",
					text: "blynk-ws-image-gallery.status.error"
				});
			});
			this.blynkClient.on("closed", function() {
				node.status({
					fill: "red",
					shape: "ring",
					text: "blynk-ws-image-gallery.status.disconnected"
				});
			});
			this.blynkClient.on("disabled", function() {
				node.status({
					fill: "red",
					shape: "dot",
					text: "blynk-ws-image-gallery.status.disabled"
				});
			});
		} else {
			this.error(RED._("blynk-ws-image-gallery.errors.missing-conf"));
		}

		this.on("input", function(msg) {

			//no input operation if client not connected or disabled
			if(!node.blynkClient || !node.blynkClient.logged) {
				return; 
			}
				
			if (msg.hasOwnProperty("payload") || msg.hasOwnProperty("topic")) {
				var topic = RED.util.ensureString(msg.topic);

				//virtualwrite to node
				if (topic != "write-property" ) {
					var payload = RED.util.ensureString(msg.payload);
					if(payload === "true")  payload = "1";
					if(payload === "false") payload = "0";
					/*
					if(!blynkUtil.check01(payload)) {
						node.warn("style button receive [" + payload + "] but cannot convert to 0/1 value");
						return;
					}*/
					node.blynkClient.virtualWrite(node.pin, payload);
					return;
				}

				//set property to node
				var pin = node.pin;

				//multiple property by code
				var msgkey = undefined;
				if(node.blynkClient.multi_cmd) {
					msgkey = node.blynkClient.startMsgMulti();
				} 

				//image gallery widget (need server v0.40.x ??)
				if (msg.hasOwnProperty("imgid") && msg.hasOwnProperty("url")) {
					var imgid = RED.util.ensureString(msg.imgid);
					var url = RED.util.ensureString(msg.url);
					node.blynkClient.setProperty(pin, "url", [imgid, url], msgkey);
				}
				else if (msg.hasOwnProperty("opacity")) {
					var opacity = RED.util.ensureString(msg.opacity);
					if(blynkUtil.checkRangeInt(opacity, 0, 100))
						node.blynkClient.setProperty(pin, "opacity", opacity, msgkey);
				}
				else if (msg.hasOwnProperty("scale")) {
					var scale = RED.util.ensureString(msg.scale);
					if(blynkUtil.checkRangeInt(scale, 0, 100))
						node.blynkClient.setProperty(pin, "scale", scale, msgkey);
				}
				else if (msg.hasOwnProperty("rotation")) {
					var rotation = RED.util.ensureString(msg.rotation);
					if(blynkUtil.checkRangeInt(rotation, 0, 360))
						node.blynkClient.setProperty(pin, "rotation", rotation, msgkey);
				}
				else if (msg.hasOwnProperty("urls") && Array.isArray(msg.urls)) {
					node.blynkClient.setProperty(pin, "urls", msg.urls, msgkey);
				}

				if(node.blynkClient.multi_cmd) {
					node.blynkClient.sendMsgMulti(msgkey);
				} 

				
			}
		});

		/*
		this.on("close", function() {
			if(node.blynkClient) {
				node.blynkClient.removeInputNode(node);
			}
		});
		*/
	}
	
	RED.nodes.registerType("blynk-ws-image-gallery", BlynkImageGalleryNode);
};