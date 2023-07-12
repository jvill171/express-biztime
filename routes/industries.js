/** Routes for industries. */

const express = require("express");
const ExpressError = require("../expressError")
const db = require("../db");

let router = new express.Router();


// GET /industries : Returns list of industries, like {industries: [{industry1, [comp_code1, comp_code2, ...]}, ...]}
router.get("/", async function (req, res, next) {
  try {
    const result = await db.query(
          `SELECT i.code, i.industry, array_agg(ci.comp_code) AS companies
           FROM industries i
           LEFT JOIN company_industry ci ON ci.industry_code = i.code
           GROUP BY i.code, i.industry`
    );
    const industries = result.rows
    return res.json({ industries });
  }
  catch (err) {
    return next(err);
  }
});

/**POST /industries :Adds an industry. 
 * Needs to be given JSON like: `{code, industry}`
 * Returns obj of new industry: `{code, industry}`
 * */
router.post("/", async function (req, res, next) {
  try {
    let {code, industry} = req.body
    if(!(code && industry)){
      throw new ExpressError("Bad Request: Missing Data ", 400)
    }
    const checkDuplicate = await db.query(
        `SELECT code
         FROM industries
         WHERE code = $1`, [code]
    )
    if(checkDuplicate.rows.length !== 0){
        throw new ExpressError(`Duplicate code exists: ${code}`, 409)
    }

    const result = await db.query(
          `INSERT INTO industries (code, industry)
           VALUES($1, $2)
           RETURNING code, industry`
           , [code, industry]
    );
    const newIndustry = result.rows[0]
    return res.status(201).json({ industry: newIndustry });
  }

  catch (err) {
    return next(err);
  }
});

/**POST /:i_code/:c_code :Adds a new association between a company and an industry throught he company_industry table
 * i_code = industry_code
 * c_code = company_code
 */

router.post("/:i_code/:c_code", async(req, res, next)=>{
    try{
        const { c_code, i_code } = req.params

        // Ensure company and industry exist
        ensureCompany  = await db.query(`SELECT code FROM companies  WHERE code = $1`, [c_code])
        ensureIndustry = await db.query(`SELECT code FROM industries WHERE code = $1`, [i_code])

        if(ensureCompany.rows.length === 0 || ensureIndustry.rows.length === 0){
            throw new ExpressError(`Company or Industry does not found: ${c_code}, ${i_code}`, 404)
        }

        // Ensure entry is not association between company/industry does not already exist
        const checkDuplicate = await db.query(
            `SELECT comp_code
             FROM company_industry
             WHERE comp_code = $1 AND industry_code = $2`
            , [c_code, i_code]
        )
        if(checkDuplicate.rows.length !== 0){
            throw new ExpressError(`Duplicate association exists: ${c_code}, ${i_code}`, 409)
        }

        // Add new company-industry into table
        const result = await db.query(
            `INSERT INTO company_industry (comp_code, industry_code)
             VALUES($1, $2)
             RETURNING comp_code, industry_code`
            , [c_code, i_code]
        )
        const newCompInd = result.rows[0]
        return res.status(201).json({ company_industry: newCompInd })

    } catch(err){
        return next(err)
    }
})

// **DELETE /industries/[code] :** Deletes industry. Should return 404 if industry cannot be found.
// Returns `{status: "deleted"}`
router.delete("/:code", async function (req, res, next) {
  try {
    const result = await db.query(
          `DELETE FROM industries
           WHERE code = $1
           RETURNING code`
          , [req.params.code]
    );

    if(result.rows.length === 0){
      throw new ExpressError(`Company not found: ${req.params.code}`, 404)
    }

    return res.json({"status": "deleted"});
  }

  catch (err) {
    return next(err);
  }
});

module.exports = router;