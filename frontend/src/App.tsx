import { useEffect, useState, useCallback } from 'react';
import './App.css';

declare global {
  interface Window {
    Telegram: any;
  }
}

interface UserProfile {
  id: string;
  name: string;
  personalBalance: number;
}

interface Transaction {
  id: string;
  description: string;
  amount: number;
  payer_id: string;
  fund_source: string;
  timestamp: string;
}

const API_BASE_URL = "https://aungs-ledger.duckdns.org:8443/api";

function App() {
  const [activeUser, setActiveUser] = useState<UserProfile | null>(null);
  const [partner, setPartner] = useState<UserProfile | null>(null);
  const [familyFund, setFamilyFund] = useState<number>(0);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [isOptionalSplit, setIsOptionalSplit] = useState(false); 
  const [fundSource, setFundSource] = useState<'personal' | 'family'>('personal'); 
  
  const tg = window.Telegram.WebApp;

  const fetchDashboardData = async (currentUserId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/ledger/dashboard`);
      const data = await response.json();
      
      setFamilyFund(data.family_fund);

      const mySplitTotal = data.split_totals[currentUserId] || 0;
      const partnerId = Object.keys(data.split_totals).find(id => id !== currentUserId) || "Partner";
      const partnerSplitTotal = data.split_totals[partnerId] || 0;

      const netDifference = mySplitTotal - partnerSplitTotal;
      const myBalance = netDifference / 2;
      const partnerBalance = -myBalance;

      setActiveUser(prev => prev ? { ...prev, personalBalance: myBalance } : null);
      setPartner({ id: partnerId, name: partnerId === "Partner" ? "Partner" : "Aung Phyo Paing", personalBalance: partnerBalance });
    } catch (error) {
      console.error("Failed to fetch dashboard", error);
    }
  };

  const fetchRecentTransactions = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/expenses/recent`);
      const data = await response.json();
      setRecentTransactions(data);
    } catch (error) {
      console.error("Failed to fetch history", error);
    }
  };

  const loadAllData = (userId: string) => {
    fetchDashboardData(userId);
    fetchRecentTransactions();
  };

  useEffect(() => {
    tg.ready();
    tg.expand();
    tg.setHeaderColor('var(--tg-theme-bg-color)');

    const tgUser = tg.initDataUnsafe?.user;
    const userId = tgUser ? String(tgUser.id) : "111"; 
    const userName = tgUser ? tgUser.first_name : "Desktop User";

    setActiveUser({ id: userId, name: userName, personalBalance: 0 });
    setPartner({ id: "222", name: "Aung Phyo Paing", personalBalance: 0 });

    loadAllData(userId);
  }, []);

  const handleSave = useCallback(async () => {
    if (!amount || !description || !activeUser) return;

    try {
      tg.MainButton.showProgress();
      tg.HapticFeedback?.impactOccurred('medium');
      
      await fetch(`${API_BASE_URL}/expenses/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payer_id: activeUser.id,
          amount: parseFloat(amount),
          description: description,
          fund_source: fundSource,
          is_split: fundSource === 'personal' ? isOptionalSplit : false, 
          transaction_type: "expense"
        })
      });

      tg.HapticFeedback?.notificationOccurred('success');
      setAmount('');
      setDescription('');
      setIsOptionalSplit(false);
      loadAllData(activeUser.id); // Reload both the dashboard balances AND the history list
      
    } catch (error) {
      tg.HapticFeedback?.notificationOccurred('error');
      tg.showAlert("Network Error. Please try again.");
    } finally {
      tg.MainButton.hideProgress();
      tg.MainButton.hide();
    }
  }, [amount, description, activeUser, fundSource, isOptionalSplit]);

  useEffect(() => {
    if (amount && description) {
      tg.MainButton.setText(`ADD $${amount} TO LEDGER`);
      tg.MainButton.setParams({
        color: tg.themeParams.button_color || '#2481cc',
        text_color: tg.themeParams.button_text_color || '#ffffff'
      });
      tg.MainButton.show();
    } else {
      tg.MainButton.hide();
    }

    tg.onEvent('mainButtonClicked', handleSave);
    return () => {
      tg.offEvent('mainButtonClicked', handleSave);
    };
  }, [amount, description, handleSave]);

  return (
    <div style={{
      backgroundColor: 'var(--tg-theme-bg-color)', color: 'var(--tg-theme-text-color)',
      minHeight: '100vh', padding: '20px 16px 100px 16px', 
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
    }}>
      
      <div style={{
        background: 'linear-gradient(135deg, var(--tg-theme-button-color), #8A2BE2)',
        color: '#ffffff', padding: '24px', borderRadius: '20px', textAlign: 'center', marginBottom: '20px', boxShadow: '0 8px 20px rgba(0,0,0,0.15)'
      }}>
        <p style={{ margin: 0, opacity: 0.85, fontSize: '15px', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '1px' }}>Shared Family Fund</p>
        <h1 style={{ margin: '8px 0 0 0', fontSize: '42px', fontWeight: '800' }}>${familyFund.toFixed(2)}</h1>
      </div>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '30px' }}>
        {[activeUser, partner].map((user, idx) => (
          <div key={idx} style={{ flex: 1, backgroundColor: 'var(--tg-theme-secondary-bg-color)', padding: '16px', borderRadius: '16px', textAlign: 'center' }}>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--tg-theme-hint-color)', fontWeight: '500' }}>{user?.name}</p>
            <h3 style={{ margin: '6px 0 0 0', fontSize: '22px', fontWeight: '700', color: (user?.personalBalance ?? 0) >= 0 ? '#34C759' : '#FF3B30' }}>
              {(user?.personalBalance ?? 0) >= 0 ? '+' : '-'}${Math.abs(user?.personalBalance ?? 0).toFixed(2)}
            </h3>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', backgroundColor: 'var(--tg-theme-secondary-bg-color)', borderRadius: '12px', padding: '4px', marginBottom: '20px' }}>
        {['personal', 'family'].map((type) => (
          <div key={type} onClick={() => setFundSource(type as 'personal' | 'family')} style={{
              flex: 1, textAlign: 'center', padding: '10px 0', borderRadius: '10px', fontSize: '14px', fontWeight: '600',
              backgroundColor: fundSource === type ? 'var(--tg-theme-bg-color)' : 'transparent',
              color: fundSource === type ? 'var(--tg-theme-text-color)' : 'var(--tg-theme-hint-color)',
              boxShadow: fundSource === type ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
              transition: 'all 0.2s ease', textTransform: 'capitalize'
            }}>
            {type === 'personal' ? '👤 Personal Pocket' : '👨‍👩‍👧‍👦 Family Fund'}
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '30px' }}>
        <input type="number" placeholder="Amount ($)" value={amount} onChange={(e) => setAmount(e.target.value)} style={{ padding: '16px', borderRadius: '14px', border: 'none', backgroundColor: 'var(--tg-theme-secondary-bg-color)', color: 'var(--tg-theme-text-color)', fontSize: '18px', fontWeight: '500', outline: 'none' }} />
        <input type="text" placeholder="What was this for?" value={description} onChange={(e) => setDescription(e.target.value)} style={{ padding: '16px', borderRadius: '14px', border: 'none', backgroundColor: 'var(--tg-theme-secondary-bg-color)', color: 'var(--tg-theme-text-color)', fontSize: '16px', outline: 'none' }} />
        <div style={{ height: fundSource === 'personal' ? '50px' : '0px', overflow: 'hidden', transition: 'height 0.3s ease', display: 'flex', alignItems: 'center' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '15px', fontWeight: '500' }}>
            <input type="checkbox" checked={isOptionalSplit} onChange={(e) => setIsOptionalSplit(e.target.checked)} style={{ width: '22px', height: '22px', accentColor: 'var(--tg-theme-button-color)' }} />
            Split this 50/50 with partner
          </label>
        </div>
      </div>

        {/* --- NEW: Desktop Fallback Button --- */}
        {tg.platform !== 'ios' && tg.platform !== 'android' && (
          <button 
            onClick={handleSave}
            type="button"
            style={{ 
              backgroundColor: 'var(--tg-theme-button-color, #8A2BE2)', 
              color: '#ffffff', padding: '16px', border: 'none', 
              borderRadius: '14px', fontSize: '16px', fontWeight: 'bold', 
              marginTop: '10px', cursor: 'pointer'
            }}>
            Add to Ledger (Desktop)
          </button>
        )}

      {/* NEW: Recent Transactions History UI */}
      <div>
        <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '15px', color: 'var(--tg-theme-text-color)' }}>Recent Activity</h3>
        {recentTransactions.length === 0 ? (
          <p style={{ color: 'var(--tg-theme-hint-color)', textAlign: 'center', fontSize: '14px', marginTop: '20px' }}>No transactions yet.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {recentTransactions.map((tx) => (
              <div key={tx.id} style={{ 
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                backgroundColor: 'var(--tg-theme-secondary-bg-color)', padding: '16px', borderRadius: '12px' 
              }}>
                <div>
                  <p style={{ margin: 0, fontWeight: '600', fontSize: '16px' }}>{tx.description}</p>
                  <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--tg-theme-hint-color)', textTransform: 'capitalize' }}>
                    {tx.payer_id === activeUser?.id ? 'You' : 'Partner'} • {tx.fund_source}
                  </p>
                </div>
                <div style={{ fontWeight: '700', fontSize: '16px', color: tx.fund_source === 'family' ? '#8A2BE2' : 'var(--tg-theme-text-color)' }}>
                  ${tx.amount.toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}

export default App;
