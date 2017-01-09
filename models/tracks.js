var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var TrackSchema = new Schema({
	name: String
});

module.exports = mongoose.model("Track", TrackSchema);
