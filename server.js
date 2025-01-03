const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const bcrypt = require("bcrypt");
const cors = require("cors");
const multer = require("multer");
const upload = multer({ dest: "uploads/" });
const MongoStore = require("connect-mongo");

const app = express();

app.use(express.static(path.join(__dirname, "frontend")));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

const uri = "mongodb+srv://Naufy:6969@activitytracker.jys5x.mongodb.net/";
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

app.post("/api/current", async (req, res) => {
  const { email } = req.body;

  console.log("Request body:", req.body);

  try {
    const user = await Users.findOne({ email }); 
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const activities = await Activity.find({ userNow: email });

    res.status(200).json({
      email: user.email,
      groupName: user.groupName,
      name: user.name,
      activities: activities.map(activity => ({
        name: activity.activityName,
        deadline: activity.deadline,
        isCompleted: activity.isCompleted,
      })),
    });
  } catch (error) {
    console.error("Error fetching user data:", error);
    res.status(500).json({ message: "Internal server error." });
  }
});

app.post("/api/groupMembers", async (req, res) => {
  const { email } = req.body;
  console.log("Request body:", req.body);

  
  try {
    const currentUser = await Users.findOne({ email });

    if (!currentUser) {
      return res.status(404).json({ message: "Current user not found." });
    }

    const groupMembers = await Users.find({ groupName: currentUser.groupName });
    const memberActivities = await Promise.all(
      groupMembers.map(async (member) => {
        const activities = await Activity.find({ userNow: member.email });
        return {
          name: member.name,
          activities: activities.map((activity) => ({
            name: activity.activityName,
            deadline: activity.deadline,
            isCompleted: activity.isCompleted,
          })),
        };
      })
    );

    res.status(200).json(memberActivities);
  } catch (error) {
    console.error("Error fetching group members' activities:", error);
    res.status(500).json({ message: "Internal server error." });
  }
});


app.post("/api/markCompleted", async (req, res) => {
  const { activityId, isCompleted } = req.body;

  console.log("Request body:", req.body);

  try {
    const updatedActivity = await Activity.findOne({ activityName: activityId });

    if (!updatedActivity) {
      return res.status(404).json({ error: "Activity not found" });
    }

    updatedActivity.isCompleted = isCompleted;
    updatedActivity.save();

    res.status(200).json({ message: "Completion status updated successfully" });
  } catch (error) {
    console.error("Error updating completion status:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  groupName: { type: String, default: "" },
});

const Users = mongoose.model("User", userSchema);

const activitySchema = new mongoose.Schema({
  activityName: { type: String, required: true, trim: true },
  deadline: { type: Date, required: true },
  note: { type: String, trim: true, default: "" },
  isCompleted: { type: Boolean, default: false },
  userNow: { type: String, default: "" },
});

const Activity = mongoose.model("Activity", activitySchema);

app.get("/register", (req, res) => {
  res.sendFile(path.join(__dirname, "frontend", "register.html"));
});

app.get("/", (req, res) => {
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


app.post("/register", async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new Users({
      name,
      email,
      password: hashedPassword,
    });
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

app.post("/", async (req, res) => {
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

    res.status(200).json({ message: "Login successful" });
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ message: "Server error. Please try again later." });
  }
});

app.post("/join", async (req, res) => {
  const { email, groupName } = req.body;

  if (!groupName) {
    return res.status(400).json({ message: "Group name are required." });
  }

  try {
    const user = await Users.findOne({ email });
    if (user) {
      const group = await Users.findOne({ groupName });

      if (!group) {
        return res.status(400).json({ message: "You are not a member of this group." });
      } else {
        user.groupName = groupName;
        await user.save();
      }
    } else {
      return res.status(404).json({ message: "Please log in first." });
    }
    res.status(201).json({ message: "Group joined successfully!" });

  } catch (error) {
    console.error("Error joining group:", error);
    res.status(500).json({ message: "Internal server error." });
  }
});

app.get("/choice", (req, res) => {
  res.sendFile(path.join(__dirname, "frontend", "choice.html"));
});

app.post("/create", async (req, res) => {
  const { email, groupName } = req.body;

  console.log("Received session data:", email);


  if (!groupName) {
    return res.status(400).json({ message: "Group name are required." });
  }

  try {
    const existingGroup = await Users.findOne({ groupName: groupName });
    if (existingGroup) {
      return res.status(400).json({ message: "Group name is already taken." });
    }


    const user = await Users.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    user.groupName = groupName;
    await user.save();


    res.status(201).json({ message: "Group created successfully!"});
  } catch (error) {
    res.status(500).json({ message: "Internal server error." });
  }
});

app.get("/activities", (req, res) => {
  res.sendFile(path.join(__dirname, "frontend", "main.html"));
});

app.get("/editprofile", (req, res) => {
  res.sendFile(path.join(__dirname, "frontend", "editprofile.html"));
});

app.get("/addAct", (req, res) => {
  res.sendFile(path.join(__dirname, "frontend", "addActivity.html"));
});

app.post("/addAct", async (req, res) => {
  const { activityName, deadline, note, isCompleted, userNow } = req.body;

  console.log("Received session data:", userNow);

  if (!activityName || !deadline ) {
    return res
      .status(400)
      .json({ message: "Please fill in all required fields." });
  }

  try {
    
    const newActivity = new Activity({
      activityName,
      deadline,
      note,
      isCompleted,
      userNow,
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

app.post("/editprofile", async (req, res) => {
  const { email, name, password } = req.body;

  if (!name) {
    return res.status(400).json({ message: "Name and email are required." });
  }

  try {
    const user = await Users.findOne({ email: email }); 
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    user.name = name;

    if (password) {
      user.password = await bcrypt.hash(password, 8);
    }

    await user.save();
    res.status(200).json({ message: "Profile updated successfully." });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ message: "Internal server error." });
  }
});

const PORT = 5500;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
