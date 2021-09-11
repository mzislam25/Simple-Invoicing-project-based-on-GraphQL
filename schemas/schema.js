const graphql = require('graphql');
const User = require('../models/user');
const Customer = require('../models/customer');
const Invoice = require('../models/invoice');
const InvoiceItem = require('../models/invoice_item');
const mongoose = require('mongoose');

const {
    GraphQLInputObjectType,
    GraphQLObjectType,
    GraphQLString,
    GraphQLSchema,
    GraphQLID,
    GraphQLInt,
    GraphQLFloat,
    GraphQLList,
    GraphQLNonNull
} = graphql;

const UserType = new GraphQLObjectType({
    name: 'User',
    fields: () => ({
        id: { type: GraphQLID },
        email: { type: GraphQLString },
        // password: { type: GraphQLString }
    })
});

const CustomerType = new GraphQLObjectType({
    name: 'Customer',
    fields: () => ({
        id: { type: GraphQLID },
        fullName: { type: GraphQLString },
        email: { type: GraphQLString },
        phoneNumber: { type: GraphQLString },
        address: { type: GraphQLString },
    })
});

const InvoiceType = new GraphQLObjectType({
    name: 'Invoice',
    fields: () => ({
        id: { type: GraphQLID },
        customer: {
            type: CustomerType,
            resolve(parent, args) {
                return Customer.findById(parent.customerId);
            }
        },
        creator: {
            type: UserType,
            resolve(parent, args) {
                return User.findById(parent.creatorId);
            }
        },
        invoiceItems: {
            type: new GraphQLList(InvoiceItemType),
            resolve(parent, args) {
                return InvoiceItem.find({ invoiceId: parent.id });
            }
        },
        invoiceNo: { type: GraphQLString },
        date: { type: GraphQLString },
        subtotal: { type: GraphQLFloat },
        total: { type: GraphQLFloat },
    })
});

const InvoiceItemType = new GraphQLObjectType({
    name: 'InvoiceItem',
    fields: () => ({
        id: { type: GraphQLID },
        invoice: {
            type: InvoiceType,
            resolve(parent, args) {
                return Invoice.findById(parent.invoiceId);
            }
        },
        itemName: { type: GraphQLString },
        itemQty: { type: GraphQLInt },
        itemPrice: { type: GraphQLFloat },
        totalPrice: { type: GraphQLFloat },
    })
});

const InputInvoiceItemType = new GraphQLInputObjectType({
    name: 'InputInvoiceItem',
    fields: () => ({
        // id: { type: GraphQLID },
        // invoiceId: { type: GraphQLID },
        itemName: { type: GraphQLString },
        itemQty: { type: GraphQLInt },
        itemPrice: { type: GraphQLFloat },
        totalPrice: { type: GraphQLFloat },
    })
});


const RootQuery = new GraphQLObjectType({
    name: 'RootQueryType',
    fields: {
        currentUser: {
            type: UserType,
            resolve(parent, args, context) {
                return context.getUser();
            }
        },
        customers: {
            type: new GraphQLList(CustomerType),
            resolve(parent, args) {
                return Customer.find();
            }
        },
        invoicesList: {
            type: new GraphQLList(InvoiceType),
            resolve(parent, args) {
                return Invoice.find();
            }
        },
        invoice: {
            type: InvoiceType,
            args: { id: { type: GraphQLID } },
            resolve(parent, args) {
                return Invoice.findById(args.id);
            }
        },
        invoiceSummary: {
            type: new GraphQLList(new GraphQLObjectType({
                name: "invoice",
                fields: {
                    _id: { type: GraphQLString },
                    count: { type: GraphQLInt },
                    date: { type: GraphQLString },
                    subtotal: { type: GraphQLInt },
                    total: { type: GraphQLInt },
                    details: { type: new GraphQLList(InvoiceType) }
                }
            })),
            args: {
                groupBy: { type: GraphQLString },
            },
            async resolve(parent, args) {
                let id;
                if (args.groupBy === "date") {
                    id = { $dateToString: { date: '$date' } };
                }
                else {
                    id = `$${args.groupBy}`;
                }
                // console.log(id);
                const invoices = await Invoice.aggregate([
                    {
                        $group: {
                            _id: id,
                            count: { $sum: 1 },
                            total: { $sum: '$total' },
                            details: { $push: "$$ROOT" }
                        }
                    }
                ]);
                // console.log(invoices);
                return invoices;
            }
        }
    }
});

const Mutation = new GraphQLObjectType({
    name: 'Mutation',
    fields: {
        login: {
            type: UserType,
            args: {
                email: { type: new GraphQLNonNull(GraphQLString) },
                password: { type: new GraphQLNonNull(GraphQLString) }
            },
            async resolve(parent, args, context) {
                const { user, info } = await context.authenticate('graphql-local', { email: args.email, password: args.password });
                // console.log(user, info);
                context.login(user);
                return context.getUser();
            }
        },
        addCustomer: {
            type: CustomerType,
            args: {
                fullName: { type: new GraphQLNonNull(GraphQLString) },
                email: { type: new GraphQLNonNull(GraphQLString) },
                phoneNumber: { type: new GraphQLNonNull(GraphQLString) },
                address: { type: new GraphQLNonNull(GraphQLString) }
            },
            resolve(parent, args) {
                let customer = new Customer({
                    fullName: args.fullName,
                    email: args.email,
                    phoneNumber: args.phoneNumber,
                    address: args.address
                });
                return customer.save();
            }
        },
        createInvoice: {
            type: InvoiceType,
            args: {
                customerId: { type: new GraphQLNonNull(GraphQLString) },
                invoiceItems: {
                    type: new GraphQLList(InputInvoiceItemType)
                }
            },
            async resolve(parent, args, context) {
                if (context.isUnauthenticated()) {
                    throw new Error("Unauthorized");
                } else {
                    const invoiceNo = `AA${Math.floor(1000 + Math.random() * 9000)}`;
                    const items = args.invoiceItems;
                    const subtotal = items.reduce(function (a, b) {
                        return a + b.totalPrice;
                    }, 0);
                    let invoice = new Invoice({
                        invoiceNo,
                        customerId: args.customerId,
                        creatorId: context.getUser().id,
                        date: new Date(),
                        subtotal: subtotal,
                        total: subtotal
                    });
                    let convertedItems = items.map(element => { element.invoiceId = invoice.id; return element });
                    let invoiceItem = await InvoiceItem.insertMany(convertedItems);
                    console.log(invoice, invoiceItem);
                    return invoice.save();
                }
            }
        }
    },
});

module.exports = new GraphQLSchema({
    query: RootQuery,
    mutation: Mutation
});