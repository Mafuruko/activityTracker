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
    // required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now, // Automatically set creation date
  },
});

const Groups = mongoose.model("group", groupSchema);

// API endpoint to get only the group name
app.get("/api/group", async (req, res) => {
  try {
    const group = await Groups.findOne(); // Modify query as per your schema
    if (group) {
      res.json({ groupName: group.name });
    } else {
      res.status(404).json({ message: "Group not found" });
    }
  } catch (error) {
    console.error("Error fetching group:", error);
    res.status(500).json({ message: "Server error" });
  }
});

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});

const Users = mongoose.model("user", userSchema);

const activitySchema = new mongoose.Schema({
  activityName: {
    type: String,
    required: true,
    trim: true,  // Ensures no extra spaces are saved
  },
  deadline: {
    type: Date,
    required: true,  // Ensures the deadline is provided
  },
  category: {
    type: String,
    required: true,  // Ensures category is selected
    trim: true,  // Removes unnecessary whitespace
  },
  note: {
    type: String,
    trim: true,  // Removes unnecessary whitespace
    default: "",  // Optional field, default to empty string if not provided
  },
});

// Create the Activity model
const Activity = mongoose.model("Activity", activitySchema);

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  color: {
    type: String,
    required: true,
  },
});

const Category = mongoose.model('Category', categorySchema);

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

app.post("/create", async (req, res) => {
  const { groupCode } = req.body;

  // Validate input
  if (!groupCode) {
    return res.status(400).json({ message: "Group name is required." });
  }

  try {
    // Check if a group with the same name already exists
    const existingGroup = await Groups.findOne({ name: groupCode });
    if (existingGroup) {
      return res.status(400).json({ message: "Group name already exists." });
    }

    // Create new group
    const newGroup = new Groups({ name: groupCode });
    await newGroup.save();

    res.status(201).json({ message: "Group created successfully.", group: newGroup });
  } catch (error) {
    console.error("Error creating group:", error);
    res.status(500).json({ message: "Internal server error." });
  }
});

// Join Group Endpoint
app.post("/join", async (req, res) => {
  const { groupCode } = req.body;

  // Validate inputs
  if (!groupCode) {
    return res.status(400).json({ message: "Group code are required." });
  }

  try {
    // Find the group by the provided code
    const group = await Groups.findOne({ name: groupCode });
    if (!group) {
      return res.status(404).json({ message: "Group not found." });
    }

    // Check if the user is already a member of the group
    // if (group.members.includes(userId)) {
    //   return res.status(400).json({ message: "User is already a member of this group." });
    // }

    // Add the user to the group members
    // group.members.push(userId);
    // await group.save();

    res.status(200).json({ message: "Successfully joined the group." });
  } catch (error) {
    console.error("Error joining group:", error);
    res.status(500).json({ message: "Internal server error." });
  }
});


app.get("/activity", async (req, res) => {
  try {
    // Fetch activities from the database (customize query as needed)
    const activities = await Activity.find(); // Optionally, add filters here
    res.status(200).json(activities);
  } catch (error) {
    console.error("Error fetching activities:", error);
    res.status(500).json({ message: "Failed to fetch activities." });
  }
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

app.post("/create", async (req, res) => {
  const { groupName} = req.body;

  if (!groupName) {
    return res.status(400).json({ message: "Group name are required." });
  }

  try {
    const existingGroup = await Groups.findOne({ name: groupName });
    if (existingGroup) {
      return res.status(400).json({ message: "Group name is already taken." });
    }

    const group = new Groups({
      name: groupName,
    });

    await group.save();

    res.status(201).json({ message: "Group created successfully", group });
  } catch (error) {
    res.status(500).json({ message: "Internal server error." });
  }
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

app.post("/addAct", async (req, res) => {
  try {
    const { activityName, deadline, category, note } = req.body;

    // Validate required fields
    if (!activityName || !deadline || !category) {
      return res.status(400).json({ message: "Please fill in all required fields." });
    }

    // Create a new activity instance
    const newActivity = new Activity({
      activityName,
      deadline,
      category,
      note,
    });

    // Save the activity to the database
    const savedActivity = await newActivity.save();

    res.status(201).json({
      message: "Activity added successfully!",
      activity: savedActivity,
    });
  } catch (error) {
    console.error("Error adding activity:", error);
    res.status(500).json({ message: "An error occurred while adding the activity." });
  }
});

app.get("/addCat", (req, res) => {
  res.sendFile(path.join(__dirname, "frontend", "addCategory.html"));
});

// let categories = [];

// Endpoint to add category
// Endpoint to add category
app.post('/addCat', async (req, res) => {
  const { categoryName, categoryColor } = req.body;

  if (!categoryName || !categoryColor) {
    return res.status(400).json({ message: 'Category name and color are required' });
  }

  try {
    // Check if category already exists
    const existingCategory = await Category.findOne({ name: categoryName });
    if (existingCategory) {
      return res.status(400).json({ message: 'Category already exists' });
    }

    const newCategory = new Category({
      name: categoryName,
      color: categoryColor,
    });

    await newCategory.save();
    res.status(201).json({ message: 'Category added successfully', category: newCategory });
  } catch (error) {
    console.error('Error adding category:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


// Endpoint to retrieve categories
// Endpoint to retrieve categories
app.get('/categories', async (req, res) => {
  try {
    const categories = await Category.find();
    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});



const PORT = 5500;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
