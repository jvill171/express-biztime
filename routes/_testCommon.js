const db = require("../db.js");

async function commonBeforeAll() {
    // noinspection SqlWithoutWhere
    await db.query("DELETE FROM invoices");
    // noinspection SqlWithoutWhere
    await db.query("DELETE FROM companies");

    // Test companies
    await db.query(`
    INSERT INTO companies(code, name, description)
    VALUES ('c1', 'Comp1' , 'D1'),
            ('c2', 'Comp2' , 'D2'),
            ('c3', 'Comp3' , 'D3')`);
    // Test invoices
    await db.query(`
        INSERT INTO invoices(comp_code, amt, paid, paid_date)
        VALUES ('c1', 100, true, null),
               ('c1', 200, false, '2018-01-01'),
               ('c2', 300, true, null),
               ('c2', 400, false, null),
               ('c2', 500, true, '2020-10-12')`,);
}

async function commonBeforeEach(){
    await db.query("BEGIN");
}
async function commonAfterEach(){
    await db.query("ROLLBACK");
}
async function commonAfterAll(){
    await db.end();
}

module.exports = {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
};
