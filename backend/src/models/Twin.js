const mongoose = require('mongoose');

const twinSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    productivityData: {
        meetings: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Meeting'
        }],
        emails: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Email'
        }],
        todos: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Todo'
        }],
        lastUpdated: {
            type: Date,
            default: Date.now
        }
    }
});

const Twin = mongoose.model('Twin', twinSchema);

module.exports = Twin;