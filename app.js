/*
// Copyright (C) 2016 - 2017 Lewis Watson <noki@zorque.xyz>
//
// This file is part of Twenti
//
// Twenti can not be copied and/or distributed without the express
// permission of Lewis Watson and/or Franco Paez
*/

var express 		= require("express");
var app 			= express();
var bodyParser		= require("body-parser");
var port 			= process.env.PORT || 3000;
var router			= express.Router();
var cassandra 		= require("./models/cassandra.js");

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

// Middleware for routes
router.use(function(req, res, next) {
	//console.log("Incoming connection");
	next();
});

router.use(require("./controllers"));
//router.use(require("./middlewares"));

app.use("/", router);

app.listen(port, function () {
	console.log("Ready to accept API requests on port " + port);
});