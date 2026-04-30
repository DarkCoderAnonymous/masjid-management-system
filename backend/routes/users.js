const express = require('express');
const router = express.Router();
const { getUsers, getUserCount, getUser, createUser, updateUser, deleteUser } = require('../controllers/userController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');

router.use(protect);

// All authenticated users can see total count
router.get('/count', getUserCount);

// Admin + Super Admin manage users
router.route('/')
  .get(authorize('admin', 'super_admin'), getUsers)
  .post(authorize('admin', 'super_admin'), createUser);

router.route('/:id')
  .get(authorize('admin', 'super_admin'), getUser)
  .put(authorize('admin', 'super_admin'), updateUser)
  .delete(authorize('admin', 'super_admin'), deleteUser);

module.exports = router;
