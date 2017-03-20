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

// Include all other routes here
router.use(require("./genres.js"));
router.use(require("./tracks.js"));
router.use(require("./users.js"));

router.route("/")
	.get(function(req, res, next) {
		res.json({message: "api.twenti.co"});
	})

module.exports = router;