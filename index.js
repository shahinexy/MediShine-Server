const express = require('express');
const cors = require('cors');
require('dotenv').config()
var jwt = require('jsonwebtoken');
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
    const cartItemCollection = client.db("MediShine").collection('cartItem');

    // ======= JWT related api ========
    app.post('/jwt', async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' })
      res.send({ token })
    })

    // midlewear
    const verifyToken = (req, res, next) => {
      // console.log("inside verify token", req.headers.authorization);
      if (!req.headers.authorization) {
        return res.status(401).send({ message: 'unauthorize access' })
      }
      const token = req.headers.authorization.split(' ')[1];

      jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
          return res.status(401).send({ message: 'unauthorize access' })
        }
        req.decoded = decoded;
        next()
      })
    }

    const verifyAmin = async (req, res, next) => {
      const email = req.decoded.email
      const query = { userEmail: email }
      const user = await userCollection.findOne(query)
      let isAdmin = user?.userRole === 'admin';
      if (!isAdmin) {
        return res.status(403).send({ message: 'forbidden access' })
      }
      next()
    }


    // ===== User related API ======
    app.get('/allUsers', verifyToken, verifyAmin, async (req, res) => {
      const result = await userCollection.find().toArray()
      res.send(result)
    })

    // check is Admin
    app.get('/allUsers/admin/:email', verifyToken, async (req, res) => {
      const email = req.params.email;
      if (email !== req.decoded.email) {
        return res.status(403).send({ message: 'forbidden access' })
      }
      const query = { email: email }
      const user = await userCollection.findOne(query)
      let admin = false
      if (user) {
        admin = user?.userRole === 'admin';
      }

      res.send({ admin })
    })

    app.get('/users', async (req, res) => {
      const email = req.query.email
      const query = { userEmail: email }
      const result = await userCollection.findOne(query)
      res.send(result)
    })

    app.patch('/users/:id', verifyToken, verifyAmin, async (req, res) => {
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

    app.get('/medicines/email/:userEmail', verifyToken, async (req, res) => {
      const query = { userEmail: req.params.userEmail }
      const result = await medicineCollection.find(query).toArray()
      res.send(result)
    })

    app.get('/medicines/category/:category', async(req, res)=>{
      const query = {category: req.params.category}
      console.log(req.params.category);
      const result = await medicineCollection.find(query).toArray()
      res.send(result)
    })

    app.post('/medicines', verifyToken,  async (req, res) => {
      const newMedicien = req.body;
      const result = await medicineCollection.insertOne(newMedicien)
      res.send(result)
    })

    app.delete('/medicines/:id', verifyToken, async (req, res) => {
      const query = { _id: new ObjectId(req.params.id)}
      const result = await medicineCollection.deleteOne(query)
      res.send(result)
    })

    // ===== Cart Item related API =========
    app.get('/cartItem', verifyToken, async (req, res) => {
      const result = await cartItemCollection.find().toArray()
      res.send(result)
    })

    app.get('/cartItem/buyerEmail/:email', verifyToken, async (req, res) => {
      const email = req.params.email
      const query = { buyerEmail: email }
      const result = await cartItemCollection.find(query).toArray()
      res.send(result)
    })

    app.post('/cartItem', verifyToken, async (req, res)=>{
      const newItem = req.body;
      const result = await cartItemCollection.insertOne(newItem)
      res.send(result)
    })

    app.patch('/cartItem/update/:id', async(req, res)=>{
      const medicine = req.body
      const query = {_id: new ObjectId(req.params.id)}
      const updateMedicine = {
        $set:{
          quantity: medicine.quantity,
        }
      }
      const result = await cartItemCollection.updateOne(query, updateMedicine)
      res.send(result)
    })

    app.delete('/cartItem/:id', verifyToken, async (req, res) => {
      const query = { _id: new ObjectId(req.params.id)}
      const result = await cartItemCollection.deleteOne(query)
      res.send(result)
    })

    app.post('/cartItem/deleteAll', verifyToken, async (req, res) => {
      const ids = req.body 
      const query = {_id: {$in: ids.map(id => new ObjectId(id))}}
      console.log(query);
      const result = await cartItemCollection.deleteMany(query)
      res.send(result)
    })


    // ====== Category related API ======
    app.get('/medicineCategory', async (req, res) => {
      const result = await medicineCategoryCollection.find().toArray()
      res.send(result)
    })

    app.post('/medicineCategory', verifyToken, verifyAmin, async (req, res) => {
      const newCategory = req.body;
      const result = await medicineCategoryCollection.insertOne(newCategory)
      res.send(result)
    })

    app.delete('/medicineCategory/:id', verifyToken, verifyAmin, async (req, res) => {
      const query = { _id: new ObjectId(req.params.id) }
      const result = await medicineCategoryCollection.deleteOne(query)
      res.send(result)
    })

    // ====== Advertisement related API ======
    app.get('/advertisment',  verifyToken, verifyAmin, async (req, res) => {
      const result = await advertismentCollection.find().toArray()
      res.send(result)
    })

    app.get('/advertisment/approved', async (req, res) => {
      const query = { status: 'approve' }
      const result = await advertismentCollection.find(query).toArray()
      res.send(result)
    })

    app.get('/advertisment/email/:userEmail',  verifyToken, async (req, res) => {
      const query = { userEmail: req.params.userEmail }
      const result = await advertismentCollection.find(query).toArray()
      res.send(result)
    })

    app.patch('/advertisment/:id',  verifyToken, verifyAmin, async (req, res) => {
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

    app.post('/advertisment',  verifyToken, async (req, res) => {
      const newAvertis = req.body;
      const result = await advertismentCollection.insertOne(newAvertis)
      res.send(result)
    })

    app.delete('/advertisment/delete/:id',  verifyToken, verifyAmin, async (req, res) => {
      const query = { _id: new ObjectId(req.params.id) }
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