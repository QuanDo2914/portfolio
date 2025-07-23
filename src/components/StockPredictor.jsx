import { useState } from 'react';

export default function StockPredictor() {
  const [ticker, setTicker] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const supportedTickers = [
    "AAPL","MSFT","GOOGL","AMZN","NVDA","TSLA","META","BRK-B","UNH","V",
    "JPM","JNJ","WMT","PG","MA","HD","XOM","BAC","PFE","COST","DIS","CSCO",
    "ADP","NFLX","ABT","CRM","ORCL","INTC","TSM","CVX","NKE","AVGO","T","MRK",
    "MCD","DHR","AMGN","PEP","LLY","MDLZ","WFC","C","TXN","ADBE","UPS","IBM","ACN",
    "^GSPC","^IXIC","SPY","QQQ","DIA","VOOG"
  ];

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
    <section className="py-12 bg-gradient-to-b from-white to-blue-50" id="stock">
      <div className="max-w-xl mx-auto px-6">
        <h2 className="text-4xl font-extrabold text-center mb-4">📈 Stock Predictor</h2>
        <p className="text-center text-gray-600 mb-8">
          A logistic regression model trained on the past 5 days’ returns to predict 
          if a stock will go up (“BUY”) or down (“SELL”) tomorrow.
        </p>

        <div className="bg-white shadow-lg rounded-2xl p-6 mb-8">
          <form onSubmit={handleSubmit} className="flex space-x-2 mb-4">
            <input
              type="text"
              value={ticker}
              onChange={e => setTicker(e.target.value.toUpperCase())}
              placeholder="Enter ticker (e.g. AAPL)"
              className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {loading ? '…' : 'Predict'}
            </button>
          </form>
          {error && <div className="text-red-600 font-medium mb-4">{error}</div>}
          {result && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg text-center">
              <span className="text-gray-700 mr-2">Action:</span>
              <span className={result === 'BUY' ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>
                {result}
              </span>
            </div>
          )}
        </div>

        <div className="mb-4">
          <h3 className="text-xl font-semibold mb-2">Supported Tickers</h3>
          <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-2 bg-white rounded-lg shadow-inner">
            {supportedTickers.map(sym => (
              <span
                key={sym}
                className="text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded-full hover:bg-blue-200 transition"
              >
                {sym}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
