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

router.route("/genres")
	.get(function(req, res, next) {
		res.json({message: "api.twenti.co"});
	});

router.route("/genres/:id")
	.get(function(req, res) {
		res.json({message: "api.twenti.co"});
	});

module.exports = router;