const mongoose = require('mongoose');

const RoleSchema = new mongoose.Schema({
    userId: {  type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    collection: { type: String, required: true },
    action: { type: String, required: true }
},  {
    toJSON: {
        transform: function (doc, ret) {
            delete ret.__v;
        }
    }
});

module.exports = mongoose.model('Role', RoleSchema);


