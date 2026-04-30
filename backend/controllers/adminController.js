const User = require('../models/User');

// @desc    Get all admins (paginated)
// @route   GET /api/admins
// @access  Super Admin
const getAdmins = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));
    const skip = (page - 1) * limit;
    const search = req.query.search || '';

    const query = { role: 'admin' };
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { mobile: { $regex: search, $options: 'i' } },
      ];
    }

    const [admins, total] = await Promise.all([
      User.find(query).select('-password').skip(skip).limit(limit).sort({ createdAt: -1 }),
      User.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: admins,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('getAdmins error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch admins.' });
  }
};

// @desc    Create a new admin
// @route   POST /api/admins
// @access  Super Admin
const createAdmin = async (req, res) => {
  try {
    const { name, email, password, mobile } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists.' });
    }

    const admin = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      mobile: mobile?.trim(),
      role: 'admin',
      createdBy: req.user._id,
    });

    res.status(201).json({
      success: true,
      data: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        mobile: admin.mobile,
        role: admin.role,
        createdAt: admin.createdAt,
      },
    });
  } catch (error) {
    console.error('createAdmin error:', error);
    res.status(500).json({ success: false, message: 'Failed to create admin.' });
  }
};

// @desc    Update admin
// @route   PUT /api/admins/:id
// @access  Super Admin
const updateAdmin = async (req, res) => {
  try {
    const { name, email, mobile, password } = req.body;
    const admin = await User.findOne({ _id: req.params.id, role: 'admin' }).select('+password');

    if (!admin) {
      return res.status(404).json({ success: false, message: 'Admin not found.' });
    }

    if (email && email !== admin.email) {
      const emailExists = await User.findOne({ email: email.toLowerCase().trim(), _id: { $ne: admin._id } });
      if (emailExists) {
        return res.status(400).json({ success: false, message: 'This email is already in use.' });
      }
      admin.email = email.toLowerCase().trim();
    }

    if (name) admin.name = name.trim();
    if (mobile !== undefined) admin.mobile = mobile?.trim();
    if (password) {
      if (password.length < 6) {
        return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
      }
      admin.password = password;
    }

    await admin.save();

    res.json({
      success: true,
      data: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        mobile: admin.mobile,
        role: admin.role,
        updatedAt: admin.updatedAt,
      },
    });
  } catch (error) {
    console.error('updateAdmin error:', error);
    res.status(500).json({ success: false, message: 'Failed to update admin.' });
  }
};

// @desc    Delete admin
// @route   DELETE /api/admins/:id
// @access  Super Admin
const deleteAdmin = async (req, res) => {
  try {
    const admin = await User.findOne({ _id: req.params.id, role: 'admin' });
    if (!admin) {
      return res.status(404).json({ success: false, message: 'Admin not found.' });
    }

    await admin.deleteOne();
    res.json({ success: true, message: 'Admin deleted successfully.' });
  } catch (error) {
    console.error('deleteAdmin error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete admin.' });
  }
};

module.exports = { getAdmins, createAdmin, updateAdmin, deleteAdmin };
