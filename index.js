const express = require('express');
const cors = require('cors');
require('dotenv').config()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express()
const port = process.env.PORT || 5000

// midlewear
app.use(express.json())
app.use(cors())


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.76h69in.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {

    const userCollection = client.db("MediShine").collection('users');
    const medicineCollection = client.db("MediShine").collection('medicines');
    const medicineCategoryCollection = client.db("MediShine").collection('medicineCategory');
    const advertismentCollection = client.db("MediShine").collection('advertisment');

    // ===== User related API ======
    app.get('/allUsers', async (req, res) => {
      const result = await userCollection.find().toArray()
      res.send(result)
    })

    app.get('/users', async (req, res) => {
      const email = req.query.email
      const query = { userEmail: email }
      const result = await userCollection.findOne(query)
      res.send(result)
    })

    app.patch('/users/:id', async (req, res) => {
      const id = req.params.id;
      const role = req.body
      const query = { _id: new ObjectId(id) }
      const updateRole = {
        $set: {
          userRole: role.userRole
        }
      }
      const result = await userCollection.updateOne(query, updateRole)
      res.send(result)
    })

    app.post('/users', async (req, res) => {
      const newUser = req.body;
      const query = { userEmail: newUser.userEmail }
      const isExist = await userCollection.findOne(query)
      if (isExist) {
        return res.send({ message: 'user already Exist', insertedId: null })
      }
      const result = await userCollection.insertOne(newUser)
      res.send(result)
    })

    // ====== Medicen related API ========
    app.get('/medicines', async (req, res) => {
      const result = await medicineCollection.find().toArray()
      res.send(result)
    })

    app.get('/medicines/email/:userEmail', async (req, res) => {
      const query = {userEmail: req.params.userEmail}
      const result = await medicineCollection.find(query).toArray()
      res.send(result)
    })

    app.post('/medicines', async (req, res) => {
      const newMedicien = req.body;
      const result = await medicineCollection.insertOne(newMedicien)
      res.send(result)
    })

    // ====== Category related API ======
    app.get('/medicineCategory', async (req, res) => {
      const result = await medicineCategoryCollection.find().toArray()
      res.send(result)
    })

    app.post('/medicineCategory', async (req, res) => {
      const newCategory = req.body;
      const result = await medicineCategoryCollection.insertOne(newCategory)
      res.send(result)
    })

    app.delete('/medicineCategory/:id', async (req, res) => {
      const query = { _id: new ObjectId(req.params.id) }
      const result = await medicineCategoryCollection.deleteOne(query)
      res.send(result)
    })

    // ====== Advertisement related API ======
    app.get('/advertisment', async (req, res) => {
      const result = await advertismentCollection.find().toArray()
      res.send(result)
    })

    app.get('/advertisment/email/:userEmail', async (req, res) => {
      const query = {userEmail: req.params.userEmail}
      const result = await advertismentCollection.find(query).toArray()
      res.send(result)
    })

    app.get('/advertisment/approved', async (req, res) => {
      const query = { status: 'approve' }
      const result = await advertismentCollection.find(query).toArray()
      res.send(result)
    })

    app.patch('/advertisment/:id', async (req, res) => {
      const id = req.params.id;
      const status = req.body
      const query = { _id: new ObjectId(id) }
      const updatestatus = {
        $set: {
          status: status.status
        }
      }
      const result = await advertismentCollection.updateOne(query, updatestatus)
      res.send(result)
    })

    app.post('/advertisment', async (req, res) => {
      const newAvertis = req.body;
      const result = await advertismentCollection.insertOne(newAvertis)
      res.send(result)
    })

    app.delete('/advertisment/delete/:id', async (req,res)=>{
      const query = {_id: new ObjectId(req.params.id)}
      const result = await advertismentCollection.deleteOne(query)
      res.send(result)
    })



    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
  }
}
run().catch(console.dir);



app.get('/', (req, res) => {
  res.send("MideShine is running")
})

app.listen(port, () => {
  console.log('MideShine server is running on Port:', port);
})