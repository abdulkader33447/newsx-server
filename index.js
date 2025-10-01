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
    const blogsCollection = db.collection("blogs");

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

    // GET only admin user
    app.get("/admin/:email", async (req, res) => {
      try {
        const email = req.params.email;
        const admin = await userCollection.findOne({ email, name: "admin" });

        if (!admin) {
          return res.status(200).send({}); // empty object return
        }

        res.send(admin);
      } catch (error) {
        console.error(error);
        res.status(500).send({ error: "Server error" });
      }
    });

    // blog post api
    app.post("/blogs", async (req, res) => {
      try {
        const blog = req.body;

        if (
          !blog.title ||
          !blog.categories ||
          !blog.author ||
          !blog.summary ||
          !blog.content
        ) {
          return res.status(400).send({ message: "Missing required fields" });
        }

        const result = await blogsCollection.insertOne(blog);
        res.status(201).send(result)
      } catch (error) {
        console.log("Error posting blog",error);
        res.status(500).send({message:"Internal server error"})
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
