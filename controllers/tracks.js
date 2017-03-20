/*
// Copyright (C) 2016 - 2017 Lewis Watson <noki@zorque.xyz>
//
// This file is part of Twenti
//
// Twenti can not be copied and/or distributed without the express
// permission of Lewis Watson and/or Franco Paez
*/

var express = require("express");
var router = express.Router();

const GET_MANY_SEPARATOR = ",";

router.route("/tracks")
	.get(function(req, res) {
		res.json({message: "get"});
	});

router.route("/tracks/:id")
	.get(function(req, res) {
		var ids = req.params.id;
		var split = ids.split(GET_MANY_SEPARATOR);
		if (split && split.length && split.length > 1) {
			res.json({message: "get"});
		}
		else {
			res.json({message: "get"});
		}
	});

module.exports = router;