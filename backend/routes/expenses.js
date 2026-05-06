const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');
const {
  getExpenses,
  addExpense,
  updateExpense,
  deleteExpense,
  getMonthlyStats,
  downloadExpensePDF,
} = require('../controllers/expenseController');

const adminOnly = [protect, authorize('admin', 'super_admin')];

router.get('/stats/monthly', ...adminOnly, getMonthlyStats);
router.get('/pdf', ...adminOnly, downloadExpensePDF);
router.get('/', ...adminOnly, getExpenses);
router.post('/', ...adminOnly, addExpense);
router.put('/:id', ...adminOnly, updateExpense);
router.delete('/:id', ...adminOnly, deleteExpense);

module.exports = router;
