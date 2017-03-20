/*
// Copyright (C) 2016 - 2017 Lewis Watson <noki@zorque.xyz>
//
// This file is part of Twenti
//
// Twenti can not be copied and/or distributed without the express
// permission of Lewis Watson and/or Franco Paez
*/

/*
var promise = require("bluebird");
var fs      = require("fs");

var options = {
	promiseLib: promise
};

if (fs.existsSync("example.config.json") && !fs.existsSync("config.json")) {
	console.log("Please rename 'example.config.json' to 'config.json'");
}
var config = JSON.parse(fs.readFileSync("config.json", "utf8"));

var pgp = require("pg-promise")(options);
var connectionString = "postgres://" + config.usr + ":" + config.passwd + "@" + config.host + ":" + config.port + "/" + config.database;
var db = pgp(connectionString);

// This is just here to test the connection to the PostgreSQL database
db.one("select now()")
	.then(function (data) {
		console.log("Successfully connected to PostgreSQL server");
	})
	.catch(function (err) {
		console.log("Could not connect to the PostgreSQL server");
	});

module.exports = {
	db: db,
	pgp: pgp
}
*/