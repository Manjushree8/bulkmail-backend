const mongoose = require("mongoose");

const emailSchema = new mongoose.Schema({
  subject: String,
  body: String,
  recipients: [String],
  status: String,
}, { timestamps: true }); // <-- Required for createdAt

module.exports = mongoose.model("EmailRecord", emailSchema);
