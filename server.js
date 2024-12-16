const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const bcrypt = require("bcrypt");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
app.use(bodyParser.json());
app.use(cors());
app.use(express.urlencoded({ extended: true }));

// Connect to MongoDB
mongoose.connect("mongodb://127.0.0.1:27017/activityTracker", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const db = mongoose.connection;
db.once("open", () => {
  console.log("MongoDB connection successful");
});

const groupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    maxlength: 50, // Limit the group name to 50 characters
  },
  members: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user", // Refers to the User collection
    },
  ],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now, // Automatically set creation date
  },
});

const Groups = mongoose.model("Group", groupSchema);

// Define the User schema
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});

const Users = mongoose.model("user", userSchema);

// Serve the `register.html` file for the `/register` route
app.get("/register", (req, res) => {
  res.sendFile(path.join(__dirname, "frontend", "register.html"));
});

// API endpoint to handle registration
app.post("/register", async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new Users({ name, email, password: hashedPassword });
    await newUser.save();
    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({ error: "Email already exists" });
    } else {
      res.status(500).json({ error: "Internal server error" });
    }
  }
});

app.get("/index", (req, res) => {
  res.sendFile(path.join(__dirname, "frontend", "index.html"));
});

// Login endpoint
app.post("/index", async (req, res) => {
  const { email, password } = req.body;

  // Basic validation
  if (!email || !password) {
    return res.status(400).json({ message: "All fields are required." });
  }

  try {
    // Check if the user exists in the database
    const user = await Users.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    // Compare the password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    // Success
    res.status(200).json({ message: "Login successful", user: user.name });
  } catch (error) {
    res.status(500).json({ message: "Server error. Please try again later." });
  }
});

app.get("/choice", (req, res) => {
  res.sendFile(path.join(__dirname, "frontend", "choice.html"));
});

// Serve join.html for "Join Group" action
app.get("/join", (req, res) => {
  res.sendFile(path.join(__dirname, "frontend", "join.html"));
});

// Serve create.html for "Create Group" action
app.get("/create", (req, res) => {
  res.sendFile(path.join(__dirname, "frontend", "create.html"));
});

app.post("/create", async (req, res) => {
  const { groupName, createdBy } = req.body;

  // Validate inputs
  if (!groupName || !createdBy) {
    return res.status(400).json({ message: "Group name and creator are required." });
  }

  try {
    // Check if the group name already exists
    const existingGroup = await Groups.findOne({ name: groupName });
    if (existingGroup) {
      return res.status(400).json({ message: "Group name is already taken." });
    }

    // Create and save the group
    const group = new Group({
      name: groupName,
      createdBy,
      members: [createdBy], // Add the creator as the first member
    });

    await group.save();

    res.status(201).json({ message: "Group created successfully", group });
  } catch (error) {
    console.error("Error creating group:", error);
    res.status(500).json({ message: "Internal server error." });
  }
});


// Start the server
const PORT = 5500;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
