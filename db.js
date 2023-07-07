/** Database setup for BizTime. */


const { Client } = require("pg");

let db;
if(process.env.NODE_ENV === "test"){
  db = new Client({
    host: "/var/run/postgresql/",
    database: "biztime-test"})
} else{
  db = new Client({
    host: "/var/run/postgresql/",
    database: "biztime"
  });
}
db.connect();


module.exports = db;