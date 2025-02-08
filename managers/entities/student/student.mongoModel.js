const mongoose = require('mongoose');


const StudentSchema = new mongoose.Schema({
    firstname: { type: String, required: true },
    lastname: { type: String, required: true },
    age: { type: Number, required: true },
    grade: { type: String, required: true },
    classroomId: { type: mongoose.Schema.Types.ObjectId, ref: 'Classroom', required: true },
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

module.exports = mongoose.model('Student', StudentSchema);


