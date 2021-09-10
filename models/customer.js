const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const customerSchema = new Schema({
    fullName: String,
    email: String,
    phoneNumber: String,
    address: String
});

module.exports = mongoose.model('Customer', customerSchema);