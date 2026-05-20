const express = require('express');
const jwt = require('jsonwebtoken');
const Order = require('../models/Order');
const Proof = require('../models/Proof');

const router = express.Router();

const getToken = (req) => {
    const authHeader = req.headers.authorization || '';
    if (authHeader.startsWith('Bearer ')) {
        return authHeader.slice('Bearer '.length).trim();
    }
    return req.header('x-auth-token');
};

const getAdminJwtSecret = () => process.env.JWT_ADMIN_SECRET || process.env.JWT_SECRET || '';

const adminAuth = (req, res, next) => {
    const token = getToken(req);
    if (!token) return res.status(401).json({ message: 'No token' });

    const secret = getAdminJwtSecret();
    if (!secret) return res.status(500).json({ message: 'JWT admin secret missing' });

    try {
        const decoded = jwt.verify(token, secret);
        if (decoded.role !== 'admin') throw new Error('Not admin');
        req.user = decoded;
        return next();
    } catch {
        return res.status(401).json({ message: 'Token invalid' });
    }
};

const getPeriodStarts = () => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(todayStart);
    const day = todayStart.getDay();
    const diffToMonday = day === 0 ? -6 : 1 - day;
    weekStart.setDate(todayStart.getDate() + diffToMonday);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    return { todayStart, weekStart, monthStart };
};

const paidMatch = {
    $or: [{ status: 'Completed' }, { paymentStatus: 'paid' }]
};

const sumSales = async (startDate) => {
    const [result] = await Order.aggregate([
        { $match: { ...paidMatch, createdAt: { $gte: startDate } } },
        {
            $group: {
                _id: null,
                revenue: { $sum: '$totalAmount' },
                orders: { $sum: 1 }
            }
        }
    ]);

    return {
        revenue: Number(result?.revenue || 0),
        orders: Number(result?.orders || 0)
    };
};

router.use(adminAuth);

router.get('/sales', async (_req, res) => {
    try {
        const { todayStart, weekStart, monthStart } = getPeriodStarts();
        const [today, week, month, weekProofCount, recentProofs] = await Promise.all([
            sumSales(todayStart),
            sumSales(weekStart),
            sumSales(monthStart),
            Proof.countDocuments({ createdAt: { $gte: weekStart } }),
            Proof.find({})
                .sort({ createdAt: -1 })
                .limit(6)
                .select('orderId robloxUsername totalAmount items imageUrls createdAt')
                .lean()
        ]);

        return res.json({
            today,
            week: { ...week, proofs: weekProofCount },
            month,
            recentProofs
        });
    } catch {
        return res.status(500).json({ message: 'Failed to load sales analytics' });
    }
});

router.get('/recent-orders', async (req, res) => {
    try {
        const limit = Math.min(20, Math.max(1, Number(req.query?.limit) || 20));
        const orders = await Order.find({})
            .sort({ createdAt: -1 })
            .limit(limit)
            .select('orderId discordUsername robloxUsername totalAmount status paymentStatus createdAt items')
            .lean();

        return res.json({ orders });
    } catch {
        return res.status(500).json({ message: 'Failed to load recent orders' });
    }
});

router.get('/top-products', async (req, res) => {
    try {
        const limit = Math.min(10, Math.max(1, Number(req.query?.limit) || 10));
        const { monthStart } = getPeriodStarts();
        const products = await Order.aggregate([
            { $match: { ...paidMatch, createdAt: { $gte: monthStart } } },
            { $unwind: '$items' },
            {
                $group: {
                    _id: '$items.name',
                    revenue: {
                        $sum: {
                            $multiply: [
                                { $ifNull: ['$items.quantity', 0] },
                                { $ifNull: ['$items.price', 0] }
                            ]
                        }
                    },
                    quantity: { $sum: { $ifNull: ['$items.quantity', 0] } },
                    orderCount: { $sum: 1 }
                }
            },
            { $sort: { revenue: -1, quantity: -1 } },
            { $limit: limit },
            {
                $project: {
                    _id: 0,
                    name: '$_id',
                    revenue: 1,
                    quantity: 1,
                    orderCount: 1
                }
            }
        ]);

        return res.json({ products });
    } catch {
        return res.status(500).json({ message: 'Failed to load top products' });
    }
});

module.exports = router;
