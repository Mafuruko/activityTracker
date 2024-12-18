const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const bcrypt = require("bcrypt");
const cors = require("cors");

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// MongoDB URI
const uri =
  "mongodb+srv://Naufy:6969@activitytracker.jys5x.mongodb.net/activityTracker?retryWrites=true&w=majority";
// const uri = "mongodb://localhost:27017/activityTracker";
mongoose
  .connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("MongoDB connected successfully!");
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
  });

// MongoDB Models
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});

const Users = mongoose.model("User", userSchema);

const groupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    maxlength: 50,
  },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  createdAt: { type: Date, default: Date.now },
});

const Groups = mongoose.model("Group", groupSchema);

const activitySchema = new mongoose.Schema({
  activityName: { type: String, required: true, trim: true },
  deadline: { type: Date, required: true },
  category: { type: String, required: true, trim: true },
  note: { type: String, trim: true, default: "" },
});

const Activity = mongoose.model("Activity", activitySchema);

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  color: { type: String, required: true },
});

const Category = mongoose.model("Category", categorySchema);

// Routes

// Serve frontend HTML files
app.get("/register", (req, res) => {
  res.sendFile(path.join(__dirname, "frontend", "register.html"));
});

app.get("/index", (req, res) => {
  res.sendFile(path.join(__dirname, "frontend", "index.html"));
});

app.get("/choice", (req, res) => {
  res.sendFile(path.join(__dirname, "frontend", "choice.html"));
});

app.get("/join", (req, res) => {
  res.sendFile(path.join(__dirname, "frontend", "join.html"));
});

app.get("/create", (req, res) => {
  res.sendFile(path.join(__dirname, "frontend", "create.html"));
});

app.get("/activities", (req, res) => {
  res.sendFile(path.join(__dirname, "frontend", "main.html"));
});

app.get("/profile", (req, res) => {
  res.sendFile(path.join(__dirname, "frontend", "profile.html"));
});

app.get("/addAct", (req, res) => {
  res.sendFile(path.join(__dirname, "frontend", "addActivity.html"));
});

app.get("/addCat", (req, res) => {
  res.sendFile(path.join(__dirname, "frontend", "addCategory.html"));
});

// Register User
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

// Login User
app.post("/index", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "All fields are required." });
  }

  try {
    const user = await Users.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    res.status(200).json({ message: "Login successful", user: user.name });
  } catch (error) {
    res.status(500).json({ message: "Server error. Please try again later." });
  }
});

// Create Group
app.post("/create", async (req, res) => {
  const { groupName } = req.body;

  if (!groupName) {
    return res.status(400).json({ message: "Group name is required." });
  }

  try {
    const existingGroup = await Groups.findOne({ name: groupName });
    if (existingGroup) {
      return res.status(400).json({ message: "Group name already exists." });
    }

    const newGroup = new Groups({ name: groupName });
    await newGroup.save();

    res
      .status(201)
      .json({ message: "Group created successfully.", group: newGroup });
  } catch (error) {
    console.error("Error creating group:", error);
    res.status(500).json({ message: "Internal server error." });
  }
});

// Add Activity
app.post("/addAct", async (req, res) => {
  const { activityName, deadline, category, note } = req.body;

  if (!activityName || !deadline || !category) {
    return res
      .status(400)
      .json({ message: "Please fill in all required fields." });
  }

  try {
    const newActivity = new Activity({
      activityName,
      deadline,
      category,
      note,
    });
    const savedActivity = await newActivity.save();

    res.status(201).json({
      message: "Activity added successfully!",
      activity: savedActivity,
    });
  } catch (error) {
    console.error("Error adding activity:", error);
    res.status(500).json({ message: "Internal server error." });
  }
});

// Add Category
app.post("/addCat", async (req, res) => {
  const { categoryName, categoryColor } = req.body;

  if (!categoryName || !categoryColor) {
    return res
      .status(400)
      .json({ message: "Category name and color are required." });
  }

  try {
    const existingCategory = await Category.findOne({ name: categoryName });
    if (existingCategory) {
      return res.status(400).json({ message: "Category already exists." });
    }

    const newCategory = new Category({
      name: categoryName,
      color: categoryColor,
    });
    await newCategory.save();

    res
      .status(201)
      .json({ message: "Category added successfully!", category: newCategory });
  } catch (error) {
    console.error("Error adding category:", error);
    res.status(500).json({ message: "Internal server error." });
  }
});

// Fetch Activities
app.get("/activity", async (req, res) => {
  try {
    const activities = await Activity.find();
    res.status(200).json(activities);
  } catch (error) {
    console.error("Error fetching activities:", error);
    res.status(500).json({ message: "Failed to fetch activities." });
  }
});

// Fetch Categories
app.get("/categories", async (req, res) => {
  try {
    const categories = await Category.find();
    res.json(categories);
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({ message: "Internal server error." });
  }
});

// Server
const PORT = 5500;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
