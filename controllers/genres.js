/*
// Copyright (C) 2016 - 2017 Lewis Watson <noki@zorque.xyz>
//
// This file is part of Twenti
//
// Twenti can not be copied and/or distributed without the express
// permission of Lewis Watson and/or Franco Paez
*/

var Genres 		= {};
var postgre 	= require("../models/postgre.js");
var db			= postgre.db;
var __cache 	= require("../models/cache.js");

Genres.getAll = function(req, res) {
	__cache.get("genres", function(err, value) {
		if (err) {
			db.many("SELECT A.genreid AS parentid, A.name AS parentname, B.genreid AS genreid, B.name as genrename FROM genres A, genres B WHERE A.genreid = B.parent")
				.then(function(data) {

					// May God (and anyone who stumbles upon this) have mercy on my soul
					// If unelegance was an art form, then I would be an artist

					var seen = [];

					for (var i = 0; i < data.length; i++) {
						var cur = data[i];

						var genreIndex = null;
						var subInSub = null;

						for (var k = 0; k < seen.length; k++) {
							var subgenres = seen[k].subgenres;
							for (var q = 0; q < subgenres.length; q++) {
								if (subgenres[q].genreid == cur.parentid) {
									subInSub = true;
									if (typeof(subgenres[q].subgenres) != "object") {
										subgenres[q].subgenres = [];
									}
									subgenres[q].subgenres.push({
											genreid: cur.genreid,
											name: cur.genrename
									});
								}
							}
							if (seen[k].genreid == cur.parentid) {
								genreIndex = k;
								break;
							}
						}
						if (typeof(genreIndex) == "number") {
							seen[genreIndex].subgenres.push({genreid: cur.genreid,	name: cur.genrename});
						}
						else if (!subInSub) {
							seen.push({
								genreid: cur.parentid,
								name: cur.parentname,
								subgenres: [
									{
										genreid: cur.genreid,
										name: cur.genrename
									}
								]
							});
						}
					}

					/*
					{
						data: {
							genres: [
								{
									"genreid": 1,
									"genrename": "House",
									"subgenres": [
										{
											"genreid": 2,
											"genreid": "Future House"
										},
										{
											"genreid": 3,
											"genreid": "Progressive House"
										},
										{
											"genreid": 4,
											"genreid": "Acid House"
										}
									]
								}
							]
						}
					};
					/*
					//
					for (var i = 0; i < data.length; i++) {
						var cur = data[i];
						if (cur.parentid in seen) {
							seen[cur.parentid].push({genreid: cur.genreid, genrename: cur.genrename});
						}
						else {
							seen[cur.parentid] = [{genreid: cur.genreid, genrename: cur.genrename}];
						}
					}
					*/

					res.json(
						{
							data: {
								genres: seen
							}
						}
					);
				})
				.catch(function(err) {
					console.log(err);
				})
		}
		else {
			
		}
	});
}

module.exports = {
	getAll: Genres.getAll
};