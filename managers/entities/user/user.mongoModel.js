const mongoose = require('mongoose');


const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['SuperAdmin', 'SchoolAdmin'], required: true },
},  {
    toJSON: {
        transform: function (doc, ret) {
            delete ret.password;
            delete ret.__v;
        }
    }
});

module.exports = mongoose.model('User', UserSchema);


