const express = require('express')
const cors = require('cors')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb')
require('dotenv').config()

const port = process.env.PORT || 9000
const app = express()

app.use(cors())
app.use(express.json())


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.jds8f.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
    const jobscollection = client.db('jobPortal').collection('alljobs');
    const bidscollection = client.db('jobPortal').collection('bids');
    
    // create jobs
    app.post('/added-jobs',async(req,res) => {
      const jobs = req.body;
      const result = await jobscollection.insertOne(jobs)      
      res.send(result)
    })
    // get all jobs
    app.get('/alljobs',async(req,res) =>{
      const filter =req.query.filter
      const search =req.query.search;
      console.log(search);
      
      let query={}
      // query = {categroy: filter}
      if(filter) query.category=filter
      const result = await jobscollection.find(query).toArray();
      res.send(result)
    })
    // get jobs by email
    app.get('/alljobs/:email',async(req,res) =>{
      const email = req.params.email;
      const query = {'buyer.email': email};
      const result = await jobscollection.find(query).toArray();
      res.send(result)
    })
    // delete a job post by id 
    app.delete('/job/:id',async(req,res) => {
      const id = req.params.id;
      const query = {_id: new ObjectId(id)};
      const result = await jobscollection.deleteOne(query)
      res.send(result)
    })
    // get single data by id 
    app.get('/job/:id',async(req,res) => {
      const id = req.params.id;
      const query = {_id: new ObjectId(id)};
      const result = await jobscollection.findOne(query)
      res.send(result)
    })
    // update data by put
    app.put('/update-job/:id',async(req,res) => {
      const id = req.params.id;
      const jobData = req.body;
      const updateData = {
        $set: jobData,
      }
      const query = {_id: new ObjectId(id)}
      const options = {upsert:true}
      const result = await jobscollection.updateOne(query,updateData,options)
      res.send(result)
    })
    // create bids in db and server
    app.post('/added-bids',async(req,res) => {
      const bids = req.body;
      // check/validate same user cant apply in same job
      const query = {email:bids?.email, job_id: bids?.job_id}
      const alreadyExist = await bidscollection.findOne(query)
      console.log('if already exist ',alreadyExist);
      
      if(alreadyExist)
        return res
        .status(400)
        .send('Already Bids Exist')
      
      // this line is creating bids
      const result = await bidscollection.insertOne(bids) 
      // update the bid count 
      const filter = {_id: new ObjectId(bids.job_id)}
      const bidupdate = {
        $inc:{bid_count:1}
      }
      const udpateBids = await jobscollection.updateOne(filter,bidupdate)
      res.send(result)
    })
    // get my bids by single
    app.get('/bids/:email',async(req,res) => {
      const email = req.params.email;
      const query = {email}
      const result = await bidscollection.find(query).toArray();
      res.send(result)

    })
    // get bid reqwuest by email
    app.get('/bids-req/:email',async(req,res) => {
      const email = req.params.email;
      const query = {buyer: email}
      const result = await bidscollection.find(query).toArray();
      res.send(result)

    })
    // update status by patch 
    app.patch('/bid-status-update/:id',async(req,res) => {
      const id = req.params.id;
      const {status} = req.body;
      const filter = {_id: new ObjectId(id)}
      const update = {
        $set:{status}
      }
      const result =  await bidscollection.updateOne(filter,update)
      console.log(result);
      
      res.send(result)
    })
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get('/', (req, res) => {
  res.send('Hello from SoloSphere Server....')
})

app.listen(port, () => console.log(`Server running on port ${port}`))
