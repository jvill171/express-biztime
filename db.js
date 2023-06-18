/** Database setup for BizTime. */


const { Client } = require("pg");

let db = new Client({
    host: "/var/run/postgresql/",
    database: "biztime"
  });

  db.connect();


module.exports = db;