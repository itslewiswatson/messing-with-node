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

router.route("/users")
	.post(function(req, res) {
		res.json(
			{
				"response": {
					"data": null
				}
			}
		);
	})
	.get(function(req, res) {
		res.json(
			{
				message: "get"
			}
		);
	})
	.put(function(req, res) {
		res.json({message: "put"});
	})
	.delete(function(req, res) {
		res.json({message: "delete"});
	});

router.route("/users/:id")
	.get(function(req, res) {
		var ids = req.params.id;
		var split = ids.split(GET_MANY_SEPARATOR);
		if (split && split.length && split.length > 1) {
			users.getMany(req, res);
		}
		else {
			users.getSingle(req, res);
		}
	});

module.exports = router;