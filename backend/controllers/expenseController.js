const Expense = require('../models/Expense');

/**
 * Build a MongoDB date filter based on filter keyword
 */
const buildDateFilter = (filter) => {
  const now = new Date();

  switch (filter) {
    case '1month':
      return {
        date: {
          $gte: new Date(now.getFullYear(), now.getMonth(), 1),
          $lte: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59),
        },
      };
    case '2months': {
      const d = new Date();
      d.setMonth(d.getMonth() - 2);
      return { date: { $gte: d } };
    }
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

// @desc    Get all expenses with optional filter
// @route   GET /api/expenses
// @access  Admin, Super Admin
const getExpenses = async (req, res) => {
  try {
    const { filter, page = '1', limit = '20' } = req.query;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const dateFilter = buildDateFilter(filter);

    const [expenses, total, aggregateResult] = await Promise.all([
      Expense.find(dateFilter)
        .populate('recordedBy', 'name')
        .sort({ date: -1 })
        .skip(skip)
        .limit(limitNum),
      Expense.countDocuments(dateFilter),
      Expense.aggregate([
        { $match: dateFilter },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
    ]);

    res.json({
      success: true,
      data: expenses,
      totalAmount: aggregateResult[0]?.total || 0,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('getExpenses error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch expenses.' });
  }
};

// @desc    Add an expense
// @route   POST /api/expenses
// @access  Admin, Super Admin
const addExpense = async (req, res) => {
  try {
    const { name, amount, description, date } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Expense name is required.' });
    }
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      return res.status(400).json({ success: false, message: 'A valid positive amount is required.' });
    }

    const expense = await Expense.create({
      name: name.trim(),
      amount: parseFloat(amount),
      description: description ? description.trim() : undefined,
      date: date ? new Date(date) : new Date(),
      recordedBy: req.user._id,
    });

    const populated = await expense.populate('recordedBy', 'name');

    res.status(201).json({ success: true, data: populated, message: 'Expense added successfully.' });
  } catch (error) {
    console.error('addExpense error:', error);
    res.status(500).json({ success: false, message: 'Failed to add expense.' });
  }
};

// @desc    Update an expense
// @route   PUT /api/expenses/:id
// @access  Admin, Super Admin
const updateExpense = async (req, res) => {
  try {
    const { name, amount, description, date } = req.body;

    const expense = await Expense.findById(req.params.id);
    if (!expense) {
      return res.status(404).json({ success: false, message: 'Expense not found.' });
    }

    if (name !== undefined) expense.name = name.trim();
    if (amount !== undefined) {
      if (isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
        return res.status(400).json({ success: false, message: 'A valid positive amount is required.' });
      }
      expense.amount = parseFloat(amount);
    }
    if (description !== undefined) expense.description = description ? description.trim() : undefined;
    if (date !== undefined) expense.date = new Date(date);

    await expense.save();
    const populated = await expense.populate('recordedBy', 'name');

    res.json({ success: true, data: populated, message: 'Expense updated successfully.' });
  } catch (error) {
    console.error('updateExpense error:', error);
    res.status(500).json({ success: false, message: 'Failed to update expense.' });
  }
};

// @desc    Delete an expense
// @route   DELETE /api/expenses/:id
// @access  Admin, Super Admin
const deleteExpense = async (req, res) => {
  try {
    const expense = await Expense.findByIdAndDelete(req.params.id);
    if (!expense) {
      return res.status(404).json({ success: false, message: 'Expense not found.' });
    }
    res.json({ success: true, message: 'Expense deleted successfully.' });
  } catch (error) {
    console.error('deleteExpense error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete expense.' });
  }
};

// @desc    Get monthly expense stats (current month)
// @route   GET /api/expenses/stats/monthly
// @access  Admin, Super Admin
const getMonthlyStats = async (req, res) => {
  try {
    const now = new Date();
    const monthFilter = {
      date: {
        $gte: new Date(now.getFullYear(), now.getMonth(), 1),
        $lte: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59),
      },
    };

    const result = await Expense.aggregate([
      { $match: monthFilter },
      { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
    ]);

    res.json({
      success: true,
      data: {
        total: result[0]?.total || 0,
        count: result[0]?.count || 0,
        month: now.toLocaleString('default', { month: 'long' }),
        year: now.getFullYear(),
      },
    });
  } catch (error) {
    console.error('getMonthlyStats error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch monthly expense stats.' });
  }
};

module.exports = { getExpenses, addExpense, updateExpense, deleteExpense, getMonthlyStats };
