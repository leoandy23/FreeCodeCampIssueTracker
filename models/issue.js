const { ObjectId } = require("mongodb");
const mongoose = require("mongoose");

const issueSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  text: {
    type: String,
    required: true,
  },
  created_on: Date,
  updated_on: Date,
  created_by: String,
  assigned_to: String,
  open: Boolean,
  status: String,
  project_id: ObjectId,
});

const Issue = mongoose.model("Issue", issueSchema);

module.exports = Issue;
