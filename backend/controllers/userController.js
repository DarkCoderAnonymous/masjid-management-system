const User = require('../models/User');
const Donation = require('../models/Donation');

// @desc    Get all users (paginated + search)
// @route   GET /api/users
// @access  Admin, Super Admin
const getUsers = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));
    const skip = (page - 1) * limit;
    const search = req.query.search || '';

    const query = { role: 'user' };
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { mobile: { $regex: search, $options: 'i' } },
      ];
    }

    const [users, total] = await Promise.all([
      User.find(query).select('-password').skip(skip).limit(limit).sort({ createdAt: -1 }),
      User.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: users,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('getUsers error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch users.' });
  }
};

// @desc    Get total user count
// @route   GET /api/users/count
// @access  All authenticated roles
const getUserCount = async (req, res) => {
  try {
    const total = await User.countDocuments({ role: 'user' });
    res.json({ success: true, total });
  } catch (error) {
    console.error('getUserCount error:', error);
    res.status(500).json({ success: false, message: 'Failed to get user count.' });
  }
};

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Admin, Super Admin
const getUser = async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.params.id, role: 'user' }).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    res.json({ success: true, data: user });
  } catch (error) {
    console.error('getUser error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch user.' });
  }
};

// @desc    Create user
// @route   POST /api/users
// @access  Admin, Super Admin
const createUser = async (req, res) => {
  try {
    const { name, mobile } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Name is required.' });
    }
    if (!mobile || !mobile.trim()) {
      return res.status(400).json({ success: false, message: 'Mobile number is required.' });
    }

    const user = await User.create({
      name: name.trim(),
      mobile: mobile.trim(),
      role: 'user',
      createdBy: req.user._id,
    });

    res.status(201).json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        mobile: user.mobile,
        role: user.role,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('createUser error:', error);
    res.status(500).json({ success: false, message: 'Failed to create user.' });
  }
};

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Admin, Super Admin
const updateUser = async (req, res) => {
  try {
    const { name, mobile } = req.body;
    const user = await User.findOne({ _id: req.params.id, role: 'user' });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    if (name) user.name = name.trim();
    if (mobile) user.mobile = mobile.trim();

    await user.save();

    res.json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        mobile: user.mobile,
        role: user.role,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    console.error('updateUser error:', error);
    res.status(500).json({ success: false, message: 'Failed to update user.' });
  }
};

// @desc    Delete user (also deletes their donations)
// @route   DELETE /api/users/:id
// @access  Admin, Super Admin
const deleteUser = async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.params.id, role: 'user' });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    await Promise.all([Donation.deleteMany({ userId: user._id }), user.deleteOne()]);

    res.json({ success: true, message: 'User and all associated donations deleted successfully.' });
  } catch (error) {
    console.error('deleteUser error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete user.' });
  }
};

module.exports = { getUsers, getUserCount, getUser, createUser, updateUser, deleteUser };
