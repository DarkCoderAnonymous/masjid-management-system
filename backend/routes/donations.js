const express = require('express');
const router = express.Router();
const { getDonations, addDonation, updateDonation, deleteDonation, downloadPDF, getMonthlyDonationStats } = require('../controllers/donationController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');

router.use(protect, authorize('admin', 'super_admin'));

router.get('/stats/monthly', getMonthlyDonationStats);
router.get('/user/:userId', getDonations);
router.get('/user/:userId/pdf', downloadPDF);

router.route('/').post(addDonation);
router.route('/:id').put(updateDonation).delete(deleteDonation);

module.exports = router;
