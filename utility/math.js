exports.math = {}

exports.math.round = function(value, decimals) {
	return Number(Math.round(value + 'e' + decimals) + 'e-' + decimals);
}

console.log(exports.math.round(55.6666, 2));
