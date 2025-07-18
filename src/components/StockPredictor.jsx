import { useState } from 'react';

export default function StockPredictor() {
  // 1) State
  const [ticker, setTicker] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // 2) List of supported tickers
  const supportedTickers = [
    "AAPL","MSFT","GOOGL","AMZN","NVDA",
    "TSLA","META","BRK-B","UNH","V","JPM","JNJ","WMT","PG","MA",
    "HD","XOM","BAC","PFE","COST","DIS","CSCO","ADP","NFLX","ABT",
    "CRM","ORCL","INTC","TSM","CVX","NKE","AVGO","T","MRK","MCD",
    "DHR","AMGN","PEP","LLY","MDLZ","WFC","C","TXN","ADBE","UPS",
    "IBM","ACN","^GSPC","^IXIC","SPY","QQQ","DIA","VOOG"
  ];

  // 3) Submit handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!ticker) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch(`http://127.0.0.1:5000/predict?ticker=${ticker}`);
      const data = await res.json();
      if (data.error) setError(data.error);
      else setResult(data.predicted_action);
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="py-10 bg-gray-50" id="stock">
      <div className="max-w-lg mx-auto px-4">
        <h2 className="text-3xl font-bold mb-4">📈 Stock Predictor</h2>

        {/* Brief description */}
        <p className="mb-6 text-gray-700">
          This tool uses a simple logistic regression model trained on the last 5 days’ daily returns 
          to predict whether a stock will go up (“BUY”) or down (“SELL”) the next trading day. 
          Enter any supported ticker below to get your signal!
        </p>

        {/* Prediction form */}
        <form onSubmit={handleSubmit} className="flex mb-4">
          <input
            type="text"
            value={ticker}
            onChange={e => setTicker(e.target.value.toUpperCase())}
            placeholder="Ticker (e.g. AAPL)"
            className="flex-1 p-2 border rounded-l"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-4 bg-blue-600 text-white rounded-r hover:bg-blue-700"
          >
            {loading ? '…' : 'Predict'}
          </button>
        </form>
        {error && <p className="text-red-600 mb-4">Error: {error}</p>}
        {result && (
          <div className="p-4 mb-6 border rounded bg-white">
            <p>
              Action:{' '}
              <strong className={result === 'BUY' ? 'text-green-600' : 'text-red-600'}>
                {result}
              </strong>
            </p>
          </div>
        )}

        {/* Supported tickers table */}
        <div className="mb-6">
          <h3 className="text-xl font-semibold mb-2">Supported Tickers</h3>
          <div className="overflow-x-auto border rounded bg-white">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 text-left">Ticker</th>
                </tr>
              </thead>
              <tbody>
                {supportedTickers.map((sym) => (
                  <tr key={sym} className="border-t">
                    <td className="px-4 py-2">{sym}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}
