import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { showToast } from '../utils/toast';

const WalletManagement = () => {
  const { user, updateUserBalance, refreshUser } = useAuth(); 
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Separate states for Deposit and Withdraw to avoid confusion
  const [depositAmount, setDepositAmount] = useState('');
  const [depositPhoneNumber, setDepositPhoneNumber] = useState(''); 
  
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawPhoneNumber, setWithdrawPhoneNumber] = useState('');
  
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    // Force refresh global user data on load to fix Navbar sync
    if (refreshUser) refreshUser();
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
      // Safely access the nested data
      setBalance(balanceRes.data?.data?.balance || 0);
      setTransactions(transactionsRes.data?.data?.transactions || []);
    } catch (error) {
      console.error("Wallet Load Error:", error);
      showToast('Failed to load wallet data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeposit = async (e) => {
    e.preventDefault();
    
    // 1. Validation: Ensure we check 'depositPhoneNumber', NOT 'phoneNumber'
    if (!depositAmount || parseFloat(depositAmount) <= 0) {
      showToast('Please enter a valid amount', 'error');
      return;
    }
    if (!depositPhoneNumber || !/^254\d{9}$/.test(depositPhoneNumber)) {
        showToast('Please enter a valid M-Pesa number (254XXXXXXXXX)', 'error');
        return;
    }

    setProcessing(true);
    try {
      console.log("Sending Deposit Request...");
      const response = await api.post('/wallet/deposit', {
        amount: parseFloat(depositAmount),
        phoneNumber: depositPhoneNumber, 
        paymentMethod: 'mock-mpesa',
      });
      
      console.log("Deposit Response:", response.data);

      // 2. Success Handling
      if (response.data.success) {
          // Safely update balance if provided
          const newBalance = response.data.data?.transaction?.newBalance;
          if (newBalance !== undefined && updateUserBalance) {
              updateUserBalance(newBalance); 
          }
          
          showToast('STK Push Sent! Check your phone.', 'success');
          setDepositAmount('');
          setDepositPhoneNumber('');
          
          // Refresh list
          fetchWalletData();
      } else {
          throw new Error(response.data.error?.message || "Unknown error");
      }

    } catch (error) {
      console.error("Deposit Failed:", error);
      const msg = error.response?.data?.error?.message || error.message || 'Deposit failed';
      showToast(msg, 'error');
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
    if (!withdrawPhoneNumber || !/^254\d{9}$/.test(withdrawPhoneNumber)) {
      showToast('Please enter a valid M-Pesa number (254XXXXXXXXX)', 'error');
      return;
    }

    setProcessing(true);
    try {
      const response = await api.post('/wallet/withdraw', {
        amount: parseFloat(withdrawAmount),
        phoneNumber: withdrawPhoneNumber,
      });
      
      if (response.data.success) {
          const newBalance = response.data.data?.transaction?.newBalance;
          if (newBalance !== undefined && updateUserBalance) {
              updateUserBalance(newBalance);
          }

          showToast('Withdrawal successful! Check your M-Pesa.', 'success');
          setWithdrawAmount('');
          setWithdrawPhoneNumber('');
          fetchWalletData();
      }

    } catch (error) {
      console.error("Withdrawal Failed:", error);
      const msg = error.response?.data?.error?.message || 'Withdrawal failed';
      showToast(msg, 'error');
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
              <div className="form-group">
                <label>M-Pesa Phone Number (254...)</label>
                <input
                  type="text"
                  value={depositPhoneNumber}
                  onChange={(e) => setDepositPhoneNumber(e.target.value)}
                  placeholder="2547XXXXXXXX"
                  pattern="254\d{9}"
                  required
                />
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
                  value={withdrawPhoneNumber}
                  onChange={(e) => setWithdrawPhoneNumber(e.target.value)}
                  placeholder="2547XXXXXXXX"
                  pattern="254\d{9}"
                  required
                />
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