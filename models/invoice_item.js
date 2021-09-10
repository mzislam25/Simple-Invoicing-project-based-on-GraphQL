const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const invoiceItemSchema = new Schema({
    invoiceId: { type: Schema.Types.ObjectId, ref: 'Invoice' },
    itemName: String,
    itemQty: Number,
    itemPrice: Number,
    totalPrice: Number
});

module.exports = mongoose.model('InvoiceItem', invoiceItemSchema);