const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
    name: { type: String, required: true },
    quantity: { type: Number, required: true },
    unitPrice: { type: Number, required: true },
    totalPrice: { type: Number, required: true },
    category: { type: String, required: false },
});

const receiptSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User',
        required: true,
      },
    date: {
        type: Date,
        default: Date.now,
    },
    items: [itemSchema],
    totalAmount: {
        type: Number,
        required: false, // nije obavezno jer se izračuna automatski
    },
    note: {
        type: String,
        required: false,
    },
    paymentMethod: {
        type: String,
        enum: ['Cash', 'Card', 'Mobile', 'Other'],
        required: false,
    },
    tags: [{
        type: String,
        required: false,
    }],
    store: {
        type: String, 
        required: false,
    },
});

receiptSchema.pre('save', function (next) {
    this.totalAmount = this.items.reduce((sum, item) => sum + item.totalPrice, 0);
    next();
});

module.exports = mongoose.model('Receipt', receiptSchema);
