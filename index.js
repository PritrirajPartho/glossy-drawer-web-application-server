const express = require("express");
const app = express();
const cors = require("cors");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const port = process.env.PORT || 5000;

//middleware..........
app.use(cors());
app.use(express.json());


// -------------------------------------------------

const verifyJWT = (req, res, next) => {
  const authorization = req.headers.authorization;
  if (!authorization) {
    return res
      .status(401)
      .send({ error: true, message: "unauthorized access" });
  }
  // bearer token
  const token = authorization.split(" ")[1];

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res
        .status(401)
        .send({ error: true, message: "unauthorized access" });
    }
    req.decoded = decoded;
    next();
  });
};


//----------------------------------------------

const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.axnscsq.mongodb.net/?retryWrites=true&w=majority`;

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
    const selectedCollection = client.db('GlossyDB').collection('selected');
    const usersCollection = client.db('GlossyDB').collection('users');

  //jwt work is here
  app.post('/jwt', (req, res) => {
    const user = req.body;
    const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
      expiresIn: "1h",
    });
    res.send({ token });
  });

  //  using verifyAdmin
  const verifyAdmin = async (req, res, next) => {
    const email = req.decoded.email;
    const query = { email: email };
    const user = await usersCollection.findOne(query);
    if (user?.role !== "admin") {
      return res
        .status(403)
        .send({ error: true, message: "forbidden message" });
    }
    next();
  };

  // users related apis.......

  app.get('/users/admin/:email', verifyJWT, async (req, res) => {
    const email = req.params.email;
    if (req.decoded.email !== email) {
      res.send({ admin: false });
    }

    const query = { email: email };
    const user = await usersCollection.findOne(query);
    const result = { admin: user?.role === "admin" };
    res.send(result);
  });

  app.get('/users/instructor/:email', verifyJWT, async (req, res) => {
    const email = req.params.email;
    if (req.decoded.email !== email) {
      res.send({ instructor: false });
    }

    const query = { email: email };
    const user = await usersCollection.findOne(query);
    const result = { instructor: user?.role === "instructor" };
    res.send(result);
  });


  app.get('/allusers', verifyJWT, verifyAdmin, async (req, res) => {
    const result = await usersCollection.find().toArray();
    console.log(result);
    res.send(result);
  });

  app.get('/users',  async (req, res) => {
    const result = await usersCollection.find().toArray();
    console.log(result);
    res.send(result);
  });

  app.post('/users', async (req, res) => {
    const user = req.body;
    const query = { email: user.email };
    const existingUser = await usersCollection.findOne(query);

    if (existingUser) {
      return res.send({ message: "user already exists" });
    } else {
      const result = await usersCollection.insertOne(user);
      res.send(result);
    }
  });

  app.patch('/users/admin/:id', async (req, res) => {
    const id = req.params.id;
    console.log(id);
    const filter = { _id: new ObjectId(id) };
    const updateDoc = {
      $set: {
        role: "admin",
      },
    };

    const result = await usersCollection.updateOne(filter, updateDoc);
    res.send(result);
  });

  app.patch('/users/instructor/:id', async (req, res) => {
    const id = req.params.id;
    console.log(id);
    const filter = { _id: new ObjectId(id) };
    const updateDoc = {
      $set: {
        role: "instructor",
      },
    };

    const result = await usersCollection.updateOne(filter, updateDoc);
    res.send(result);
  });

//----------------------------------------------------------------
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

    // get new add item or course
    app.get("/newcourses", async (req, res) => {
      const result = await instructorsAddedCollection.find().toArray();
      res.send(result);
    });

    app.post("/newcourses", async (req, res) => {
      const newItem = req.body;
      const result = await instructorsAddedCollection.insertOne(newItem);
      res.send(result);
    });

//selcected class for a user
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



// ----------Developer: Pritiraj Partho



app.get("/", (req, res) => {
  res.send("Glossy-Drawer Server is Running");
});

app.listen(port, () => {
  console.log(`Glossy-Drawer Server is Running on Port ${port}`);
});

