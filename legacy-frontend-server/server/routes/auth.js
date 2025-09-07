const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();
const User = require('../models/User');

const MASTER_KEY_FOR_PASSKEY_RESET = '8341339097';

// Seed default user if none exists
router.post('/seed-default', async (req, res) => {
  try {
    const { name = 'Vamshi', password = 'Vamshi.c2002', passkey = '2002' } = req.body || {};
    let user = await User.findOne({ name });
    if (user) {
      return res.json({ success: true, message: 'User already exists' });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    user = await User.create({ name, passwordHash, passkey });
    res.json({ success: true, data: { id: user._id, name: user.name } });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to seed user', error: e.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { name, password } = req.body;
    const user = await User.findOne({ name });
    if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials' });
    const ok = await user.comparePassword(password);
    if (!ok) return res.status(401).json({ success: false, message: 'Invalid credentials' });
    res.json({ success: true, data: { name: user.name } });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Login error', error: e.message });
  }
});

// Verify passkey (for password reset)
router.post('/verify-passkey', async (req, res) => {
  try {
    const { name, passkey } = req.body;
    const user = await User.findOne({ name });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (passkey === user.passkey) return res.json({ success: true });
    return res.status(401).json({ success: false, message: 'Invalid passkey' });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Verification error', error: e.message });
  }
});

// Reset password (requires passkey verification client-side first)
router.post('/reset-password', async (req, res) => {
  try {
    const { name, newPassword, passkey } = req.body;
    const user = await User.findOne({ name });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (passkey !== user.passkey) return res.status(401).json({ success: false, message: 'Invalid passkey' });
    user.passwordHash = await bcrypt.hash(newPassword, 10);
    await user.save();
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Reset error', error: e.message });
  }
});

// Verify master key to allow passkey reset
router.post('/verify-master', async (req, res) => {
  try {
    const { masterKey } = req.body;
    if (masterKey === MASTER_KEY_FOR_PASSKEY_RESET) return res.json({ success: true });
    return res.status(401).json({ success: false, message: 'Invalid master key' });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Verification error', error: e.message });
  }
});

// Reset passkey (requires master key verification client-side first)
router.post('/reset-passkey', async (req, res) => {
  try {
    const { name, newPasskey, masterKey } = req.body;
    if (masterKey !== MASTER_KEY_FOR_PASSKEY_RESET) return res.status(401).json({ success: false, message: 'Invalid master key' });
    const user = await User.findOne({ name });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    user.passkey = newPasskey;
    await user.save();
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Passkey reset error', error: e.message });
  }
});

module.exports = router;


