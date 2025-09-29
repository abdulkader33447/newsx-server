const express = require("express");
const { MongoClient, ServerApiVersion } = require("mongodb");
const cors = require("cors");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 3000;

// middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.im0knfe.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();

    // collection
    const db = client.db("newsxDB");
    const userCollection = db.collection("users");

    // const newsCollection = client.db("newsxDB").collection("news");

    app.post("/users", async (req, res) => {
      try {
        const user = req.body; // { name, email, password }

        if (!user.name || !user.email || !user.password) {
          return res.status(400).send({ error: "All fields are required" });
        }

        const result = await userCollection.insertOne(user);

        res.status(201).send({
          message: "User created successfully",
          data: result,
        });
      } catch (error) {
        console.error(error);
        res.status(500).send({ error: "Server error" });
      }
    });

    // GET single user by name
    app.get("/user/:name", async (req, res) => {
      try {
        const name = req.params.name;

        if (name !== "admin") {
          return res.status(400).send({ message: "This is not admin" });
        }

        const admin = await userCollection.findOne({ name });
        if (!admin) {
          return res.status(404).send({ message: "Admin not found" });
        }

        res.send(admin);
      } catch (error) {
        console.error(error);
        res.status(500).send({ error: "Server error" });
      }
    });

    // Example route
    app.get("/news", async (req, res) => {
      const news = await newsCollection.find().toArray();
      res.send(news);
    });

    // Test connection
    await client.db("admin").command({ ping: 1 });
    console.log("Connected to MongoDB Atlas");
  } catch (err) {
    console.error("MongoDB connection error:", err);
  }
}

run();

app.get("/", (req, res) => {
  res.send("Simple NEWSX server running");
});

app.listen(port, () => {
  console.log(`Simple CRUD server running on ${port}`);
});
