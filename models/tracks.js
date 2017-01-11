var mongoose = require("mongoose");
mongoose.Promise = global.Promise;
var Schema = mongoose.Schema;

var TrackSchema = new Schema({
	name: String
});

module.exports = mongoose.model("Track", TrackSchema, "tracks");
