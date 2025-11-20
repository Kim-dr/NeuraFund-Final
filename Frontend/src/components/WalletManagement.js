import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { showToast } from '../utils/toast';

const WalletManagement = () => {
  const { user, updateUserBalance, refreshUser } = useAuth(); 
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  
  // 🛠️ Shared state for phone number (used by both Deposit and Withdraw)
  const [phoneNumber, setPhoneNumber] = useState('');
  
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    refreshUser();
    fetchWalletData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 

  const fetchWalletData = async () => {
    setLoading(true);
    try {
      const [balanceRes, transactionsRes] = await Promise.all([
        api.get('/wallet/balance'),
        api.get('/wallet/transactions'),
      ]);
      setBalance(balanceRes.data.data.balance);
      setTransactions(transactionsRes.data.data.transactions);
    } catch (error) {
      showToast('Failed to load wallet data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeposit = async (e) => {
    e.preventDefault();
    if (!depositAmount || parseFloat(depositAmount) <= 0) {
      showToast('Please enter a valid amount', 'error');
      return;
    }
    // 🛠️ Validate Phone for Deposit too
    if (!phoneNumber || !/^254\d{9}$/.test(phoneNumber)) {
        showToast('Please enter a valid M-Pesa number (254XXXXXXXXX)', 'error');
        return;
    }

    setProcessing(true);
    try {
      const response = await api.post('/wallet/deposit', {
        amount: parseFloat(depositAmount),
        phoneNumber: phoneNumber, // 🛠️ Send Phone Number
        paymentMethod: 'M-Pesa',
      });
      
      const newBalance = response.data.data.transaction.newBalance; 
      updateUserBalance(newBalance); 
      
      showToast('STK Push Sent! Check your phone.', 'success');
      setDepositAmount('');
      setPhoneNumber(''); // Clear phone after success
      
      fetchWalletData();
    } catch (error) {
      showToast(error.response?.data?.message || 'Deposit failed', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const handleWithdraw = async (e) => {
    e.preventDefault();
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      showToast('Please enter a valid amount', 'error');
      return;
    }
    if (!phoneNumber || !/^254\d{9}$/.test(phoneNumber)) {
      showToast('Please enter a valid M-Pesa number (254XXXXXXXXX)', 'error');
      return;
    }

    setProcessing(true);
    try {
      const response = await api.post('/wallet/withdraw', {
        amount: parseFloat(withdrawAmount),
        phoneNumber,
      });
      
      // Update balance immediately for Withdraw too
      const newBalance = response.data.data.transaction.newBalance;
      updateUserBalance(newBalance);

      showToast('Withdrawal successful! Check your M-Pesa.', 'success');
      setWithdrawAmount('');
      setPhoneNumber('');
      fetchWalletData();
    } catch (error) {
      showToast(error.response?.data?.message || 'Withdrawal failed', 'error');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading wallet...</div>;
  }

  return (
    <div className="wallet-management">
      <div className="wallet-header">
        <h2>Wallet Management</h2>
        <div className="balance-display">
          <span className="balance-label">Current Balance:</span>
          <span className="balance-amount">KSh {balance.toFixed(2)}</span>
        </div>
      </div>

      <div className="wallet-actions">
        {/* --- VENDOR DEPOSIT FORM --- */}
        {user.role === 'vendor' && (
          <div className="wallet-card">
            <h3>Deposit Funds (M-Pesa)</h3>
            <form onSubmit={handleDeposit}>
              <div className="form-group">
                <label>Amount (KSh)</label>
                <input
                  type="number"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  placeholder="Enter amount"
                  min="1"
                  step="0.01"
                  required
                />
              </div>
              {/* 🛠️ ADDED PHONE INPUT FOR VENDOR */}
              <div className="form-group">
                <label>M-Pesa Number</label>
                <input
                  type="text"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="2547XXXXXXXX"
                  pattern="254\d{9}"
                  required
                />
                <small>Format: 254712345678</small>
              </div>
              <button type="submit" className="btn btn-primary" disabled={processing}>
                {processing ? 'Sending Request...' : 'Deposit'}
              </button>
            </form>
          </div>
        )}

        {/* --- STUDENT WITHDRAW FORM --- */}
        {user.role === 'student' && (
          <div className="wallet-card">
            <h3>Withdraw to M-Pesa</h3>
            <form onSubmit={handleWithdraw}>
              <div className="form-group">
                <label>Amount (KSh)</label>
                <input
                  type="number"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder="Enter amount"
                  min="1"
                  step="0.01"
                  required
                />
              </div>
              <div className="form-group">
                <label>M-Pesa Number</label>
                <input
                  type="text"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="2547XXXXXXXX"
                  pattern="254\d{9}"
                  required
                />
                <small>Format: 254712345678</small>
              </div>
              <button type="submit" className="btn btn-success" disabled={processing}>
                {processing ? 'Processing...' : 'Withdraw'}
              </button>
            </form>
          </div>
        )}
      </div>

      <div className="transaction-history">
        <h3>Transaction History</h3>
        {transactions.length === 0 ? (
          <div className="no-transactions">No transactions yet</div>
        ) : (
          <div className="transactions-list">
            {transactions.map((transaction) => (
              <div key={transaction._id} className="transaction-item">
                <div className="transaction-info">
                  <span className={`transaction-type ${transaction.type}`}>
                    {transaction.type.replace('-', ' ').toUpperCase()}
                  </span>
                  <span className="transaction-description">{transaction.description}</span>
                </div>
                <div className="transaction-details">
                  <span className={`transaction-amount ${transaction.type === 'withdrawal' || transaction.type === 'task-payment' ? 'negative' : 'positive'}`}>
                    {transaction.type === 'withdrawal' || transaction.type === 'task-payment' ? '-' : '+'}
                    KSh {transaction.amount.toFixed(2)}
                  </span>
                  <span className="transaction-date">
                    {new Date(transaction.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default WalletManagement;