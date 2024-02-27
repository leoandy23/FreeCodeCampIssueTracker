const chaiHttp = require("chai-http");
const chai = require("chai");
const assert = chai.assert;
const server = require("../server");

const messages = require("../constants/messages");

chai.use(chaiHttp);

let deleteId;

suite("Functional Tests", function () {
  suite("Test POST /api/issues/{project}", () => {
    test("Create Issue with Every Field", (done) => {
      chai
        .request(server)
        .post("/api/issues/test")
        .send({
          issue_title: "title",
          issue_text: "text",
          created_by: "Joe",
          assigned_to: "Tom",
          status_text: "In progress",
        })
        .end((err, res) => {
          deleteId = res.body._id;

          assert.equal(res.status, 200);
          assert.equal(res.body.issue_title, "title");
          assert.equal(res.body.issue_text, "text");
          assert.equal(res.body.created_by, "Joe");
          assert.equal(res.body.assigned_to, "Tom");
          assert.equal(res.body.status_text, "In progress");
          done();
        });
    });

    test("Create Issue with Required Fields", (done) => {
      chai
        .request(server)
        .post("/api/issues/test")
        .send({
          issue_title: "test",
          issue_text: "test",
          created_by: "Joe",
        })
        .end((err, res) => {
          assert.equal(res.status, 200);
          assert.equal(res.body.issue_title, "test");
          assert.equal(res.body.issue_text, "test");
          assert.equal(res.body.created_by, "Joe");
          assert.equal(res.body.assigned_to, "");
          assert.equal(res.body.status_text, "");
          done();
        });
    });

    test("Create Issue with Missing Required Fields", (done) => {
      chai
        .request(server)
        .post("/api/issues/test-get")
        .send({
          issue_title: "",
          issue_text: "",
          created_by: "",
          assigned_to: "Tom",
          status_text: "Work in progress",
        })
        .end((err, res) => {
          assert.equal(res.status, 200);
          assert.equal(res.body.error, messages.MISSING_FIELD);
          done();
        });
    });
  });

  suite("Test GET /api/issues/{project}", () => {
    test("View Issues on Project", (done) => {
      chai
        .request(server)
        .get("/api/issues/test")
        .end((err, res) => {
          console.log(res.body.length);
          assert.equal(res.status, 200);
          assert.equal(res.body.length, 20);
          done();
        });
    });

    test("View Issues with One Filter", (done) => {
      chai
        .request(server)
        .get("/api/issues/test")
        .query({ issue_title: "test" })
        .end((err, res) => {
          assert.equal(res.status, 200);
          assert.equal(res.body.length, 19);
          done();
        });
    });

    test("View Issues with Multiple Filter", (done) => {
      chai
        .request(server)
        .get("/api/issues/test")
        .query({
          title: "test",
          created_by: "Joe",
        })
        .end((err, res) => {
          const issue = res.body[0];
          console.log(issue);
          assert.equal(res.status, 200);
          assert.equal(issue.issue_title, "test");
          assert.equal(issue.created_by, "Joe");
          assert.equal(issue.status_text, "");
          done();
        });
    });
  });

  suite("Test PUT /api/issues/{project}", () => {
    test("Update One Field of an Issue", (done) => {
      chai
        .request(server)
        .put("/api/issues/test")
        .send({
          _id: "65dd662b123f20685839be87",
          status_text: "Changed",
        })
        .end((err, res) => {
          assert.equal(res.status, 200);
          assert.equal(res.body.result, messages.UPDATE_SUCCESS);
          assert.equal(res.body._id, "65dd662b123f20685839be87");
          done();
        });
    });

    test("Update Multiple Fields of an Issue", (done) => {
      chai
        .request(server)
        .put("/api/issues/test")
        .send({
          _id: "65dd662b123f20685839be87",
          title: "New Title",
          status_text: "In progress",
        })
        .end((err, res) => {
          assert.equal(res.status, 200);
          assert.equal(res.body.result, messages.UPDATE_SUCCESS);
          assert.equal(res.body._id, "65dd662b123f20685839be87");
          done();
        });
    });

    test("Update Issue with Missing _id", (done) => {
      chai
        .request(server)
        .put("/api/issues/test")
        .send({
          status_text: "Done",
        })
        .end((err, res) => {
          assert.equal(res.status, 200);
          assert.equal(res.body.error, messages.MISSING_ID);
          done();
        });
    });

    test("Update Issue with No Fields to Update", (done) => {
      chai
        .request(server)
        .put("/api/issues/test-put")
        .send({ _id: "60e7104bbac1314cc7eaca0d" })
        .end((err, res) => {
          assert.equal(res.status, 200);
          assert.equal(res.body.error, messages.NO_UPDATE_FIELD);
          done();
        });
    });

    test("Update Issue with Invalid _id", (done) => {
      chai
        .request(server)
        .put("/api/issues/test-put")
        .send({
          _id: "invalid _id",
          issue_title: "updated title",
        })
        .end((err, res) => {
          assert.equal(res.status, 200);
          assert.equal(res.body.error, messages.COULD_NOT_UPDATE);
          done();
        });
    });
  });

  suite("Test DELETE /api/issues/{project}", () => {
    test("Delete an Issue", (done) => {
      chai
        .request(server)
        .delete("/api/issues/test")
        .send({ _id: deleteId })
        .end((err, res) => {
          assert.equal(res.status, 200);
          assert.equal(res.body.result, messages.DELETE_SUCCESS);
          assert.equal(res.body._id, deleteId);
          done();
        });
    });

    test("Delete an Issue with Invalid _id", (done) => {
      chai
        .request(server)
        .delete("/api/issues/test")
        .send({ _id: "invalid _id" })
        .end((err, res) => {
          assert.equal(res.status, 200);
          assert.equal(res.body.error, messages.COULD_NOT_DELETE);
          done();
        });
    });

    test("Delete an Issue with Missing _id", (done) => {
      chai
        .request(server)
        .delete("/api/issues/test")
        .end((err, res) => {
          assert.equal(res.status, 200);
          assert.equal(res.body.error, messages.MISSING_ID);
          done();
        });
    });
  });
});
