"use strict";
const ObjectID = require("mongodb").ObjectID;

const Project = require("../models/project");
const Issue = require("../models/issue");
const messages = require("../constants/messages");

const convertIssue = (issue) => {
  const {
    _id,
    title,
    text,
    created_on,
    updated_on,
    created_by,
    assigned_to,
    open,
    status,
  } = issue;

  return {
    _id,
    issue_title: title,
    issue_text: text,
    created_on,
    updated_on,
    created_by,
    assigned_to,
    open,
    status_text: status,
  };
};

module.exports = (app) => {
  app
    .route("/api/issues/:project")
    .get(async (req, res) => {
      const projectName = req.params.project;
      const {
        _id,
        issue_title,
        issue_text,
        created_by,
        assigned_to,
        open,
        status_text,
      } = req.query;

      try {
        const project = await Project.findOne({ name: projectName });
        let currentProject;

        if (!project) {
          const newProject = new Project({ name: projectName });
          await newProject.save();
          currentProject = newProject;
        } else {
          currentProject = project;
        }

        const issueIdToSearch = ObjectID(_id);

        const issues = await Issue.aggregate([
          { $match: { project_id: ObjectID(currentProject._id) } },
          _id === undefined
            ? { $match: {} }
            : { $match: { _id: issueIdToSearch } },
          issue_title === undefined
            ? { $match: {} }
            : { $match: { title: issue_title } },
          issue_text === undefined
            ? { $match: {} }
            : { $match: { text: issue_text } },
          open === undefined
            ? { $match: {} }
            : { $match: { open: open.toLowerCase() === "true" } },
          created_by === undefined
            ? { $match: {} }
            : { $match: { created_by } },
          assigned_to === undefined
            ? { $match: {} }
            : { $match: { assigned_to } },
          status_text === undefined
            ? { $match: {} }
            : { $match: { status: status_text } },
        ]);

        if (issues.length === 0) {
          return res.json([]);
        }

        const responseIssues = issues.map((issue) => {
          return convertIssue(issue);
        });

        return res.json(responseIssues);
      } catch (err) {
        return res.json({ error: err.message });
      }
    })
    .post(async (req, res) => {
      const projectName = req.params.project;
      const { issue_title, issue_text, created_by, assigned_to, status_text } =
        req.body;

      if (!issue_title || !issue_text || !created_by) {
        return res.json({ error: messages.MISSING_FIELD });
      }

      try {
        const project = await Project.findOne({ name: projectName });
        let currentProject;

        if (!project) {
          const newProject = new Project({ name: projectName });
          await newProject.save();
          currentProject = newProject;
        } else {
          currentProject = project;
        }

        const newIssue = new Issue({
          title: issue_title,
          text: issue_text,
          created_by,
          assigned_to: assigned_to || "",
          created_on: new Date(),
          updated_on: new Date(),
          open: true,
          status: status_text || "",
          project_id: currentProject._id,
        });

        await newIssue.save();
        const returnedIssue = convertIssue(newIssue);

        return res.json(returnedIssue);
      } catch (err) {
        return res.json({ error: err.message });
      }
    })
    .put(async (req, res) => {
      const projectName = req.params.project;
      const {
        _id,
        issue_title,
        issue_text,
        created_by,
        assigned_to,
        status_text,
        open,
      } = req.body;

      if (!_id) {
        return res.json({ error: messages.MISSING_ID });
      }

      if (
        !issue_title &&
        !issue_text &&
        !created_by &&
        !assigned_to &&
        !status_text &&
        !open
      ) {
        return res.json({
          error: messages.NO_UPDATE_FIELD,
          _id,
        });
      }

      try {
        const project = await Project.findOne({ name: projectName });

        if (!project) {
          return res.json({
            error: messages.COULD_NOT_UPDATE,
            _id,
          });
        }

        const issue = await Issue.findById(_id);

        if (!issue) {
          return res.json({
            error: messages.COULD_NOT_UPDATE,
            _id,
          });
        }

        issue.title = issue_title || issue.title;
        issue.text = issue_text || issue.text;
        issue.created_by = created_by || issue.created_by;
        issue.assigned_to = assigned_to || issue.assigned_to;
        issue.status = status_text || issue.status;
        issue.updated_on = new Date();

        if (open) {
          // open from req.body is a string therefore it needs to be converted to boolean
          const isOpen = open.toLowerCase() === "true" ? true : false;
          issue.open = isOpen;
        }

        await issue.save();

        return res.json({
          result: messages.UPDATE_SUCCESS,
          _id,
        });
      } catch (err) {
        return res.json({
          error: messages.COULD_NOT_UPDATE,
          _id,
        });
      }
    })
    .delete(async (req, res) => {
      const projectName = req.params.project;
      const issueId = req.body._id;

      if (!issueId) {
        return res.json({ error: messages.MISSING_ID });
      }

      try {
        const project = await Project.findOne({ name: projectName });

        if (!project) {
          return res.json({
            error: messages.COULD_NOT_DELETE,
            _id: issueId,
          });
        }

        const issue = await Issue.findById(issueId);

        if (!issue) {
          return res.json({
            error: messages.COULD_NOT_DELETE,
            _id: issueId,
          });
        }

        await Issue.deleteOne({ _id: issueId });

        return res.json({
          result: messages.DELETE_SUCCESS,
          _id: issueId,
        });
      } catch (err) {
        return res.json({
          error: messages.COULD_NOT_DELETE,
          _id: issueId,
        });
      }
    });
};
