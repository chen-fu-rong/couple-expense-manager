import { useEffect, useState } from 'react';
import './App.css';

declare global {
  interface Window {
    Telegram: any;
  }
}

interface UserProfile {
  id: string | number;
  name: string;
  personalBalance: number;
}

function App() {
  const [activeUser, setActiveUser] = useState<UserProfile | null>(null);
  const [partner, setPartner] = useState<UserProfile | null>(null);
  const [familyFund, setFamilyFund] = useState<number>(0);
  
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  // 50/50 ကို Optional အနေဖြင့်သာ ထားရှိရန် State
  const [isOptionalSplit, setIsOptionalSplit] = useState(false); 
  
  const tg = window.Telegram.WebApp;

  useEffect(() => {
    tg.ready();
    tg.expand();

    // Telegram မှ User Data ကို Dynamic ဆွဲယူခြင်း
    const tgUser = tg.initDataUnsafe?.user;
    
    if (tgUser) {
      setActiveUser({
        id: tgUser.id,
        name: tgUser.first_name, 
        personalBalance: 0 
      });
    } else {
      // Browser ဖြင့် ဖွင့်စမ်းပါက ပေါ်စေရန်
      setActiveUser({ id: "111", name: "Desktop User", personalBalance: 0 });
    }

    // လောလောဆယ် UI မြင်ရစေရန် Mock Data ထည့်ထားပါမည်
    // Backend API ရေးပြီးပါက Database မှ တိုက်ရိုက်ဆွဲယူပါမည်
    setPartner({
      id: "222",
      name: "Aung Phyo Paing", 
      personalBalance: 0
    });
    setFamilyFund(0);

  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const safeAlert = (msg: string) => {
      try { tg.showAlert(msg); } catch { window.alert(msg); }
    };

    if (!amount || !description) {
      safeAlert("Please enter an amount and description.");
      return;
    }

    // Haptic Feedback ဖြင့် User Experience ကို မြှင့်တင်ခြင်း
    try { tg.HapticFeedback.impactOccurred('light'); } catch {}
    
    const splitStatus = isOptionalSplit ? "(50/50 Split Applied)" : "(No Split)";
    safeAlert(`Expense Saved! ${splitStatus}\nBackend API နှင့် ဆက်လက်ချိတ်ဆက်ပါမည်။`);
    
    // Form ကို Reset ချခြင်း
    setAmount('');
    setDescription('');
    setIsOptionalSplit(false);
  };

  return (
    <div style={{
      backgroundColor: 'var(--tg-theme-bg-color)',
      color: 'var(--tg-theme-text-color)',
      minHeight: '100vh',
      padding: '20px',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <h2 style={{ textAlign: 'center', marginBottom: '20px', fontWeight: 'bold' }}>Family Ledger</h2>
      
      {/* 1. Shared Family Fund Card */}
      <div style={{
        backgroundColor: 'var(--tg-theme-button-color)',
        color: 'var(--tg-theme-button-text-color)',
        padding: '25px',
        borderRadius: '16px',
        textAlign: 'center',
        marginBottom: '20px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
      }}>
        <p style={{ margin: 0, opacity: 0.9, fontSize: '14px' }}>Family Fund</p>
        <h1 style={{ margin: '5px 0 0 0', fontSize: '36px' }}>${familyFund.toFixed(2)}</h1>
      </div>

      {/* 2. Side-by-Side Personal Cards */}
      <div style={{ display: 'flex', gap: '15px', marginBottom: '25px' }}>
        {/* Active User Card */}
        <div style={{
          flex: 1,
          backgroundColor: 'var(--tg-theme-secondary-bg-color)',
          padding: '15px',
          borderRadius: '12px',
          textAlign: 'center'
        }}>
          <p style={{ margin: 0, fontSize: '14px', opacity: 0.7 }}>{activeUser?.name || "Loading..."}</p>
          <h3 style={{ margin: '5px 0 0 0', fontSize: '20px' }}>${activeUser?.personalBalance.toFixed(2)}</h3>
        </div>

        {/* Partner Card */}
        <div style={{
          flex: 1,
          backgroundColor: 'var(--tg-theme-secondary-bg-color)',
          padding: '15px',
          borderRadius: '12px',
          textAlign: 'center'
        }}>
          <p style={{ margin: 0, fontSize: '14px', opacity: 0.7 }}>{partner?.name || "Loading..."}</p>
          <h3 style={{ margin: '5px 0 0 0', fontSize: '20px' }}>${partner?.personalBalance.toFixed(2)}</h3>
        </div>
      </div>

      {/* 3. Expense Input Form */}
      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <input 
          type="number" 
          placeholder="Amount ($)" 
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          style={{
            padding: '14px', borderRadius: '12px',
            border: '1px solid var(--tg-theme-hint-color)',
            backgroundColor: 'var(--tg-theme-bg-color)',
            color: 'var(--tg-theme-text-color)', fontSize: '16px'
          }}
        />
        <input 
          type="text" 
          placeholder="What was it for?" 
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          style={{
            padding: '14px', borderRadius: '12px',
            border: '1px solid var(--tg-theme-hint-color)',
            backgroundColor: 'var(--tg-theme-bg-color)',
            color: 'var(--tg-theme-text-color)', fontSize: '16px'
          }}
        />

        {/* Optional 50/50 Split Toggle */}
        <label style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          fontSize: '15px', padding: '5px 0', color: 'var(--tg-theme-text-color)'
        }}>
          <input 
            type="checkbox" 
            checked={isOptionalSplit}
            onChange={(e) => setIsOptionalSplit(e.target.checked)}
            style={{ 
              width: '20px', height: '20px', 
              accentColor: 'var(--tg-theme-button-color)' 
            }}
          />
          Split this expense 50/50
        </label>

        <button 
          type="submit"
          style={{
            backgroundColor: 'var(--tg-theme-button-color)', 
            color: 'var(--tg-theme-button-text-color)',
            padding: '16px', border: 'none', borderRadius: '12px',
            fontSize: '16px', fontWeight: 'bold', cursor: 'pointer',
            marginTop: '5px'
          }}
        >
          Add to Ledger
        </button>
      </form>
    </div>
  );
}

export default App;