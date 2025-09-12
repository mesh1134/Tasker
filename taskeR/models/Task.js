mongoose = require('mongoose')

// Define Task Schema
const taskSchema = new mongoose.Schema({
    Name: { type: String, required: true },
    Deadline: { type: Date, required: true },
    owner: {type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User'}

});

module.exports = mongoose.model('Task', taskSchema);