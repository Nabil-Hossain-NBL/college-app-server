const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.vn3zm0i.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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
    // Connect the client to the server
    const collegeCollection = client
      .db("collegeManager")
      .collection("colleges");

    const admissionsCollection = client
      .db("collegeManager")
      .collection("admissions");

    // Fetch colleges with optional search by name
    app.get("/colleges", async (req, res) => {
      try {
        const { name } = req.query; // Extract search query from request

        // Build the query object
        const query = name ? { name: { $regex: name, $options: "i" } } : {};

        const result = await collegeCollection.find(query).toArray();

        if (result.length === 0) {
          return res.status(404).send({ message: "No colleges found" });
        }

        res.send(result);
      } catch (error) {
        console.error("Error fetching colleges:", error);
        res.status(500).send({ message: "Error fetching colleges" });
      }
    });

    // Fetch a single college by ID
    app.get("/college/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const result = await collegeCollection.findOne(filter);
      res.send(result);
    });

    // Fetch admissions by user ID
    // Fetch admissions for a specific user ID
    app.get("/admissions", async (req, res) => {
      try {
        const { userId } = req.query; // Extract userId from query parameters

        if (!userId) {
          return res.status(400).send({ message: "User ID is required" });
        }

        // Find admissions where userId matches
        const result = await admissionsCollection.find({ userId }).toArray();

        if (result.length === 0) {
          return res
            .status(404)
            .send({ message: "No admissions found for this user" });
        }

        res.send(result); // Send matching admissions data
      } catch (error) {
        console.error("Error fetching admissions:", error);
        res.status(500).send({ message: "Error fetching admissions" });
      }
    });

    // Save admission data
    app.post("/admission", async (req, res) => {
      try {
        const admissionData = req.body;

        // Validate the required fields
        if (
          !admissionData.collegeId ||
          !admissionData.candidateName ||
          !admissionData.subject ||
          !admissionData.email ||
          !admissionData.phone ||
          !admissionData.address ||
          !admissionData.dob ||
          !admissionData.image
        ) {
          return res.status(400).send({ message: "All fields are required!" });
        }

        const result = await admissionsCollection.insertOne(admissionData);
        res.send({
          message: "Admission successfully submitted",
          result,
        });
      } catch (error) {
        console.error("Error saving admission data:", error);
        res.status(500).send({ message: "Error saving admission data" });
      }
    });

    // Fetch all admissions
    app.get("/admissions", async (req, res) => {
      try {
        const result = await admissionsCollection.find().toArray();
        res.send(result);
      } catch (error) {
        console.error("Error fetching admissions:", error);
        res.status(500).send({ message: "Error fetching admissions" });
      }
    });

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
  res.send("College Manager API is running");
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
