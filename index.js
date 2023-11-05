const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();

const { MongoClient, ServerApiVersion } = require("mongodb");

const port = process.env.PORT || 5000;

//middleware
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.lxmrjjn.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const servicesCollection = client.db("printMamaDB").collection("services");

    //POST A SERVICE
    app.post("/api/mama/services", async (req, res) => {
      const service = req.body;
      const result = await servicesCollection.insertOne(service);
      res.send(result);
    });

    //get all service in service page

    app.get("/api/mama/services", async (req, res) => {
      const result = await servicesCollection.find().toArray();
      res.send(result);
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Print MAMA Server is Running");
});

app.listen(port, (req, res) => {
  console.log(`Print Mama Runing on this Port: ${port}`);
});
