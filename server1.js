const express = require("express");
const path = require("path");
const app = express();
const admin = require('firebase-admin'); // Importing the Firebase Admin SDK
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');

var serviceAccount = require("./key.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount) // Initialize the app with your service account
  });
  
  const db = admin.firestore();

app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, "public")));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

app.get("/" , (req , res) => {
    res.sendFile(path.join(__dirname, 'public', 'indexcopy.html'));
});

app.post("/signupsubmit", async (req, res) => {
    const { signupName, mail, passcode } = req.body;

    try {
        const userSnapshot = await db.collection('campus').where('mail', '==', mail).get();

        if (!userSnapshot.empty) {
            return res.status(400).send("Email already exists");
        }

        const hashedPassword = await bcrypt.hash(passcode, 10);

        await db.collection('campus').add({ signupName, mail, passcode: hashedPassword });
        res.redirect('/');
    } catch (error) {
        res.status(500).send("Error signing up: " + error.message);
    }
});

app.post("/studloginsubmit", async (req, res) => {
    const { mail, passcode } = req.body;

    try {
        const userSnapshot = await db.collection('campus').where('mail', '==', mail).get();

        if (userSnapshot.empty) {
            return res.status(400).send("Invalid email or password");
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
            res.status(400).send("Invalid email or password");
        }
    } catch (error) {
        res.status(500).send("Error logging in: " + error.message);
    }
});

app.post("/AdminLoginSubmit" , async(req , res) => {
    const {Adminmail , Adminpass} = req.body;
    if(Adminmail == "Admin@vishnu.edu.in" && Adminpass == "Admin@1234"){
        //res.sendFile(path.join(__dirname, 'public', 'view_projects.html'));
        res.sendFile(path.join(__dirname, 'public', 'Admin_Dash.html'));
    }
    else{
        res.status(400).send("Invalid email or password");
    }
})

app.post("/ideaSubmission" , async(req , res) => {
    const {idea_name , idea_email , idea_roll , idea_size , idea_vacan , idea_category , idea_domain , idea_desc} = req.body;
    await db.collection('Student_Ideas').add({idea_name , idea_email , idea_roll , idea_size , idea_vacan , idea_category , idea_domain , idea_desc});
    console.log("Idea Submitted Successfully !")
    res.redirect("/studloginsubmit");

});

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

app.post("/finalyearProjectSubmission" , async(req , res) => {
    const {final_idea , final_abs , final_year , final_batch , final_size , final_team_name , final_data , final_category , final_domain} = req.body;
    await db.collection('Final_Year_Projects').add({final_idea , final_abs , final_year , final_batch , final_size , final_team_name , final_data , final_category , final_domain});
    console.log("Submitted Successfully");
});

app.get('/getFinalYearProjects', async (req, res) => {
    const snapshot = await db.collection('Final_Year_Projects').get();
    const projects = [];
    snapshot.forEach(doc => {
        projects.push(doc.data());
    });
    res.json(projects);
});


app.listen(3000, () => {
    console.log("Server is running on port 3000");

});
