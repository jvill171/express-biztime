/** Routes for companies. */


const express = require("express");
const ExpressError = require("../expressError")
const db = require("../db");

let router = new express.Router();

// **GET /invoices :** Return info on invoices: like `{invoices: [{id, comp_code}, ...]}`
router.get("/", async (req, res, next)=>{
    try{
        const result = await db.query(
            `SELECT id, comp_code
            FROM invoices
            ORDER BY id`
        );
        return res.json({"invoices": result.rows})
    } catch(err){
        return next(err)
    }
})

// **GET /invoices/[id] :** Returns obj on given invoice.
// If invoice cannot be found, returns 404. Returns `{invoice: {id, amt, paid, add_date, paid_date, company: {code, name, description}}}`
router.get("/:id", async(req, res, next)=>{
    try{
        const invoiceRes = await db.query(
            `SELECT id,
                    comp_code,
                    amt,
                    paid,
                    add_date,
                    paid_date 
            FROM invoices
            WHERE id=$1`, [req.params.id]
        )
        if(invoiceRes.rows.length === 0){
            throw new ExpressError(`Invoice not found: ${req.params.id}`, 404)
        }

        const invoice = invoiceRes.rows[0]
        const companyRes = await db.query(
            `SELECT code, name, description
             FROM companies
             WHERE code = $1`,
             [invoice.comp_code]
        )
        // Redundant data if returning company:{},
        // delete comp_code after used to find company
        delete invoice.comp_code;

        // This should never happen due to constraints
        if(companyRes.rows.length === 0){
            throw new ExpressError(`Invoice's company not found: ${invoice.comp_code}`, 404)
        }
        const company = companyRes.rows[0]
        invoice.company = company

        return res.json({ invoice })
    } catch(err){
        return next(err)
    }
})


// **POST /invoices :** Adds an invoice. Needs to be passed in JSON body of: `{comp_code, amt}`
// Returns: `{invoice: {id, comp_code, amt, paid, add_date, paid_date}}`

router.post("/", async(req, res, next)=>{
    try{
        let {comp_code, amt} = req.body

        if(!(comp_code && !isNaN(parseInt(amt)))){
            throw new ExpressError(`Bad Request`, 400)
        }

        const result = await db.query(
            `INSERT INTO invoices (comp_code, amt)
            VALUES ($1, $2)
            RETURNING id, comp_code, amt, paid, add_date, paid_date`,
            [comp_code, amt]
        )
        const invoice = result.rows[0]
        return res.status(201).json({ invoice })
    } catch(err){
        return next(err)
    }
})


// **PUT /invoices/[id] :** Updates an invoice. If invoice cannot be found, returns a 404.
// Needs to be passed in a JSON body of `{amt}` Returns: `{invoice: {id, comp_code, amt, paid, add_date, paid_date}}`

router.put("/:id", async (req, res, next) => {
    try {
        const { amt, paid } = req.body;
        if (!(typeof amt === "number" && typeof paid === "boolean")) {
            throw new ExpressError("Bad Request", 400);
        }

        // Check previous paid status (T/F)
        let checkPaidStatus = await db.query(
            `SELECT paid
             FROM invoices
             WHERE id = $1`,
            [req.params.id])

        if (checkPaidStatus.rows.length === 0) {
            throw new ExpressError(`Invoice not found: ${req.params.id}`, 404);
        }

        let paidDate, query, values;
        const prevPaid = checkPaidStatus.rows[0].paid

        // If (paid: F => T) || ((paid: T => F)), update paid and paid_date fields
        if ((!prevPaid && paid) || (prevPaid && !paid) ) {
            // If paying unpaid invoice: sets paid_date to today
            // If un-paying: sets paid_date to null
            paidDate = (paid) ? new Date() : null;

            query = `UPDATE invoices
                    SET amt = $2,
                        paid = $3,
                        paid_date = $4
                    WHERE id = $1
                    RETURNING id, comp_code, amt, paid, add_date, paid_date`;
            values = [req.params.id, amt, paid, paidDate];
        }
        // If (paid: T => T) || ((paid: F => F))
        else {
            query = `UPDATE invoices
                     SET amt = $2
                     WHERE id = $1
                     RETURNING id, comp_code, amt, paid, add_date, paid_date`;
            values = [req.params.id, amt];
        }

        const result = await db.query(query, values);

        const invoice = result.rows[0];
        return res.json({ invoice });
    } catch (err) {
        return next(err);
    }
});
  

// **DELETE /invoices/[id] :** Deletes an invoice.If invoice cannot be found, returns a 404. Returns: `{status: "deleted"}` Also, one route from the previous part should be updated:

router.delete("/:id", async(req, res, next)=>{
    try{
        const result = await db.query(
            `DELETE FROM invoices
            WHERE id=$1
            RETURNING id`, [req.params.id]
        )

        if(result.rows.length === 0){
          throw new ExpressError(`Invoice not found: ${req.params.id}`, 404)
        }
    
        return res.json({"status": "deleted" })
    } catch(err){
        return next(err)
    }
})

module.exports = router;