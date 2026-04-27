// Point directly to your secure Nginx port on the VPS
const API_URL = "https://aungs-ledger.duckdns.org:8443/api";

export const fetchBalance = async () => {
    const response = await fetch(`${API_URL}/expenses/balance`);
    if (!response.ok) throw new Error("Failed to fetch balance");
    return response.json();
};

export const createExpense = async (expenseData: any) => {
    const response = await fetch(`${API_URL}/expenses/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(expenseData),
    });
    if (!response.ok) throw new Error("Failed to create expense");
    return response.json();
};