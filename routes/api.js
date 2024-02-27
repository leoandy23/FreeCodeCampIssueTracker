/*
 *
 *
 *       Complete the API routing below
 *
 *
 */

"use strict";

const expect = require("chai").expect;
const MongoClient = require("mongodb");
const ObjectId = require("mongodb").ObjectID;
const { getDb: db } = require("../utils/database.js");

const CONNECTION_STRING = process.env.DB; //MongoClient.connect(CONNECTION_STRING, function(err, db) {})

const validateInputFields = (inputs, errorsArray = []) => {
  for (let property in inputs) {
    inputs[property] = inputs[property].trim();
  }
  const { issue_title, issue_text, created_by, assigned_to, status_text } =
    inputs;
  if (!(issue_title && issue_text && created_by)) {
    errorsArray.push(" missing fields");
    return;
  }
  if (issue_title.length < 1 || issue_title.length > 100) {
    errorsArray.push(" title field is required");
  }
  if (issue_text.length < 3 || issue_text.length > 600) {
    errorsArray.push(" text field is required");
  }
  if (created_by.length < 3 || created_by.length > 100) {
    errorsArray.push(" Created_by field is required");
  }
  if (assigned_to && assigned_to.length > 30) {
    errorsArray.push(" assigned_to maximum characters length 30");
  }
  if (status_text && status_text.length > 16) {
    errorsArray.push(" status_text maximum characters length 16");
  }
};

const validateInputFieldsUpdate = (inputs, errorsArray = []) => {
  for (let property in inputs) {
    if (typeof inputs[property] === "string")
      inputs[property] = inputs[property].trim();
  }

  const { _id, issue_title, issue_text, created_by, assigned_to, status_text } =
    inputs;

  if (_id && _id.length !== 24) {
    errorsArray.push("invalid id");
  }
  if (issue_title && issue_title.length > 100) {
    errorsArray.push(" title fmaximum characters length 100");
  }
  if (issue_text && issue_text.length > 600) {
    errorsArray.push(" text maximum characters length 600");
  }
  if (created_by && created_by.length > 100) {
    errorsArray.push(" Created_by maximum characters length 100");
  }
  if (assigned_to && assigned_to.length > 30) {
    errorsArray.push(" assigned_to maximum characters length 30");
  }
  if (status_text && status_text.length > 16) {
    errorsArray.push(" status_text maximum characters length 16");
  }
};

const ifFieldsValidationFails = (errorsArray) => {
  console.log(errorsArray);
  if (errorsArray.length > 0) {
    const valErrors = errorsArray.join();
    throw valErrors;
  }
};

module.exports = function (app) {
  app
    .route("/api/issues/:project")
    .get(async (req, res) => {
      try {
        const project = req.params.project;
        const query = { project };

        const queryFilters =
          /^(_id|open|created_by|assigned_to|issue_title|status_text)$/;
        for (let property in req.query) {
          if (queryFilters.test(property)) {
            query[property] = req.query[property];
          }
        }
        if (query._id) {
          query._id = new ObjectId(query._id);
        }
        if (query.hasOwnProperty("open")) {
          query.open = query.open === "true" ? true : false;
        }

        const issues = await db()
          .collection("issues_tracker")
          .find(query, { sort: { updated_on: -1 } })
          .toArray();
        return res.status(200).json(issues);
      } catch (err) {
        res.status(500).json("database err");
      }
    })

    .post(async (req, res) => {
      try {
        const validationErrors = [];
        validateInputFields(req.body, validationErrors);
        ifFieldsValidationFails(validationErrors);

        const newIssue = {
          issue_title: req.body.issue_title,
          issue_text: req.body.issue_text,
          created_by: req.body.created_by,
          assigned_to: req.body.assigned_to || "",
          status_text: req.body.status_text || "",
          open: true,
          project: req.params.project,
          created_on: new Date(),
          updated_on: new Date(),
        };
        const result = await db()
          .collection("issues_tracker")
          .insertOne(newIssue);
        const { project, ...createdIssue } = result.ops[0];
        return res.status(200).json({ ...createdIssue });
      } catch (err) {
        console.log("val error===============", err);
        return res.status(200).type("text").send("missing inputs");
      }
    })

    .put(async (req, res) => {
      try {
        const project = req.params.project;
        const validationErrors = [];
        validateInputFieldsUpdate(req.body, validationErrors);
        ifFieldsValidationFails(validationErrors);
        const { _id } = req.body;
        const issue = await db()
          .collection("issues_tracker")
          .findOne({ _id: new ObjectId(_id) });
        if (!issue) {
          return res.status(200).type("text").send("no updated field sent");
        }

        let open;
        if (req.body.hasOwnProperty("open")) {
          open =
            req.body.open === "true"
              ? true
              : req.body.open === true
              ? true
              : req.body.open === "false"
              ? false
              : req.body.open === false
              ? false
              : false;
        } else {
          open = issue.open;
        }
        const issueUpdates = {
          issue_title: req.body.issue_title || issue.issue_title,
          issue_text: req.body.issue_text || issue.issue_text,
          created_by: req.body.created_by || issue.created_by,
          assigned_to: req.body.assigned_to || issue.assigned_to,
          status_text: req.body.status_text || issue.status_text,
          updated_on: new Date(),
          open,
        };

        const updateResult = await db()
          .collection("issues_tracker")
          .findOneAndUpdate(
            { _id: new ObjectId(_id) },
            { $set: { ...issueUpdates } },
            { returnOriginal: false }
          );
        if (!updateResult) {
          return res.status(200).json("unable to update issue");
        }

        const { project: omited, ...updatedIssue } = updateResult.value;
        return res.status(200).type("text").send("successfully updated");
        //.json({ message:'successfully updated', ...updatedIssue })
      } catch (err) {
        console.log("update error===============", err);
        return res.status(200).type("text").send("no updated field sent");
      }
    })

    .delete(async (req, res) => {
      try {
        const project = req.params.project;
        const _id = req.body._id;
        if (_id.length !== 24) {
          return res.status(200).type("text").send("_id error");
        }

        const result = await db()
          .collection("issues_tracker")
          .findOneAndDelete({ _id: new ObjectId(_id) });
        if (!result.value) {
          return res.status(200).type("text").send("Unable to delete issue");
        }

        return res
          .status(200)
          .type("text")
          .send("deleted " + req.body._id);
      } catch (err) {
        return res
          .status(200)
          .type("text")
          .send(`could not delete ${req.body._id}`);
      }
    });
};
