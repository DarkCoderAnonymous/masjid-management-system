const express = require('express');
const router = express.Router();
const { getAdmins, createAdmin, updateAdmin, deleteAdmin } = require('../controllers/adminController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');

router.use(protect, authorize('super_admin'));

router.route('/').get(getAdmins).post(createAdmin);
router.route('/:id').put(updateAdmin).delete(deleteAdmin);

module.exports = router;
