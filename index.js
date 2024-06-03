const express = require('express');
const cors = require('cors');
require('dotenv').config()
const { MongoClient, ServerApiVersion } = require('mongodb');
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

    app.get('/users', async (req, res)=>{
        const email = req.query.email
        const query = {userEmail: email}
        const result = await userCollection.findOne(query)
        res.send(result)
    })

    app.post('/users', async (req, res)=>{
        const newUser = req.body;
        console.log(newUser);
        const query = {userEmail: newUser.userEmail}
        const isExist = await userCollection.findOne(query)
        if(isExist){
            return res.send({ message: 'user already Exist', insertedId: null })
        }
        const result = await userCollection.insertOne(newUser)
        res.send(result)
    })

    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
  }
}
run().catch(console.dir);



app.get('/',  (req, res)=>{
    res.send("MideShine is running")
})

app.listen(port, ()=>{
    console.log('MideShine server is running on Port:', port);
})