const express = require("express");
const cors = require("cors");
const app = express();
require("dotenv").config();
const port = process.env.PORT || 5000;



// Middlewere
app.use(cors());
app.use(express.json());


// bearer token
//  const token = authorization.split(" ")[1];


// --------------


const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = `mongodb+srv://glossyUser:glossyPass@cluster0.axnscsq.mongodb.net/?retryWrites=true&w=majority`;

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



    const reviewsCollection = client.db("GlossyDB").collection("reviews");
    const coursesCollection = client.db("GlossyDB").collection("courses");
    const instructorsCollection = client.db("GlossyDB").collection("instructors");
    const instructorsAddedCollection = client.db("GlossyDB").collection("newcourses");
    const selectedCollection = client.db('GlossyDB').collection('selected')


    // Reviews
    app.get("/reviews", async (req, res) => {
      const result = await reviewsCollection.find().toArray();
      res.send(result);
    });


    // Courses
    app.get("/courses", async (req, res) => {
      const result = await coursesCollection.find().toArray();
      res.send(result);
    });

    // Instructors
    app.get("/instructors", async (req, res) => {
      const result = await instructorsCollection.find().toArray();
      res.send(result);
    });


    // get new add item

    app.get("/newcourses", async (req, res) => {
      const result = await instructorsAddedCollection.find().toArray();
      res.send(result);
    });

    app.post("/newcourses", async (req, res) => {
      const newItem = req.body;
      const result = await instructorsAddedCollection.insertOne(newItem);
      res.send(result);
    });


    app.post('/addClass', async (req, res) => {
      const addClass = req.body;
      console.log(addClass)
      const result = await selectedCollection.insertOne(addClass);
      res.send(result)
    })

    app.get('/addClass', async (req, res) => {
      const result = await selectedCollection.find().toArray()
      res.send(result)
    })

    app.get("/addClass/:email", async (req, res) => {
      console.log(req.params.email);
      const selected = await selectedCollection
        .find({
          email: req.params.email,
        })
        .toArray();
      res.send(selected);
    });


    // Connect the client to the server	(optional starting in v4.7)
    client.connect();
    // Send a ping to confirm a successful connection
    //     await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    //     await client.close();
  }
}
run().catch(console.dir);


// ----------




app.get("/", (req, res) => {
  res.send("Glossy-Drawer Server is Running");
});

app.listen(port, () => {
  console.log(`Glossy-Drawer Server is Running on Port ${port}`);
});



//   