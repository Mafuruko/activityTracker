const express = require("express");
const mongoose = require("mongoose");
const path = require('path')
const bcrypt = require("bcrypt");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
app.use(bodyParser.json());
app.use(cors());
app.use(express.urlencoded({extended:true}))

// Connect to MongoDB
mongoose.connect("mongodb://127.0.0.1:27017/activityTracker")
const db = mongoose.connection
db.once('open',() => {
  console.log("MongoDB connection successful")
})

// Define the User schema
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});

const Users = mongoose.model("user", userSchema);

// Register endpoint
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
  } catch  (error) {
    res.status(400).json({ error: "Email already exists" });
  }
});

// Login endpoint
app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    const user = await Users.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    res.status(200).json({ message: "Login successful", user: user.name });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// Start the server
const PORT = 5000;

app.get('/register',(req,res)=>{
  res.sendFile(path.join(__dirname, '/frontend/register.html'))
})

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
// activityTracker;