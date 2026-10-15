import { useEffect, useMemo, useState } from 'react';
import {
  ShieldCheck, LayoutDashboard, CreditCard, SlidersHorizontal, ChartNoAxesCombined,
  Info, Search, RefreshCw, ChevronRight, ChevronDown, Bell, UserRound, Database,
  AlertTriangle, CheckCircle2, Clock3, CircleDollarSign, Menu, X, ArrowUpRight,
  Activity, FileSearch, LoaderCircle
} from 'lucide-react';
import './index.css';

const API = (import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000').replace(/\/+$/, '');
const FEATURES = ['Time', ...Array.from({ length: 28 }, (_, i) => `V${i + 1}`), 'Amount'];
const money = (value) => Number(value ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const number = (value) => Number(value ?? 0).toLocaleString('en-IN');

function IconTile({ children, tone = 'orange' }) { return <div className={`icon-tile ${tone}`}>{children}</div>; }
function MetricCard({ icon: Icon, title, value, note, tone }) {
  return <article className="metric-card"><IconTile tone={tone}><Icon size={20} /></IconTile><div className="metric-copy"><span>{title}</span><strong>{value}</strong><small>{note}</small></div></article>;
}

export default function App() {
  const [health, setHealth] = useState(null);
  const [samples, setSamples] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [result, setResult] = useState(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState('Overview');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mobileNav, setMobileNav] = useState(false);
  const [manual, setManual] = useState(() => Object.fromEntries(FEATURES.map((feature) => [feature, '0'])));

  async function request(url, options = {}) {
    const response = await fetch(url, options);
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(body.detail || `Request failed (${response.status})`);
    return body;
  }

  async function refresh() {
    setError('');
    try {
      const [healthData, sampleData] = await Promise.all([request(`${API}/health`), request(`${API}/api/samples`)]);
      setHealth(healthData);
      const list = Array.isArray(sampleData) ? sampleData : (sampleData.samples || []);
      setSamples(list);
      if (list.length && !list.some((item) => item.sample_id === selectedId)) setSelectedId(list[0].sample_id);
    } catch (err) {
      setHealth({ status: 'offline' });
      setError(`${err.message}. Make sure the FastAPI backend is running.`);
    }
  }

  useEffect(() => { refresh(); }, []);

  const filtered = useMemo(() => samples.filter((sample) =>
    String(sample.sample_id ?? '').toLowerCase().includes(search.toLowerCase()) ||
    String(sample.amount ?? '').includes(search)
  ), [samples, search]);
  const selected = samples.find((sample) => sample.sample_id === selectedId);
  const ready = health?.status === 'ready';
  const predictedFraud = Number(result?.predicted_class) === 1;
  const score = Number(result?.fraud_score ?? result?.score ?? 0);
  const threshold = Number(result?.threshold ?? 0.4);
  const actual = result?.actual_label;
  const hasActual = actual !== undefined && actual !== null;
  const actualFraud = actual === true || Number(actual) === 1 || String(actual).toLowerCase() === 'fraud';
  const mismatch = hasActual && actualFraud !== predictedFraud;

  async function predictSample(id = selectedId) {
    if (!id) return;
    setLoading(true); setError('');
    try { setResult(await request(`${API}/api/predict/sample/${encodeURIComponent(id)}`, { method: 'POST' })); }
    catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }

  async function predictManual(event) {
    event.preventDefault(); setLoading(true); setError(''); setResult(null);
    try {
      const payload = Object.fromEntries(FEATURES.map((feature) => [feature, Number(manual[feature])]));
      if (FEATURES.some((feature) => !Number.isFinite(payload[feature]))) throw new Error('Enter a valid number for every feature.');
      setResult(await request(`${API}/api/predict/manual`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }));
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }

  const navItems = [
    { label: 'Overview', icon: LayoutDashboard },
    { label: 'Transactions', icon: CreditCard },
    { label: 'Manual Assessment', icon: SlidersHorizontal },
    { label: 'Model Performance', icon: ChartNoAxesCombined },
    { label: 'About Project', icon: Info },
  ];

  return <div className="sentinel-app">
    <header className="topbar">
      <button className="mobile-menu icon-button" aria-label="Open navigation" onClick={() => setMobileNav(!mobileNav)}>{mobileNav ? <X size={20}/> : <Menu size={20}/>}</button>
      <div className="top-brand"><div className="brand-shield"><ShieldCheck size={25}/></div><div><strong>Sentinel</strong><span>Transaction Risk Monitor</span></div></div>
      <nav className="top-nav">{navItems.slice(0, 4).map(({ label, icon: Icon }) => <button key={label} className={page === label ? 'top-nav-link active' : 'top-nav-link'} onClick={() => setPage(label)}><Icon size={16}/>{label}</button>)}</nav>
      <div className="top-actions"><button className="icon-button notification" aria-label="Notifications"><Bell size={18}/></button><div className="profile-avatar">A</div><span className="profile-name">Project Demo</span></div>
    </header>

    {mobileNav && <div className="mobile-nav">{navItems.map(({ label, icon: Icon }) => <button key={label} onClick={() => { setPage(label); setMobileNav(false); }}><Icon size={17}/>{label}</button>)}</div>}

    <div className="page-layout">
      <aside className="sidebar">
        <div className="sidebar-caption">WORKSPACE</div>
        {navItems.map(({ label, icon: Icon }) => <button key={label} className={`side-link ${page === label ? 'selected' : ''}`} onClick={() => setPage(label)}><Icon size={18}/><span>{label}</span>{page === label && <ChevronRight className="side-chevron" size={15}/>}</button>)}
        <div className="sidebar-promo"><div className="promo-logo"><ShieldCheck size={22}/></div><strong>Sentinel</strong><p>Credit card fraud detection for safer transactions.</p><ul><li><CheckCircle2 size={15}/>Machine learning model</li><li><CheckCircle2 size={15}/>Risk assessment</li><li><CheckCircle2 size={15}/>Academic demonstration</li></ul></div>
      </aside>

      <main className="main-content">
        <div className="breadcrumb">RISK OPERATIONS <ChevronRight size={13}/> <span>{page.toUpperCase()}</span></div>
        <div className="page-heading"><div><h1>{page === 'Overview' ? 'Credit Card Fraud Detection' : page}</h1><p>{page === 'Overview' ? 'Monitor transaction activity and review model assessments.' : page === 'Transactions' ? 'Select a test record to review the model response.' : page === 'Manual Assessment' ? 'Enter transaction features and request a model assessment.' : page === 'Model Performance' ? 'Review the model evaluation metrics from your training experiment.' : 'Sentinel is an academic fraud detection prototype.'}</p></div><button className="secondary-button" onClick={refresh}><RefreshCw size={15}/> Refresh</button></div>

        {error && <div className="error-banner"><AlertTriangle size={18}/><div><strong>Something needs attention</strong><p>{error}</p></div><button onClick={() => setError('')} aria-label="Dismiss"><X size={16}/></button></div>}

        {page === 'Manual Assessment' ? <section className="panel manual-panel"><div className="panel-heading"><div className="heading-icon"><SlidersHorizontal size={19}/></div><div><h2>Manual transaction assessment</h2><p>The model requires Time, V1–V28 and Amount.</p></div></div><form onSubmit={predictManual}><div className="manual-grid"><label>Elapsed time (seconds)<input type="number" min="0" step="any" value={manual.Time} onChange={(e) => setManual({ ...manual, Time: e.target.value })} required/></label><label>Transaction amount<input type="number" min="0" step="any" value={manual.Amount} onChange={(e) => setManual({ ...manual, Amount: e.target.value })} required/></label></div><details className="feature-details"><summary>Advanced features <span>V1–V28</span></summary><div className="feature-grid">{FEATURES.filter((f) => f !== 'Time' && f !== 'Amount').map((feature) => <label key={feature}>{feature}<input type="number" step="any" value={manual[feature]} onChange={(e) => setManual({ ...manual, [feature]: e.target.value })} required/></label>)}</div></details><button className="primary-button" disabled={loading}>{loading ? <LoaderCircle className="spin" size={17}/> : <ShieldCheck size={17}/>} {loading ? 'Assessing transaction…' : 'Run assessment'}<ChevronRight size={17}/></button></form></section>
        : page === 'Model Performance' ? <div className="performance-grid"><section className="panel"><div className="panel-heading"><div className="heading-icon"><ChartNoAxesCombined size={19}/></div><div><h2>Evaluation metrics</h2><p>Reported from your current held-out test evaluation.</p></div></div><div className="metric-list"><div><span>Precision</span><b>95.77%</b></div><div><span>Recall</span><b>71.58%</b></div><div><span>F1-score</span><b>81.93%</b></div><div><span>ROC-AUC</span><b>92.97%</b></div><div><span>Decision threshold</span><b>0.40</b></div></div><p className="small-disclaimer">These are the previously recorded evaluation results for this model configuration, not live calculations. For rigorous final reporting, evaluate once on an untouched test set.</p></section><section className="panel"><div className="panel-heading"><div className="heading-icon"><Database size={19}/></div><div><h2>Model details</h2><p>Current local inference configuration.</p></div></div><div className="detail-list"><div><span>Algorithm</span><b>Random Forest</b></div><div><span>Input features</span><b>30</b></div><div><span>Feature columns</span><b>Time, V1–V28, Amount</b></div><div><span>Threshold</span><b>0.40</b></div><div><span>Backend</span><b>FastAPI</b></div></div></section></div>
        : page === 'About Project' ? <section className="panel about-panel"><IconTile><ShieldCheck size={22}/></IconTile><h2>Sentinel — Transaction Risk Monitor</h2><p>A college machine learning project that demonstrates how a Random Forest classifier can score credit card transaction records from a public anonymized dataset.</p><div className="about-note"><Info size={18}/><span>This is an educational prototype. A model score is not necessarily a calibrated probability and must not be used to approve or decline real payments.</span></div></section>
        : <>
          <section className="hero-banner"><div className="hero-copy"><span className="eyebrow">TRANSACTION RISK MONITOR</span><h2>Detect <em>Fraud.</em> Protect Transactions.</h2><p>Analyze transaction records using your trained machine learning model.</p></div><div className="hero-art"><div className="hero-card-art"><CreditCard size={44}/><div className="card-lines"><i/><i/><i/></div></div><div className="hero-shield-art"><ShieldCheck size={54}/></div><div className="hero-orbit orbit-one"/><div className="hero-orbit orbit-two"/></div></section>
          <section className="metrics-grid"><MetricCard icon={Database} title="Test transactions" value={number(samples.length)} note="Loaded from test sample file" tone="orange"/><MetricCard icon={AlertTriangle} title="Fraud labels in test set" value={samples.length ? 'Available after prediction' : '—'} note="Reference labels are hidden until assessment" tone="red"/><MetricCard icon={CheckCircle2} title="Model precision" value="95.77%" note="Recorded test evaluation" tone="green"/><MetricCard icon={ChartNoAxesCombined} title="Model recall" value="71.58%" note="Recorded test evaluation" tone="blue"/></section>
          <div className="dashboard-grid">
            <section className="panel transactions-panel"><div className="panel-heading"><div className="heading-icon orange-icon"><Database size={19}/></div><div><h2>Test transactions</h2><p>Choose a record to run the classifier. Actual labels remain hidden until prediction.</p></div><span className="test-set-tag">TEST SET</span></div><div className="table-toolbar"><div className="search-box"><Search size={17}/><input placeholder="Search by transaction ID or amount…" value={search} onChange={(e) => setSearch(e.target.value)}/></div><span className="record-count">{filtered.length} records</span></div><div className="table-wrap"><table><thead><tr><th>Transaction ID</th><th>Amount</th><th>Elapsed time</th><th></th></tr></thead><tbody>{filtered.map((sample) => <tr key={sample.sample_id} className={selectedId === sample.sample_id ? 'row-selected' : ''} onClick={() => { setSelectedId(sample.sample_id); setResult(null); }}><td><b>{sample.sample_id}</b></td><td>₹{money(sample.amount)}</td><td>{number(sample.time)} sec</td><td><button className="row-action" aria-label={`Select ${sample.sample_id}`} onClick={(e) => { e.stopPropagation(); setSelectedId(sample.sample_id); setResult(null); }}><ChevronRight size={17}/></button></td></tr>)}{filtered.length === 0 && <tr><td colSpan="4" className="empty-state">No matching transactions found.</td></tr>}</tbody></table></div><div className="table-footer"><span>Selected record: <b>{selectedId || 'None'}</b></span><button className="primary-button" disabled={!selectedId || loading} onClick={() => predictSample()}>{loading ? <LoaderCircle size={16} className="spin"/> : <FileSearch size={16}/>} Run assessment <ChevronRight size={16}/></button></div></section>
            <section className="panel assessment-panel"><div className="panel-heading"><div className="heading-icon"><ShieldCheck size={19}/></div><div><h2>Assessment result</h2><p>Model output for the selected transaction</p></div></div>{result ? <><div className={`assessment-status ${predictedFraud ? 'fraud' : 'legitimate'}`}><div className="status-main"><div className="status-symbol">{predictedFraud ? <AlertTriangle size={23}/> : <ShieldCheck size={23}/>}</div><div><span>PREDICTION</span><h3>{predictedFraud ? 'Potential Fraud' : 'Likely Legitimate'}</h3><small>{result.sample_id || selectedId || 'Manual transaction'}</small></div><div className="score-block"><span>FRAUD SCORE</span><strong>{(score <= 1 ? score * 100 : score).toFixed(2)}%</strong></div></div><div className="score-track"><span style={{ width: `${Math.min(100, Math.max(0, score <= 1 ? score * 100 : score))}%` }}/></div><p className="threshold-note">Threshold {threshold.toFixed(2)} · Model score, not a guaranteed calibrated real-world probability.</p></div>{hasActual && <div className={`reference-label ${mismatch ? 'mismatch' : 'match'}`}><div><span>ACTUAL LABEL (FROM DATASET)</span><strong>{actualFraud ? 'Fraud' : 'Legitimate'}</strong></div><b>{mismatch ? 'Mismatch' : 'Correct prediction'}</b></div>}<div className="transaction-details"><div className="details-title"><Info size={17}/>Transaction details<ChevronDown size={16}/></div><div className="details-grid"><div><span>Transaction ID</span><b>{result.sample_id || selectedId || 'Manual'}</b></div><div><span>Amount</span><b>₹{money(result.amount ?? selected?.amount ?? manual.Amount)}</b></div><div><span>Elapsed time</span><b>{number(result.time ?? selected?.time ?? manual.Time)} sec</b></div></div></div></> : <div className="result-placeholder"><div className="placeholder-shield"><ShieldCheck size={30}/></div><h3>No assessment yet</h3><p>Select a transaction from the table and run an assessment to view the model prediction.</p><button className="secondary-button" disabled={!selectedId || loading} onClick={() => predictSample()}>{loading ? <LoaderCircle size={16} className="spin"/> : <FileSearch size={16}/>} Assess selected record</button></div>}<div className="panel-disclaimer"><Info size={16}/><span>Academic demonstration only. Do not use this model to authorize or block real payments.</span></div></section>
          </div>
        </>}
        <footer className="footer"><span>© Sentinel · Transaction Risk Monitor</span></footer>
      </main>
    </div>
  </div>;
}
