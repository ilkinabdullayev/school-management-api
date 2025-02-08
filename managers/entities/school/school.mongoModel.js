const mongoose = require('mongoose');


const SchoolSchema = new mongoose.Schema({
    name: { type: String, required: true },
    created_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Users',
        required: true
    },
},  {
    toJSON: {
        transform: function (doc, ret) {
            delete ret.__v;
        }
    }
});

module.exports = mongoose.model('School', SchoolSchema);


