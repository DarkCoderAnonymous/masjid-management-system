const Donation = require('../models/Donation');
const User = require('../models/User');
const { generateDonationPDF } = require('../utils/pdfGenerator');

/**
 * Build a MongoDB date filter based on filter keyword
 */
const buildDateFilter = (filter) => {
  const now = new Date();

  switch (filter) {
    case 'monthly':
      return {
        date: {
          $gte: new Date(now.getFullYear(), now.getMonth(), 1),
          $lte: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59),
        },
      };
    case '3months': {
      const d = new Date();
      d.setMonth(d.getMonth() - 3);
      return { date: { $gte: d } };
    }
    case '6months': {
      const d = new Date();
      d.setMonth(d.getMonth() - 6);
      return { date: { $gte: d } };
    }
    case 'yearly':
      return {
        date: {
          $gte: new Date(now.getFullYear(), 0, 1),
          $lte: new Date(now.getFullYear(), 11, 31, 23, 59, 59),
        },
      };
    default:
      return {};
  }
};

// @desc    Get donations for a specific user
// @route   GET /api/donations/user/:userId
// @access  Admin, Super Admin
const getDonations = async (req, res) => {
  try {
    const { userId } = req.params;
    const { filter, page = '1', limit = '20' } = req.query;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const userExists = await User.exists({ _id: userId, role: 'user' });
    if (!userExists) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const dateFilter = buildDateFilter(filter);
    const query = { userId, ...dateFilter };

    const [donations, total, aggregateResult] = await Promise.all([
      Donation.find(query)
        .populate('recordedBy', 'name')
        .sort({ date: -1 })
        .skip(skip)
        .limit(limitNum),
      Donation.countDocuments(query),
      Donation.aggregate([
        { $match: { userId: require('mongoose').Types.ObjectId.createFromHexString(userId), ...dateFilter } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
    ]);

    res.json({
      success: true,
      data: donations,
      totalAmount: aggregateResult[0]?.total || 0,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('getDonations error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch donations.' });
  }
};

// @desc    Add a donation
// @route   POST /api/donations
// @access  Admin, Super Admin
const addDonation = async (req, res) => {
  try {
    const { userId, amount, date, notes } = req.body;

    if (!userId) return res.status(400).json({ success: false, message: 'User ID is required.' });
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      return res.status(400).json({ success: false, message: 'A valid positive amount is required.' });
    }
    if (!date) return res.status(400).json({ success: false, message: 'Date is required.' });

    const userExists = await User.exists({ _id: userId, role: 'user' });
    if (!userExists) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const donation = await Donation.create({
      userId,
      amount: parseFloat(amount),
      date: new Date(date),
      notes: notes?.trim(),
      recordedBy: req.user._id,
    });

    res.status(201).json({ success: true, data: donation });
  } catch (error) {
    console.error('addDonation error:', error);
    res.status(500).json({ success: false, message: 'Failed to add donation.' });
  }
};

// @desc    Update a donation
// @route   PUT /api/donations/:id
// @access  Admin, Super Admin
const updateDonation = async (req, res) => {
  try {
    const { amount, date, notes } = req.body;
    const donation = await Donation.findById(req.params.id);

    if (!donation) {
      return res.status(404).json({ success: false, message: 'Donation not found.' });
    }

    if (amount !== undefined) {
      if (isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
        return res.status(400).json({ success: false, message: 'A valid positive amount is required.' });
      }
      donation.amount = parseFloat(amount);
    }
    if (date) donation.date = new Date(date);
    if (notes !== undefined) donation.notes = notes?.trim();

    await donation.save();
    res.json({ success: true, data: donation });
  } catch (error) {
    console.error('updateDonation error:', error);
    res.status(500).json({ success: false, message: 'Failed to update donation.' });
  }
};

// @desc    Delete a donation
// @route   DELETE /api/donations/:id
// @access  Admin, Super Admin
const deleteDonation = async (req, res) => {
  try {
    const donation = await Donation.findById(req.params.id);
    if (!donation) {
      return res.status(404).json({ success: false, message: 'Donation not found.' });
    }

    await donation.deleteOne();
    res.json({ success: true, message: 'Donation deleted successfully.' });
  } catch (error) {
    console.error('deleteDonation error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete donation.' });
  }
};

// @desc    Download PDF statement for a user
// @route   GET /api/donations/user/:userId/pdf
// @access  Admin, Super Admin
const downloadPDF = async (req, res) => {
  try {
    const { userId } = req.params;
    const { filter } = req.query;

    const user = await User.findOne({ _id: userId, role: 'user' }).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const dateFilter = buildDateFilter(filter);
    const donations = await Donation.find({ userId, ...dateFilter }).sort({ date: -1 });
    const totalAmount = donations.reduce((sum, d) => sum + d.amount, 0);

    const fileName = `donation-statement-${user.name.replace(/\s+/g, '-')}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

    await generateDonationPDF(res, user, donations, totalAmount, filter);
  } catch (error) {
    console.error('downloadPDF error:', error);
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: 'Failed to generate PDF.' });
    }
  }
};

// @desc    Get donation stats for a specific month/year
// @route   GET /api/donations/stats/monthly?month=5&year=2026
// @access  Admin, Super Admin
const getMonthlyDonationStats = async (req, res) => {
  try {
    const now = new Date();
    const month = parseInt(req.query.month ?? now.getMonth() + 1) - 1; // 0-based
    const year  = parseInt(req.query.year  ?? now.getFullYear());

    const monthFilter = {
      date: {
        $gte: new Date(year, month, 1),
        $lte: new Date(year, month + 1, 0, 23, 59, 59),
      },
    };

    const result = await Donation.aggregate([
      { $match: monthFilter },
      { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
    ]);

    const d = new Date(year, month, 1);
    res.json({
      success: true,
      data: {
        total: result[0]?.total || 0,
        count: result[0]?.count || 0,
        month: d.toLocaleString('default', { month: 'long' }),
        year,
      },
    });
  } catch (error) {
    console.error('getMonthlyDonationStats error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch monthly donation stats.' });
  }
};

module.exports = { getDonations, addDonation, updateDonation, deleteDonation, downloadPDF, getMonthlyDonationStats };
