/**
 * Mostly - apart from the Sunrise module on which this depends this is
 * copyright (c) Peter Scargill - but as I've had so many ideas from others -
 * consider it free to use for whatever purpose you like. If you redesign it
 * please remember to drop my name and link in there somewhere.
 * http://tech.scargill.net This software puts out one of two messages on change
 * of state which could be sent to the MQTT node and can be triggered by the
 * INJECT module (should be triggered once every minute)
 */

module.exports = function(RED) {
	"use strict";
	var SunCalc = require('suncalc');

	function SchedulerNode(n) {
		RED.nodes.createNode(this, n);
		var node = this;

		node.lat = n.lat;
		node.lon = n.lon;
		node.start = n.start;
		node.end = n.end;
		node.startt = n.starttime;
		node.endt = n.endtime;
		node.duskOff = n.duskoff;
		node.dawnOff = n.dawnoff;
		node.outtopic = n.outtopic;
		node.outPayload1 = n.outpayload1;
		node.outPayload2 = n.outpayload2;

		node.sun = n.sun;
		node.mon = n.mon;
		node.tue = n.tue;
		node.wed = n.wed;
		node.thu = n.thu;
		node.fri = n.fri;
		node.sat = n.sat;
		node.jan = n.jan;
		node.feb = n.feb;
		node.mar = n.mar;
		node.apr = n.apr;
		node.may = n.may;
		node.jun = n.jun;
		node.jul = n.jul;
		node.aug = n.aug;
		node.sep = n.sep;
		node.oct = n.oct;
		node.nov = n.nov;
		node.dec = n.dec;

		var ison = 0;
		var newEndTime = 0;

		node
				.on(
						"input",
						function(inmsg) {
							var now = new Date();
							var nowOff = -now.getTimezoneOffset() * 60000;
							var times = SunCalc.getTimes(now, node.lat,
									node.lon);
							var nowMillis = Date.UTC(now.getUTCFullYear(), now
									.getUTCMonth(), now.getUTCDate(), now
									.getUTCHours(), now.getUTCMinutes(), 1);
							var midnightMillis = Date.UTC(now.getUTCFullYear(),
									now.getUTCMonth(), now.getUTCDate(), 0, 1);
							var startMillis = Date.UTC(times[node.start]
									.getUTCFullYear(), times[node.start]
									.getUTCMonth(), times[node.start]
									.getUTCDate(), times[node.start]
									.getUTCHours(), times[node.start]
									.getUTCMinutes());
							var endMillis = Date.UTC(times[node.end]
									.getUTCFullYear(), times[node.end]
									.getUTCMonth(), times[node.end]
									.getUTCDate(), times[node.end]
									.getUTCHours(), times[node.end]
									.getUTCMinutes());

							nowMillis += nowOff;
							startMillis += nowOff;
							endMillis += nowOff;

							var outmsg = {
								payload : "",
								topic : ""
							};
							var outmsg2 = {
								payload : "",
								topic : "status"
							};

							var dawn = (((startMillis - midnightMillis) / 60000) + Number(node.dawnOff)) % 1440;
							var dusk = (((endMillis - midnightMillis) / 60000) + Number(node.duskOff)) % 1440;
							var today = (Math
									.round((nowMillis - midnightMillis) / 60000)) % 1440;
							var startTime = parseInt(node.startt, 10);
							var endTime = parseInt(node.endt, 10);

							if (startTime == 5000)
								startTime = dawn;
							if (startTime == 6000)
								startTime = dusk;
							if (endTime == 5000)
								endTime = dawn;
							if (endTime == 6000)
								endTime = dusk;
							if (inmsg.payload == "reset")
								ison = 0;

							var proceed;
							proceed = 0;

							switch (now.getDay()) {
							case 0:
								if (node.sun)
									proceed++;
								break;
							case 1:
								if (node.mon)
									proceed++;
								break;
							case 2:
								if (node.tue)
									proceed++;
								break;
							case 3:
								if (node.wed)
									proceed++;
								break;
							case 4:
								if (node.thu)
									proceed++;
								break;
							case 5:
								if (node.fri)
									proceed++;
								break;
							case 6:
								if (node.sat)
									proceed++;
								break;
							}

							if (proceed)
								switch (now.getMonth()) {
								case 0:
									if (node.jan)
										proceed++;
									break;
								case 1:
									if (node.feb)
										proceed++;
									break;
								case 2:
									if (node.mar)
										proceed++;
									break;
								case 3:
									if (node.apr)
										proceed++;
									break;
								case 4:
									if (node.may)
										proceed++;
									break;
								case 5:
									if (node.jun)
										proceed++;
									break;
								case 6:
									if (node.jul)
										proceed++;
									break;
								case 7:
									if (node.aug)
										proceed++;
									break;
								case 8:
									if (node.sep)
										proceed++;
									break;
								case 9:
									if (node.oct)
										proceed++;
									break;
								case 10:
									if (node.nov)
										proceed++;
									break;
								case 11:
									if (node.dec)
										proceed++;
									break;
								}

							if (proceed >= 2)
								proceed = 1;
							else
								proceed = 0;

							newEndTime = endTime;
							if (endTime > 10000)
								newEndTime = startTime + (endTime - 10000);

							if (proceed) // have to handle midnight wrap
							{
								if (startTime <= newEndTime) {
									if ((today >= startTime)
											&& (today <= newEndTime))
										proceed++;
								} else {
									if ((today >= startTime)
											|| (today <= newEndTime))
										proceed++;
								}
							}

							var duration = 0;
							if (proceed >= 2) {
								if (today <= newEndTime)
									duration = newEndTime - today;
								else
									duration = newEndTime + (1440 - today);
								node.status({
									fill : "yellow",
									shape : "dot",
									text : "on for " + duration + " mins"
								});
							} else {
								node.status({
									fill : "blue",
									shape : "dot",
									text : "off"
								});
							}

							outmsg.topic = node.outtopic;
							if (proceed >= 2) {							
								if (((ison == 0) || (ison == 1))) {
									outmsg.payload = node.outPayload1;
									ison = 2;
									outmsg2.payload = (ison - 1).toString();
									node.send([outmsg, outmsg2]);
								} else
								{
									outmsg2.payload = (ison - 1).toString();
									node.send([null, outmsg2]);
								}
								
							} else {
								if ((ison == 0) || (ison == 2)) {
									outmsg.payload = node.outPayload2;
									ison = 1;
									outmsg2.payload = (ison - 1).toString();
									node.send([outmsg, outmsg2]);
								} else
								{
									outmsg2.payload = (ison - 1).toString();
									node.send([null, outmsg2]);
								}
							}
						});

		var tock = setTimeout(function() {
			node.emit("input", {});
		}, 2000); // wait 2 secs before starting to let things settle down -
					// e.g. UI connect

		var tick = setInterval(function() {
			node.emit("input", {});
		}, 60000); // trigger every 60 secs

		node.on("close", function() {
			if (tock) {
				clearTimeout(tock);
			}
			if (tick) {
				clearInterval(tick);
			}
		});

	}

	RED.httpAdmin.post("/scheduler/:id", RED.auth
			.needsPermission("scheduler.write"), function(req, res) {
		var node = RED.nodes.getNode(req.params.id);
		if (node != null) {
			try {
				node.emit("input", {
					payload : "reset"
				});
				res.send(200);
			} catch (err) {
				res.send(500);
				node.error("Inject failed:" + err);
			}
		} else {
			res.send(404);
		}
	});

	RED.nodes.registerType("scheduler", SchedulerNode);
}
