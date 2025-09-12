const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
   username: {required: true, type: String, lowercase: true, trim: true},
    passwordHash: {required: true, type: String},
    createdAt: {type: Date, default: Date.now()}
});

module.exports = mongoose.model('User', userSchema);