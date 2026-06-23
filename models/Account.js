const mongoose = require('mongoose');

const AccountSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true // index for faster queries and isolation
  },
  description: {
    type: String,
    required: [true, '請輸入交易描述'],
    trim: true
  },
  amount: {
    type: Number,
    required: [true, '請輸入交易金額'],
    min: [0.01, '金額必須大於 0']
  },
  type: {
    type: String,
    enum: ['income', 'expense'],
    required: [true, '請選擇交易類型（收入或支出）']
  },
  category: {
    type: String,
    enum: ['餐飲', '交通', '娛樂', '購物', '醫療', '其他'],
    default: '其他'
  },
  date: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Account', AccountSchema);
