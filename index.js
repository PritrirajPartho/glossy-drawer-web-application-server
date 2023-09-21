const express = require("express");
const app = express();
const cors = require("cors");
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
const uri = `mongodb+srv://glossyUser:glossyPass@cluster0.axnscsq.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

const store_id = 'test650352845b258'
const store_passwd = 'test650352845b258@ssl'
const is_live = false //true for live, false for sandbox


async function run() {
  try {



    const reviewsCollection = client.db("GlossyDB").collection("reviews");
    const coursesCollection = client.db("GlossyDB").collection("courses");
    const instructorsCollection = client.db("GlossyDB").collection("instructors");
    const instructorsAddedCollection = client.db("GlossyDB").collection("newcourses");
    const selectedCollection = client.db('GlossyDB').collection('selected');
    const usersCollection = client.db('GlossyDB').collection('users');
    const productCollection = client.db('GlossyDB').collection('order');


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

    //users all of work...for mongodb + firebase
    // users related apis.......
    app.get('/users/admin/:email', async (req, res) => {
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


    app.get('/allusers', async (req, res) => {
      const result = await usersCollection.find().toArray();
      console.log(result);
      res.send(result);
    });

    app.get('/users', async (req, res) => {
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


    app.delete('/addClass/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await selectedCollection.deleteOne(query);
      res.send(result)
    })

    app.post("/order", async (req, res) => {
      const tran_id = new ObjectId().toString();

      const product = await selectedCollection.findOne({
        _id: new ObjectId(req.body.productId),
      });
      const data = {
        total_amount: 100,
        currency: 'BDT',
        tran_id: tran_id, // use unique tran_id for each api call
        success_url: `http://localhost:5000/payment/success/${tran_id}`,
        fail_url: 'http://localhost:3030/fail',
        cancel_url: 'http://localhost:3030/cancel',
        ipn_url: 'http://localhost:3030/ipn',
        shipping_method: 'Courier',
        product_name: 'Computer.',
        product_category: 'Electronic',
        product_profile: 'general',
        cus_name: 'Customer Name',
        cus_email: 'customer@example.com',
        cus_add1: 'Dhaka',
        cus_add2: 'Dhaka',
        cus_city: 'Dhaka',
        cus_state: 'Dhaka',
        cus_postcode: '1000',
        cus_country: 'Bangladesh',
        cus_phone: '01711111111',
        cus_fax: '01711111111',
        ship_name: 'Customer Name',
        ship_add1: 'Dhaka',
        ship_add2: 'Dhaka',
        ship_city: 'Dhaka',
        ship_state: 'Dhaka',
        ship_postcode: 1000,
        ship_country: 'Bangladesh',
      };
      console.log(data)
      const sslcz = new SSLCommerzPayment(store_id, store_passwd, is_live)
      sslcz.init(data).then(apiResponse => {
        // Redirect the user to payment gateway
        let GatewayPageURL = apiResponse.GatewayPageURL
        res.send({ url: GatewayPageURL })

        const finalOrder = {
          product,
          paidStatus: false,
          tranjectionId: tran_id,
        };
        const result = productCollection.insertOne(finalOrder)

        console.log('Redirecting to: ', GatewayPageURL)
      });

      app.post("/payment/success/:tranId", async (req, res) => {
        console.log(req.params.tranId);
        const result = await productCollection.updateOne(
          { tranjectionId: req.params.tranId },
          {
            $set: {
              paidStatus: true
            }
          }
        );
        if (result.modifiedCount > 0) {
          res.redirect(`http://localhost:5173/payment/success/${req.params.tranId}`)
        }
      })

    })


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

