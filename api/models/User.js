const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    discordId: { type: String, required: true, unique: true },
    discordUsername: { type: String, required: true },

    // Lưu token OAuth để có thể auto-join server / migrate sang server mới
    accessToken: { type: String },
    refreshToken: { type: String },
    tokenExpiresAt: { type: Date }, // thời điểm hết hạn accessToken
    scopes: [{ type: String }],
    linkedActive: { type: Boolean, default: true, index: true },
    unlinkedAt: { type: Date, default: null },

    walletBalanceCents: { type: Number, default: 0, min: 0 },

    linkToken: { type: String },
    linkTokenExpiresAt: { type: Date },

    cartItems: [{
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        quantity: { type: Number, default: 1, min: 1 }
    }],
    cartUpdatedAt: { type: Date, default: null },
    ticketCreationLockUntil: { type: Date, default: null },

    joinedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);
