/** Tests for routes/invoices.js */

const request = require("supertest")

const db = require("../db");
const app = require("../app");

const { ExpressError } = require("../expressError");

const {
    commonBeforeAll,
    commonBeforeEach,
    commonAfterEach,
    commonAfterAll,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);


/*********************************************GET /invoices */
describe("GET /invoices", ()=>{
    test("works", async()=>{
        const resp = await request(app).get("/invoices")
        expect(resp.statusCode).toEqual(200)
        expect(resp.body.invoices.length).toEqual(5)
        expect(resp.body).toEqual({
            invoices:[
                { id: expect.any(Number), comp_code: 'c1' },
                { id: expect.any(Number), comp_code: 'c1' },
                { id: expect.any(Number), comp_code: 'c2' },
                { id: expect.any(Number), comp_code: 'c2' },
                { id: expect.any(Number), comp_code: 'c2' },
            ]
        })
    })
})

/*********************************************GET /invoices/:id */
describe("GET /invoices/:id", ()=>{
    test("works", async()=>{
        const findId = await db.query(`SELECT id FROM invoices LIMIT 1`)
        const id = findId.rows[0].id

        const resp = await request(app).get(`/invoices/${id}`)
        expect(resp.statusCode).toEqual(200)
        expect(resp.body).toEqual({
            invoice:{
                id,
                amt:100,
                paid:true,
                add_date:expect.any(String),
                paid_date:null,
                company:{
                    code: 'c1',
                    name: 'Comp1',
                    description: 'D1'
                },
            },
        })
    })

    test("error: invoice not found", async()=>{

        const resp = await request(app).get(`/invoices/0`)
        expect(resp.statusCode).toEqual(404)
    })
})

/*********************************************POST /invoices */
describe("POST /invoices", ()=>{
    const invoice1 = { comp_code: "c2" , amt: 500 }
    test("works", async()=>{
        const resp = await request(app)
            .post(`/invoices`)
            .send(invoice1)

        expect(resp.statusCode).toEqual(201)
        expect(resp.body).toEqual({
            invoice:{
                id:expect.any(Number),
                comp_code: 'c2',
                amt:500,
                paid:false,
                add_date:expect.any(String),
                paid_date:null,
            },
        })
    })
    test("error: bad request", async()=>{
        try{
            await request(app)
                .post(`/invoices`)
                .send({})
        } catch(err){
            expect(resp.statusCode).toBe(400)
            expect(err instanceof ExpressError).toBeTruthy()
        }
    })
})

/*********************************************PUT /invoices/:id */
describe("PUT /invoices/:id", ()=>{
    test("works: paid = T => T", async()=>{
        const findId = await db.query(`SELECT id FROM invoices LIMIT 1`)
        const id = findId.rows[0].id

        const updateData = { amt: 25, paid: true }
        const resp = await request(app)
            .put(`/invoices/${id}`)
            .send(updateData)
        
        expect(resp.statusCode).toBe(200)
        expect(resp.body).toEqual({
            invoice:{
                ...updateData,
                id:expect.any(Number),
                comp_code: 'c1',
                add_date:expect.any(String),
                paid_date:null,
            },
        })
    })
    test("works: paid = T => F", async()=>{
        const findId = await db.query(`SELECT id FROM invoices LIMIT 1`)
        const id = findId.rows[0].id

        const updateData = { amt: 25, paid: false }
        const resp = await request(app)
            .put(`/invoices/${id}`)
            .send(updateData)
        
        expect(resp.statusCode).toBe(200)
        expect(resp.body).toEqual({
            invoice:{
                ...updateData,
                id:expect.any(Number),
                comp_code: 'c1',
                add_date:expect.any(String),
                paid_date:null,
            },
        })
    })

    test("works: paid = F => F", async()=>{
        const findId = await db.query(`SELECT id FROM invoices LIMIT 1`)
        // 2nd test invoice has value of False for "paid"
        const id = (findId.rows[0].id) + 1;

        const updateData = { amt: 25, paid: false }
        const resp = await request(app)
            .put(`/invoices/${id}`)
            .send(updateData)
        
        expect(resp.statusCode).toBe(200)
        expect(resp.body).toEqual({
            invoice:{
                ...updateData,
                id:expect.any(Number),
                comp_code: 'c1',
                add_date:expect.any(String),
                paid_date:expect.any(String),
            },
        })
    })

    test("works: paid = F => T", async()=>{
        const findId = await db.query(`SELECT id FROM invoices LIMIT 1`)
        // 2nd test invoice has value of False for "paid"
        const id = (findId.rows[0].id) + 1;

        const a = await db.query(`SELECT * FROM invoices WHERE id = $1`, [id])

        const updateData = { amt: 25, paid: true }
        const resp = await request(app)
            .put(`/invoices/${id}`)
            .send(updateData)

        const b = await db.query(`SELECT * FROM invoices WHERE id = $1`, [id])
        
        expect(resp.statusCode).toBe(200)
        expect(resp.body).toEqual({
            invoice:{
                ...updateData,
                id:expect.any(Number),
                comp_code: 'c1',
                add_date:expect.any(String),
                paid_date:expect.any(String),
            },
        })
    })
    
    test("error: invalid data", async()=>{
        const findId = await db.query(`SELECT id FROM invoices LIMIT 1`)
        const id = findId.rows[0].id

        try{
            const updateData = { amt: "bad data", paid: false }
            await request(app)
                .put(`/invoices/${id}`)
                .send(updateData)
        } catch(err){
            expect(resp.statusCode).toBe(400)
            expect(err instanceof ExpressError).toBeTruthy()
        }
    })

    test("error: not found", async()=>{
        try{
            const updateData = { amt: 25, paid: true}
            await request(app)
                .put(`/invoices/0`)
                .send(updateData)
        } catch(err){
            expect(resp.statusCode).toBe(404)
            expect(err instanceof ExpressError).toBeTruthy()
        }
    })
})

/*********************************************DELETE /invoices/:id */
describe("DELETE /invoices/:id", ()=>{
    test("works", async()=>{
        const findId = await db.query(`SELECT id FROM invoices LIMIT 1`)
        const id = findId.rows[0].id

        const beforeDel = await db.query(`SELECT id from invoices`);
        const resp = await request(app).delete(`/invoices/${id}`)
        const afterDel = await db.query(`SELECT id from invoices`);

        expect(beforeDel.rows.length).toEqual(5)
        expect(afterDel.rows.length).toEqual(4)
        expect(resp.statusCode).toEqual(200)
    })
    test("error: not found", async()=>{
        try{
            const findId = await db.query(`SELECT id FROM invoices LIMIT 1`)
            const id = findId.rows[0].id

            await request(app).delete(`/invoices/${id}`)
            await request(app).delete(`/invoices/${id}`)
        } catch(err){
            expect(resp.statusCode).toEqual(404)
            expect(err instanceof ExpressError).toBeTruthy()
        }
    })
})