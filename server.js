const express = require("express");
const path = require("path");
const app = express();
const admin = require('firebase-admin'); // Importing the Firebase Admin SDK
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');

// Initialize Firebase Admin SDK
var serviceAccount = require("./key.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount) // Initialize the app with your service account
});

const db = admin.firestore();

app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, "public")));
app.use(bodyParser.urlencoded({ extended: true }));

// Serve the main page
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Sign up route
app.post("/signupsubmit", async (req, res) => {
    const { signupName, mail, passcode } = req.body;

    try {
        const userSnapshot = await db.collection('users').where('mail', '==', mail).get();

        if (!userSnapshot.empty) {
            return res.status(400).send("<script>alert('Email already exists'); window.location.href = '/';</script>");
        }

        const hashedPassword = await bcrypt.hash(passcode, 10);

        await db.collection('users').add({ signupName, mail, passcode: hashedPassword });
        res.redirect('/');
    } catch (error) {
        res.status(500).send("Error signing up: " + error.message);
    }
});

// Student login route
app.post("/studloginsubmit", async (req, res) => {
    const { mail, passcode } = req.body;

    try {
        const userSnapshot = await db.collection('users').where('mail', '==', mail).get();

        if (userSnapshot.empty) {
            return res.status(400).send("<script>alert('Invalid email or password'); window.location.href = '/';</script>");
        }

        let userFound = false;
        let userName = '';

        for (const doc of userSnapshot.docs) {
            const user = doc.data();
            const match = await bcrypt.compare(passcode, user.passcode);
            if (match) {
                userFound = true;
                userName = user.signupName;
                break;
            }
        }

        if (userFound) {
            console.log("User Name:", userName);
            res.sendFile(path.join(__dirname, 'public', 'studentland.html'));
        } else {
            res.status(400).send("<script>alert('Invalid email or password'); window.location.href = '/';</script>");
        }
    } catch (error) {
        res.status(500).send("Error logging in: " + error.message);
    }
});

// Admin login route
app.post("/AdminLoginSubmit", (req, res) => {
    const { Adminmail, Adminpass } = req.body;
    
    // Use environment variables for admin credentials
    const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "Admin@vishnu.edu.in";
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Admin@1234";

    if (Adminmail === ADMIN_EMAIL && Adminpass === ADMIN_PASSWORD) {
        res.sendFile(path.join(__dirname, 'public', 'Admin_Dash.html'));
    } else {
        res.status(400).send("<script>alert('Invalid email or password'); window.location.href = '/';</script>");
    }
});

// Idea submission route
app.post("/ideaSubmission", async (req, res) => {
    const { idea_name, idea_email, idea_roll, idea_size, idea_vacan, idea_category, idea_domain, idea_desc } = req.body;
    try {
        await db.collection('Student_Ideas').add({ idea_name, idea_email, idea_roll, idea_size, idea_vacan, idea_category, idea_domain, idea_desc });
        console.log("Idea Submitted Successfully!");
        res.redirect("/studentland.html"); // Redirect to a relevant page
    } catch (error) {
        res.status(500).send("Error submitting idea: " + error.message);
    }
});

// Get all submitted projects
app.get('/projects', async (req, res) => {
    try {
        const snapshot = await db.collection('Student_Ideas').get();
        const projects = [];

        snapshot.forEach(doc => {
            projects.push(doc.data()); // Collect the data of each document
        });

        res.json(projects); // Send back as JSON
    } catch (error) {
        console.error('Error retrieving projects:', error);
        res.status(500).send('Error retrieving projects');
    }
});

// Final year project submission route
app.post("/finalyearProjectSubmission", async (req, res) => {
    const { final_idea, final_abs, final_year, final_batch, final_size, final_team_name, final_data, final_category, final_domain } = req.body;
    try {
        await db.collection('Final_Year_Projects').add({ final_idea, final_abs, final_year, final_batch, final_size, final_team_name, final_data, final_category, final_domain });
        console.log("Final Year Project Submitted Successfully");
        res.redirect('/'); // Redirect to the main page or a relevant page
    } catch (error) {
        res.status(500).send("Error submitting final year project: " + error.message);
    }
});

// Get all final year projects
app.get('/getFinalYearProjects', async (req, res) => {
    try {
        const snapshot = await db.collection('Final_Year_Projects').get();
        const projects = [];
        snapshot.forEach(doc => {
            projects.push(doc.data());
        });
        res.json(projects);
    } catch (error) {
        res.status(500).send('Error retrieving final year projects: ' + error.message);
    }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
