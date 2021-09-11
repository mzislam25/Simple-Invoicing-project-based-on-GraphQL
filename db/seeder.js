const mongoose = require('mongoose');
const faker = require('faker');
const Customer = require('../models/customer');
const Invoice = require('../models/invoice');
const InvoiceItem = require('../models/invoice_item');
const User = require('../models/user');

mongoose.connect('mongodb://localhost/graphql-test')
mongoose.connection.once('open', () => {
    console.log('Connected to Database');
});

(async () => {
    // Seed customer
    for (let i = 0; i < 10; i++) {
        const customer = new Customer({
            fullName: faker.name.findName(),
            email: faker.internet.email(),
            phoneNumber: faker.phone.phoneNumber(),
            address: faker.address.streetAddress()
        })
        await customer.save();
    }
    console.log('Customer Done');
    //Seed invoice
    for (let i = 0; i < 30; i++) {
        const customerData = await Customer.find().limit(1).skip(Math.floor(Math.random() * 10));
        const userData = await User.findOne();
        let items = [];
        for (let j = 0; j < Math.floor(Math.random() * 10); j++) {
            const qty = Math.floor(Math.random() * 10);
            const price = faker.commerce.price();
            const invoiceItem = new InvoiceItem({
                itemName: faker.commerce.productName(),
                itemQty: qty,
                itemPrice: price,
                totalPrice: qty * price
            });
            items.push(invoiceItem);
        }
        const subtotal = items.reduce(function (a, b) { return a + b.totalPrice; }, 0);
        const invoice = new Invoice({
            invoiceNo: `AA${Math.floor(1000 + Math.random() * 9000)}`,
            customerId: customerData[0].id,
            creatorId: userData.id,
            date: new Date(faker.date.between('2021-08-01', '2021-09-05')),
            subtotal: subtotal,
            total: subtotal
        })
        await invoice.save();
        let convertedItems = items.map(element => { element.invoiceId = invoice.id; return element });
        await InvoiceItem.insertMany(convertedItems);
    }
    console.log('Invoice Done');

})()