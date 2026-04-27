import { useEffect, useState } from 'react';
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

const API_BASE_URL = "https://aungs-ledger.duckdns.org:8443/api";

function App() {
  const [activeUser, setActiveUser] = useState<UserProfile | null>(null);
  const [partner, setPartner] = useState<UserProfile | null>(null);
  const [familyFund, setFamilyFund] = useState<number>(0);
  
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [isOptionalSplit, setIsOptionalSplit] = useState(false); 
  const [fundSource, setFundSource] = useState('personal'); // 'personal' or 'family'
  
  const tg = window.Telegram.WebApp;

  // 1. Fetch Data from FastAPI
  const fetchDashboardData = async (currentUserId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/ledger/dashboard`);
      const data = await response.json();
      
      setFamilyFund(data.family_fund);

      // Determine who owes who based on the split_totals from backend
      // split_totals looks like: { "UserA_ID": 150, "UserB_ID": 50 }
      const mySplitTotal = data.split_totals[currentUserId] || 0;
      
      // We assume if it's not you, it's the partner
      const partnerId = Object.keys(data.split_totals).find(id => id !== currentUserId) || "Partner";
      const partnerSplitTotal = data.split_totals[partnerId] || 0;

      // If I paid $150 in splits, and partner paid $50 in splits.
      // Net difference is $100. Partner owes me 50% of that ($50).
      const netDifference = mySplitTotal - partnerSplitTotal;
      const myBalance = netDifference / 2;
      const partnerBalance = -myBalance;

      setActiveUser(prev => prev ? { ...prev, personalBalance: myBalance } : null);
      setPartner({ id: partnerId, name: "Partner", personalBalance: partnerBalance });

    } catch (error) {
      console.error("Failed to fetch dashboard", error);
    }
  };

  useEffect(() => {
    tg.ready();
    tg.expand();

    const tgUser = tg.initDataUnsafe?.user;
    const userId = tgUser ? String(tgUser.id) : "111"; // Fallback for browser testing
    const userName = tgUser ? tgUser.first_name : "Desktop User";

    setActiveUser({ id: userId, name: userName, personalBalance: 0 });
    setPartner({ id: "222", name: "Partner", personalBalance: 0 });

    // Load real data!
    fetchDashboardData(userId);
  }, []);

  // 2. Send Data to FastAPI
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const safeAlert = (msg: string) => {
      try { tg.showAlert(msg); } catch { window.alert(msg); }
    };

    if (!amount || !description || !activeUser) {
      safeAlert("Please enter an amount and description.");
      return;
    }

    try {
      tg.HapticFeedback?.impactOccurred('light');
      
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

      safeAlert("Expense saved successfully!");
      
      // Reset form and reload numbers
      setAmount('');
      setDescription('');
      setIsOptionalSplit(false);
      fetchDashboardData(activeUser.id);

    } catch (error) {
      safeAlert("Error saving expense. Check connection.");
    }
  };

  return (
    <div style={{
      backgroundColor: 'var(--tg-theme-bg-color)',
      color: 'var(--tg-theme-text-color)',
      minHeight: '100vh', padding: '20px', fontFamily: 'system-ui, sans-serif'
    }}>
      <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Family Ledger</h2>
      
      <div style={{
        backgroundColor: 'var(--tg-theme-button-color)', color: 'var(--tg-theme-button-text-color)',
        padding: '25px', borderRadius: '16px', textAlign: 'center', marginBottom: '20px'
      }}>
        <p style={{ margin: 0, opacity: 0.9, fontSize: '14px' }}>Family Fund</p>
        <h1 style={{ margin: '5px 0 0 0', fontSize: '36px' }}>${familyFund.toFixed(2)}</h1>
      </div>

      <div style={{ display: 'flex', gap: '15px', marginBottom: '25px' }}>
        <div style={{ flex: 1, backgroundColor: 'var(--tg-theme-secondary-bg-color)', padding: '15px', borderRadius: '12px', textAlign: 'center' }}>
          <p style={{ margin: 0, fontSize: '14px', opacity: 0.7 }}>{activeUser?.name}</p>
          <h3 style={{ margin: '5px 0 0 0', color: (activeUser?.personalBalance ?? 0) >= 0 ? '#4CAF50' : '#F44336' }}>
            ${activeUser?.personalBalance.toFixed(2)}
          </h3>
        </div>
        <div style={{ flex: 1, backgroundColor: 'var(--tg-theme-secondary-bg-color)', padding: '15px', borderRadius: '12px', textAlign: 'center' }}>
          <p style={{ margin: 0, fontSize: '14px', opacity: 0.7 }}>{partner?.name}</p>
          <h3 style={{ margin: '5px 0 0 0', color: (partner?.personalBalance ?? 0) >= 0 ? '#4CAF50' : '#F44336' }}>
            ${partner?.personalBalance.toFixed(2)}
          </h3>
        </div>
      </div>

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button type="button" onClick={() => setFundSource('personal')} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: fundSource === 'personal' ? '2px solid var(--tg-theme-button-color)' : '1px solid gray', background: 'transparent', color: 'var(--tg-theme-text-color)' }}>Personal Pocket</button>
          <button type="button" onClick={() => setFundSource('family')} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: fundSource === 'family' ? '2px solid var(--tg-theme-button-color)' : '1px solid gray', background: 'transparent', color: 'var(--tg-theme-text-color)' }}>Family Fund</button>
        </div>

        <input type="number" placeholder="Amount ($)" value={amount} onChange={(e) => setAmount(e.target.value)} style={{ padding: '14px', borderRadius: '12px', border: '1px solid var(--tg-theme-hint-color)', background: 'var(--tg-theme-bg-color)', color: 'var(--tg-theme-text-color)', fontSize: '16px' }} />
        <input type="text" placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} style={{ padding: '14px', borderRadius: '12px', border: '1px solid var(--tg-theme-hint-color)', background: 'var(--tg-theme-bg-color)', color: 'var(--tg-theme-text-color)', fontSize: '16px' }} />

        {fundSource === 'personal' && (
          <label style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <input type="checkbox" checked={isOptionalSplit} onChange={(e) => setIsOptionalSplit(e.target.checked)} style={{ width: '20px', height: '20px' }} />
            Split this 50/50 with partner
          </label>
        )}

        <button type="submit" style={{ backgroundColor: 'var(--tg-theme-button-color)', color: 'var(--tg-theme-button-text-color)', padding: '16px', border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: 'bold' }}>Add to Ledger</button>
      </form>
    </div>
  );
}

export default App;