const express = require("express");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
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
        res.status(201).send(result);
      } catch (error) {
        console.log("Error posting blog", error);
        res.status(500).send({ message: "Internal server error" });
      }
    });

    // get blogs
    app.get("/resources", async (req, res) => {
      try {
        // Query params theke page number nao, default 1
        const page = parseInt(req.query.page) || 1;
        const limit = 8;
        const skip = (page - 1) * limit;

        // Total blogs count
        const totalBlogs = await blogsCollection.countDocuments();

        // Paginated blogs
        const blogs = await blogsCollection
          .find({})
          .project({
            imageUrl: 1,
            categories: 1,
            title: 1,
            summary: 1,
            author: 1,
            publish_date: 1,
            _id: 1,
          })
          .skip(skip)
          .limit(limit)
          .toArray();

        res.status(200).send({
          message: "Blogs retrieved successfully",
          currentPage: page,
          totalPages: Math.ceil(totalBlogs / limit),
          totalBlogs: totalBlogs,
          blogsPerPage: limit,
          data: blogs,
        });
      } catch (error) {
        console.error("Error fetching blogs:", error);
        res.status(500).send({
          message: "Internal server error",
          error: error.message,
        });
      }
    });

    // Get recent 9 blogs (recent blogs page)
    app.get("/blogs/recent", async (req, res) => {
      try {
        const recentBlogs = await blogsCollection
          .find(
            {},
            {
              projection: {
                imageUrl: 1,
                categories: 1,
                title: 1,
                summary: 1,
                author: 1,
                publish_date: 1,
              },
            }
          )
          .sort({ publish_date: -1 }) // latest first
          .limit(9)
          .toArray();

        if (!recentBlogs || recentBlogs.length === 0) {
          return res.status(404).send({ message: "No blogs found" });
        }

        res.status(200).send({
          message: "Recent 9 blogs retrieved successfully",
          total: recentBlogs.length,
          data: recentBlogs,
        });
      } catch (error) {
        console.error("Error fetching recent blogs:", error);
        res
          .status(500)
          .send({ message: "Internal server error", error: error.message });
      }
    });

    // Get single blog by id
    app.get("/blogs/:id", async (req, res) => {
      try {
        const id = req.params.id;

        // Validate ObjectId
        if (!ObjectId.isValid(id)) {
          return res.status(400).send({ message: "Invalid blog id" });
        }

        const blog = await blogsCollection.findOne({ _id: new ObjectId(id) });

        if (!blog) {
          return res.status(404).send({ message: "Blog not found" });
        }

        res.status(200).send({
          message: "Blog retrieved successfully",
          data: blog,
        });
      } catch (error) {
        console.error("Error fetching blog details:", error);
        res
          .status(500)
          .send({ message: "Internal server error", error: error.message });
      }
    });

    // get all blogs (for dashboard)
    app.get("/blogs", async (req, res) => {
      try {
        const blogs = await blogsCollection
          .find({})
          .project({
            title: 1,
            status: 1, // Draft / Published / Scheduled
            views: 1,
            publish_date: 1,
            author: 1,
          })
          .sort({ publish_date: -1 })
          .toArray();

        res.status(200).send({
          message: "All blogs retrieved successfully",
          total: blogs.length,
          data: blogs,
        });
      } catch (error) {
        console.error("Error fetching blogs:", error);
        res.status(500).send({ message: "Internal server error" });
      }
    });

    // Test connection
    // await client.db("admin").command({ ping: 1 });
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
