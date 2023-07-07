/** Tests for routes/companies.js */

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

/**********************************  GET /companies */
describe("GET /companies", ()=>{
    test("works", async()=>{
        const resp = await request(app).get("/companies")
        expect(resp.statusCode).toEqual(200)
        expect(resp.body).toEqual({
            companies: [
                { code: 'c1', name: 'Comp1' },
                { code: 'c2', name: 'Comp2' },
                { code: 'c3', name: 'Comp3' }
              ]
        })
    })
})

/**********************************  GET /companies/:code */
describe("GET /companies/:code", ()=>{
    test("works", async()=>{
        const resp = await request(app).get(`/companies/c1`)
        expect(resp.statusCode).toEqual(200)
        expect(resp.body).toEqual({ 
            company: { code: 'c1', name: 'Comp1', description: 'D1' }
        })
    })

    test("error: not found", async()=>{
        try{
            await request(app).get(`/companies/badCode`)
        } catch(err){
            expect(resp.statusCode).toEqual(404)
            expect(err instanceof ExpressError).toBeTruthy()
        }
    })
})

/**********************************  POST /companies */
describe("POST /companies", ()=>{
    const newCompany = {
        name: "New Comp",
        description: "NewDesc"
    }
    
    test("works", async()=>{
        const resp = await request(app)
            .post(`/companies`)
            .send(newCompany)
        expect(resp.statusCode).toEqual(201)
        expect(resp.body).toEqual({
            company:{ code: "new-comp", ...newCompany }
        })
    })

    test("error: bad data", async()=>{
        try{
            await request(app).post(`/companies`).send(newCompany)
        }catch(err){
            expect(resp.statusCode).toEqual(404)
            expect(err instanceof ExpressError).toBeTruthy()
        }
    })
})

/**********************************  PUT /companies/:code */
describe("PUT /companies/:code", ()=>{
    const updateData = {
        name: "New name",
        description:"New desc",
    }
    
    test("works", async()=>{
        const resp = await request(app)
            .put(`/companies/c1`)
            .send(updateData)
        expect(resp.statusCode).toEqual(200)
        expect(resp.body).toEqual({
            company:{
                code: 'c1',
                ...updateData
            }
        })
    })

    test("error: not found", async()=>{
        try{
            await request(app)
                .put(`/companies/nope`)
                .send(updateData)
        } catch(err){
            expect(resp.statusCode).toEqual(404)
            expect(err instanceof ExpressError).toBeTruthy()
        }
    })

    test("error: not found", async()=>{
        try{
            await request(app)
                .put(`/companies/nope`)
                .send(updateData)
        } catch(err){
            expect(resp.statusCode).toEqual(404)
            expect(err instanceof ExpressError).toBeTruthy()
        }
    })

    test("error: bad request", async()=>{
        try{
            await request(app)
                .put(`/companies/c1`)
                .send({})
        } catch(err){
            expect(resp.statusCode).toEqual(400)
            expect(err instanceof ExpressError).toBeTruthy()
        }
    })
})

/**********************************  DELETE /companies/:code */
describe("DELETE /companies/:code", ()=>{
    test("works", async()=>{
        const beforeDel = await db.query(`SELECT code FROM companies`)
        const resp = await request(app).delete(`/companies/c1`)
        const afterDel = await db.query(`SELECT code FROM companies`)
        
        expect(beforeDel.rows.length).toEqual(3)
        expect(afterDel.rows.length).toEqual(2)
        expect(resp.statusCode).toEqual(200)
    })
    test("error: not found", async()=>{
        try{
            await request(app).delete(`/companies/c1`)
            await request(app).delete(`/companies/c1`)
        } catch(err){
            expect(resp.statusCode).toEqual(404)
            expect(err instanceof ExpressError).toBeTruthy()
        }
    })
})
