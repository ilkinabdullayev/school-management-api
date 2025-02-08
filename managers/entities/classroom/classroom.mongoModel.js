const mongoose = require('mongoose');


const ClassroomSchema = new mongoose.Schema({
    name: { type: String, required: true },
    schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
    capacity: { type: Number, required: true },
    resources: [{ type: String }],
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

module.exports = mongoose.model('Classroom', ClassroomSchema);


