require('dotenv').config();
const express = require('express');

const bodyParser = require('body-parser');
const cors = require('cors');

const mongoose = require('mongoose'); // ODM Library for connecting and managing MongoDB easier

const app = express();
const port = 3000;

// Start server
app.listen(port,() => console.log(`Server running at http://localhost:${port}`));

app.use(cors());
app.use(bodyParser.urlencoded({extended : true}));
app.use(bodyParser.json());

app.post('/login', async(req, res)=>{
    let username =  req.body.body.username;
    let pw = req.body.password;
    console.log(username, pw);

    if(username !== "admin" || pw !== "admin123"){
        res.send("<p>Sorry, your username or password is wrong.</p><br>" +
            "<a href='login.html'>Click here to try again!</a>");


    }else{
        res.redirect("front_end/html/index.html");
    }
})

// Connect to MongoDB
(async () => {
    await mongoose.connect(process.env.URI).then(() => {
        console.log('Connected to MongoDB (Tasker database).');
    }).catch((err) => {
        console.error('MongoDB Connection Error:', err);
        process.exit(1);
    });
})();

// Define Task Schema
const taskSchema = new mongoose.Schema({
    Name: { type: String, required: true },
    Deadline: { type: Date, required: true },
});

// Create Task Model
const Task = mongoose.model('Task', taskSchema);
const CompletedTask = mongoose.model('Completed_Task',taskSchema);


//GET all tasks
app.get('/tasks', async (req, res)=>{
    try {
        const tasks = await Task.find().sort({ Deadline: 1 });
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
        const completedTasks = await CompletedTask.find().sort({ Deadline: 1 });
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
app.post('/tasks', async (req, res) => {
    try {
        if (!req.body.Name || !req.body.Deadline) {
            return res.status(400).json({ error: "Name and Deadline are required" });
        }
        const task = new Task(req.body);
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
        const task = await Task.findByIdAndDelete(id);

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
        const task = await CompletedTask.findByIdAndDelete(req.params.id);

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
        const updatedTask = await Task.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!updatedTask) {
            return res.status(404).json({ error: "Task not found" });
        }

        res.json(updatedTask);
    } catch (error) {
        res.status(500).json({ error: `Failed to update task: ${error.message}` });
    }
});








