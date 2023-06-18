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
        const result = await db.query(
            `SELECT * FROM invoices
            WHERE id=$1`, [req.params.id]
        )
        if(result.rows.length === 0){
            throw new ExpressError(`Invoice not found: ${req.params.id}`, 404)
        }
        return res.json({"invoice": result.rows[0]})
    } catch(err){
        return next(err)
    }
})


// **POST /invoices :** Adds an invoice. Needs to be passed in JSON body of: `{comp_code, amt}`
// Returns: `{invoice: {id, comp_code, amt, paid, add_date, paid_date}}`

router.post("/", async(req, res, next)=>{
    try{
        let {comp_code, amt} = req.body
        console.log(comp_code, amt)
        const result = await db.query(
            `INSERT INTO invoices (comp_code, amt)
            VALUES ($1, $2)
            RETURNING id, comp_code, amt, paid, add_date, paid_date`,
            [comp_code, amt]
        )
        return res.status(201).json({"invoice": result.rows[0]})
    } catch(err){
        return next(err)
    }
})


// **PUT /invoices/[id] :** Updates an invoice. If invoice cannot be found, returns a 404.
// Needs to be passed in a JSON body of `{amt}` Returns: `{invoice: {id, comp_code, amt, paid, add_date, paid_date}}`


router.put("/:id", async(req, res, next)=>{
    try{
        let {amt} = req.body;
        const result = await db.query(
            `UPDATE invoices
            SET amt = $2
            WHERE id=$1
            RETURNING id, comp_code, amt, paid, add_date, paid_date`,
            [req.params.id, amt]
        );
        if(result.rows.length === 0){
            throw new ExpressError(`Invoice not found: ${req.params.id}`, 404);
        }
        return res.json({ "invoice": result.rows[0] })
    } catch(err){
        return next(err)
    }
})

// **DELETE /invoices/[id] :** Deletes an invoice.If invoice cannot be found, returns a 404. Returns: `{status: "deleted"}` Also, one route from the previous part should be updated:

router.delete("/:id", async(req, res, next)=>{
    try{
        const result = await db.query(
            `DELETE FROM invoices
            WHERE id=$1
            RETURNING id`, [req.params.id]
        )
        return res.json({"status": "deleted" })
    } catch(err){
        return next(err)
    }
})

module.exports = router;