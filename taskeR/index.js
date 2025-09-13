require('dotenv').config();
const express = require('express');

const bodyParser = require('body-parser');
const cors = require('cors');

const mongoose = require('mongoose'); // ODM Library for connecting and managing MongoDB easier

const app = express();
const port = process.env.PORT || 3000;

const path = require('path')
const bcrypt = require('bcrypt')
const session = require('express-session')
const MongoStore = require('connect-mongo')

const User = require('./models/User')

// Starting server
app.listen(port,() => console.log(`Server running at http://localhost:${port}`));

app.use(cors({
    origin: true,
    credentials: true
}));

app.use(bodyParser.urlencoded({extended : true}));
app.use(bodyParser.json());

app.use(express.static(path.join(__dirname, 'front_end')));

app.use(session({
    name: 'tasker.sid',
    secret: process.env.SESSION_SECRET || 'dev_secret_change_me',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({mongoUrl: process.env.URI}),
    cookie: {
        httpOnly:true,
        maxAge: 1000*60*60*24
    }
}));

// Connect to MongoDB
(async () => {
    await mongoose.connect(process.env.URI).then(() => {
        console.log('Connected to MongoDB (Tasker database).');
    }).catch((err) => {
        console.error('MongoDB Connection Error:', err);
        process.exit(1);
    });
})();

// Create Task Model
const Task = require('./models/Task');
const CompletedTask = require('./models/Task');

function requireLogin(req, res, next){//checks if user needs to log in
    try{
        if (req.session && req.session.userId) return next();// if they are then next user

        if (req.headers.accept && req.headers.accept.includes('application/json')){//checks if the client is expecting JSON response; if so, that means it is not an actual browser,
            // which would request HTML, but the fetch function fetching the tasks
            return res.status(401).json({error:'Unauthorized'});
        }
        return res.redirect('/html/login.html');//if the above conditions are false, that means the user needs to be logged in.

    } catch (err) {

    console.error('Login error', err);
    return res.status(500).send('Server error');
    }
}

app.post('/register', async (req,res) => {
    try{
        const {username, password} = req.body;
        if (!username || !password) return res.status(400).json({error: 'Missing credentials'});

        const Username = username.toLowerCase();

        const existing = await User.findOne({username: Username} );
        if (existing) return res.status(409).json({error: 'Username taken'});

        const pwHash = await bcrypt.hash(password,10);
        const user = new User({username: Username, passwordHash: pwHash});
        await user.save();

        req.session.userId = user._id; // auto-login
        res.status(201).json({message: 'User registered', userId: user._id});

    } catch (err) {
        console.error('register error', err);
        return res.status(500).send('Server, register error');
    }
})

app.post('/login', async (req, res) => {
    try {
        const username = (req.body.username || '').toLowerCase();
        const pw = req.body.password;

        const user = await User.findOne({ username: username });
        if (!user) {
            return res.status(401).send("Invalid credentials");
        }

        const ok = await bcrypt.compare(pw, user.passwordHash); // use pw
        if (!ok) {
            return res.status(401).send("Invalid credentials");
        }

        req.session.userId = user._id;
        return res.redirect('/html/index.html'); // see redirect item below
    } catch (err) {
        console.error('Login error', err);
        return res.status(500).send('Server, login error');
    }
});


app.post('/logout', (req, res) => {
    try{
        req.session.destroy(err => {
            if (err) return res.status(500).json({error: 'Logout failed'});
            res.clearCookie('tasker.sid');
            res.json({message: 'User logged out'});
        })

    } catch (err) {console.error('Login error', err);
    return res.status(500).send('Server, logout error');
}

})

//GET all tasks
app.get('/tasks', async (req, res)=>{
    try {
        const tasks = await Task.find({ owner: req.session.userId} ).sort({ Deadline: 1 });
        console.log(tasks);

        // Ensuring deadline is formatted correctly
        const formattedTasks = tasks.map(task => ({
            _id: task._id,
            Name: task.Name,
            Deadline: task.Deadline ? new Date(task.Deadline) : null
        }));
        console.log("These are the tasks in the tasks collection - \n"+formattedTasks);

        res.status(200).json(formattedTasks);
    } catch (err) {
        res.status(500).json({ error: `Failed to fetch tasks: ${err.message}` });
    }
});

//GET all completed tasks
app.get('/tasks/completed',async (req,res)=>{
    try {
        const completedTasks = await CompletedTask.find({owner: req.session.userId}).sort({ Deadline: 1 });
        console.log(completedTasks);

        // Ensuring deadline is formatted correctly
        const formattedTasks = completedTasks.map(task => ({
            _id: task._id,
            Name: task.Name,
            Deadline: task.Deadline ? new Date(task.Deadline) : null
        }));
        console.log("These are the tasks in the completed_tasks collection - \n"+formattedTasks);

        res.status(200).json(formattedTasks);
    } catch (err) {
        res.status(500).json({ error: `Failed to fetch completed tasks: ${err.message}` });
    }
});


//POST to create a new task
app.post('/tasks', requireLogin, async (req, res) => {
    try {
        if (!req.body.Name || !req.body.Deadline) {
            return res.status(400).json({ error: "Name and Deadline are required" });
        }
        const { Name, Deadline } = req.body;
        const task = new Task({Name, Deadline, owner: req.session.userId});
        await task.save();
        res.status(201).json(task);
    } catch (error) {
        res.status(500).json({ error: `Failed to create task: ${error.message}` });
    }
});

//POST to create a new completed task
app.post("/tasks/completed", async (req, res) => {
    try {
        const task = new CompletedTask({
            Name: req.body.Name,
            Deadline: req.body.Deadline,
            owner: req.session.userId
        });
        const savedTask = await task.save();

        // Delete from active tasks using the correct _id
        if (req.body._id) {
            const deletedTask = await Task.findByIdAndDelete(req.body._id);
            if (!deletedTask) {
                console.log("Active task not found with ID:", req.body._id);
            } else {
                console.log("Active task deleted with ID:", req.body._id);
            }
        }
        res.status(201).send(savedTask);
    } catch (error) {
        console.error("Error moving task to completed:", error.message);
        res.status(500).send(error.message);
    }
});


//DELETE a task by ID
app.delete('/tasks/:id', async (req, res)=>{
    try {
        const id = req.params.id;
        const task = await Task.findOneAndDelete({ _id: id, owner: req.session.userId });

        if (!task) {
            return res.status(404).json({ error: "Task not found" });
        }
        res.status(204).send(); // No content
    } catch (error) {
        res.status(500).json({ error: `Failed to delete task: ${error.message}` });
    }
});

//DELETE a completed task by ID
app.delete("/tasks/completed/:id",async(req, res)=>{
    try {
        console.log(`Attempting to delete completed task with ID: ${req.params.id}`);
        const task = await CompletedTask.findOneAndDelete({_id: req.params.id, owner: req.session.userId});

        if (!task) {
            console.log(`No completed task found with ID: ${req.params.id}`);
            return res.status(404).json({ error: "Completed Task not found" });
        }

        console.log(`Successfully deleted completed task: ${JSON.stringify(task)}`);
        res.status(204).send();
    } catch (error) {
        console.error(`Error deleting completed task: ${error}`);
        res.status(500).json({ error: `Failed to delete completed task: ${error.message}` });
    }
});


//PUT update a task by ID
app.put('/tasks/:id', async (req, res) => {
    try {
        const {Name, Deadline} = req.body;
        const updatedTask = await Task.findOneAndUpdate({
            Name: Name,
            Deadline: Deadline,
            owner: req.session.userId,
        });
        if (!updatedTask) {
            return res.status(404).json({ error: "Task not found" });
        }
        res.json(updatedTask);
    } catch (error) {
        res.status(500).json({ error: `Failed to update task: ${error.message}` });
    }
});








