/*
// Copyright (C) 2016 - 2017 Lewis Watson <noki@zorque.xyz>
//
// This file is part of Twenti
//
// Twenti can not be copied and/or distributed without the express
// permission of Lewis Watson and/or Franco Paez
*/

exports.math = {}

exports.math.round = function(value, decimals) {
	return Number(Math.round(value + 'e' + decimals) + 'e-' + decimals);
}

console.log(exports.math.round(55.6666, 2));
