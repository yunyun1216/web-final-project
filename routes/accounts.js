const express = require('express');
const router = express.Router();
const Account = require('../models/Account');
const auth = require('../middleware/auth');

// Protect all routes under accounts
router.use(auth);

// @route   GET /api/accounts
// @desc    Get all accounts/transactions for the logged-in user (isolation)
router.get('/', async (req, res) => {
  try {
    const accounts = await Account.find({ userId: req.user.id }).sort({ date: -1 });
    res.json(accounts);
  } catch (err) {
    console.error('Fetch accounts error:', err);
    res.status(500).json({ error: '無法讀取記帳資料，請稍後再試！' });
  }
});

// @route   POST /api/accounts
// @desc    Create a new transaction
router.post('/', async (req, res) => {
  const { description, amount, type, category } = req.body;

  if (!description || !amount || !type) {
    return res.status(400).json({ error: '描述、金額及類型為必填欄位！' });
  }

  const parsedAmount = parseFloat(amount);
  if (isNaN(parsedAmount) || parsedAmount <= 0) {
    return res.status(400).json({ error: '金額必須是正數！' });
  }

  try {
    const newAccount = new Account({
      userId: req.user.id,
      description,
      amount: parsedAmount,
      type,
      category: category || '其他'
    });

    const account = await newAccount.save();
    res.status(201).json(account);
  } catch (err) {
    console.error('Create account error:', err);
    res.status(500).json({ error: '無法建立記帳資料，請稍後再試！' });
  }
});

// @route   DELETE /api/accounts/:id
// @desc    Delete a transaction (verifying owner for isolation)
router.delete('/:id', async (req, res) => {
  try {
    const account = await Account.findById(req.id || req.params.id);

    if (!account) {
      return res.status(404).json({ error: '找不到該筆記帳資料！' });
    }

    // Verify owner to ensure account data isolation
    if (account.userId.toString() !== req.user.id) {
      return res.status(403).json({ error: '未授權，您無法刪除他人的資料！' });
    }

    await Account.deleteOne({ _id: account._id });
    res.json({ message: '記帳資料已成功刪除！' });
  } catch (err) {
    console.error('Delete account error:', err);
    res.status(500).json({ error: '無法刪除記帳資料，請稍後再試！' });
  }
});

module.exports = router;
