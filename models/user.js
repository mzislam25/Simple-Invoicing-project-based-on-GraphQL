const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    message: 'Email is required'
  },
  password: {
    type: String,
    required: true,
    message: 'Password is required'
  },
  createdAt: String,
  updatedAt: String
},
  {
    versionKey: false,
    timestamps: true
  });

const UserModel = mongoose.model('User', userSchema);

module.exports = UserModel;