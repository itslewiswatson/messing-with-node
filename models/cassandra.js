/*
// Copyright (C) 2016 - 2017 Lewis Watson <noki@zorque.xyz>
//
// This file is part of Twenti
//
// Twenti can not be copied and/or distributed without the express
// permission of Lewis Watson and/or Franco Paez
*/

const cassandra = require("cassandra-driver");
const PlainTextAuthProvider = cassandra.auth.PlainTextAuthProvider;
var fs = require("fs");

if (!fs.existsSync("config.json")) {
	console.error("Please create 'config.json'");
}
var config = JSON.parse(fs.readFileSync("config.json", "utf8"));

const client = new cassandra.Client({contactPoints: config.hosts, keyspace: config.keyspace, authProvider: new PlainTextAuthProvider(config.usr, config.passwd)});
client.connect(function (err) {
	if (err) return console.error(err);
	console.log("Connected to cluster with %d host(s): %j", client.hosts.length, client.hosts.keys());
});

module.exports = client;