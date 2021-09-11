const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const invoiceSchema = new Schema({
    invoiceNo: String,
    customerId: { type: Schema.Types.ObjectId, ref: 'Customer' },
    creatorId: { type: Schema.Types.ObjectId, ref: 'User' },
    date: { type: Date, default: Date.now },
    subtotal: Number,
    total: Number
});

module.exports = mongoose.model('Invoice', invoiceSchema);