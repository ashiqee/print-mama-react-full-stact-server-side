const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const port = process.env.PORT || 5000;

//middleware
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.lxmrjjn.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

//middlewares

const logger = (req, res, next) => {
  console.log("log", req.method, req.url);
  next();
};

const verifyToken = (req, res, next) => {
  const token = req?.cookies?.token;
  console.log(token);

  if (!token) {
    return res.status(401).send({ message: "unauthorized access" });
  }

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: "unauthorized access" });
    }

    req.user = decoded;

    next();
  });
};

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    const servicesCollection = client.db("printMamaDB").collection("services");
    const serviceBookingCollection = client.db("printMamaDB").collection('serviceBookings')

    //auth JWT api securere

    app.post("/api/mama/jwt", async (req, res) => {
      const user = req.body;

      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: 60 * 60,
      });

      res
        .cookie("token", token, {
          httpOnly: true,
          secure: true,
          sameSite: "none",
        })
        .send({ success: true });
    });

    app.post("/api/mama/logout", async (req, res) => {
      const user = req.body;
      res.clearCookie("token", { maxAge: 0 }).send({ success: true });
    });

    //POST A SERVICE
    app.post("/api/mama/services", async (req, res) => {
      const service = req.body;
      const result = await servicesCollection.insertOne(service);
      res.send(result);
    });

//post a booking service

app.post('/api/mama/booking',async (req,res)=>{
  const bookedData = req.body;
  const result = await serviceBookingCollection.insertOne(bookedData);
  res.send(result);
})



//get my booking data

app.get('/api/mama/mybooking',verifyToken,logger,async(req,res)=>{
  if (req.user?.email !== req.query.email) {
    return res.status(403).send({ message: "forbidden access" });
  }
  // console.log(req.query.email);
  let query = {};
  if (req.query?.email) {
    query = { userEmail: req.query.email };
  }
  // console.log(query);
  const result = await serviceBookingCollection.find(query).toArray();
  res.send(result);
})


    //get all service in service page

    app.get("/api/mama/services", async (req, res) => {
      const result = await servicesCollection.find().toArray();
      res.send(result);
    });

    // get user base service

    app.get("/api/mama/myservice", verifyToken, logger, async (req, res) => {
      // console.log(req.user.email, req.query.email);

      if (req.user?.email !== req.query.email) {
        return res.status(403).send({ message: "forbidden access" });
      }
      // console.log(req.query.email);
      let query = {};
      if (req.query?.email) {
        query = { serviceProviderEmail: req.query.email };
      }
      // console.log(query);
      const result = await servicesCollection.find(query).toArray();
      res.send(result);
    });

    //get a service info for update

    app.get("/api/mama/updateService/:id", logger, verifyToken, async (req, res) => {
      const id = req.params.id;

      // if(req.user?.email !== serviceProviderEmail){
      //   return res.status(403).send({ message: "forbidden access" });
      // }

      const query = { _id: new ObjectId(id) };
      const options = {
        projection: {
          image: 1,
          serviceName: 1,
          price: 1,
          serviceArea: 1,
          description: 1,
        },
      };
      const result = await servicesCollection.findOne(query, options);
      res.send(result);
    });
    //get a service info for Details page

    app.get("/api/mama/serviceDetails/:id", logger, verifyToken, async (req, res) => {
      const id = req.params.id;

     
      const query = { _id: new ObjectId(id) };
      // const options = {
      //   projection: {
      //     image: 1,
      //     serviceName: 1,
      //     price: 1,
      //     serviceArea: 1,
      //     description: 1,
      //   },
      // };
      const result = await servicesCollection.findOne(query);
      res.send(result);
    });

    //update service data
    app.patch('/api/mama/update/:id', async(req,res)=>{
      const id =req.params.id;

      const filter ={_id: new ObjectId(id)};

      
      const updateData = req.body;

     

      const updateDoc ={
        $set: {
          image: updateData.image,
          serviceName: updateData.serviceName,
          price: updateData.price,
          serviceArea: updateData.serviceArea,
          description: updateData.description,

        }
      }
      console.log(updateDoc);
      const result = await servicesCollection.updateOne(filter,updateDoc)
res.send(result);
    })

    //delete service data
    app.delete("/api/mama/delete/:id", async (req, res) => {
      const id = req.params.id;

      const query = { _id: new ObjectId(id) };

      const result = await servicesCollection.deleteOne(query);
      res.send(result);
    });

    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
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
