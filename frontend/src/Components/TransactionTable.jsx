import { useMemo } from "react";
import {
  Database,
  Search,
  ChevronRight,
  FileSearch,
  LoaderCircle,
} from "lucide-react";

export default function TransactionTable({
  samples = [],
  search,
  setSearch,
  selectedId,
  setSelectedId,
  result,
  setResult,
  loading,
  predictSample,
  money,
  number,
}) {
  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return samples;

    return samples.filter(
      (sample) =>
        sample.sample_id.toLowerCase().includes(query) ||
        String(sample.amount).includes(query)
    );
  }, [samples, search]);

  return (
    <section className="panel transactions-panel">
      <div className="panel-heading">
        <div className="heading-icon orange-icon">
          <Database size={19} />
        </div>

        <div>
          <h2>Test transactions</h2>
          <p>
            Choose a record to run the classifier. Actual labels remain hidden
            until prediction.
          </p>
        </div>

        <span className="test-set-tag">TEST SET</span>
      </div>

      <div className="table-toolbar">
        <div className="search-box">
          <Search size={17} />
          <input
            placeholder="Search by transaction ID or amount…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <span className="record-count">{filtered.length} records</span>
      </div>

      <div className="table-wrap transaction-table-scroll">
        <table>
          <thead>
            <tr>
              <th>Transaction ID</th>
              <th>Amount</th>
              <th>Elapsed time</th>
              <th></th>
            </tr>
          </thead>

          <tbody>
            {filtered.map((sample) => (
              <tr
                key={sample.sample_id}
                className={
                  selectedId === sample.sample_id ? "row-selected" : ""
                }
                onClick={() => {
                  setSelectedId(sample.sample_id);
                  setResult(null);
                }}
              >
                <td>
                  <b>{sample.sample_id}</b>
                </td>

                <td>₹{money(sample.amount)}</td>
                <td>{number(sample.time)} sec</td>

                <td>
                  <button
                    type="button"
                    className="row-action"
                    aria-label={`Select ${sample.sample_id}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedId(sample.sample_id);
                      setResult(null);
                    }}
                  >
                    <ChevronRight size={17} />
                  </button>
                </td>
              </tr>
            ))}

            {filtered.length === 0 && (
              <tr>
                <td colSpan="4" className="empty-state">
                  No matching transactions found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="table-footer">
        <span>
          Selected record: <b>{selectedId || "None"}</b>
        </span>

        <button
          type="button"
          className="primary-button"
          disabled={!selectedId || loading}
          onClick={() => predictSample()}
        >
          {loading ? (
            <LoaderCircle size={16} className="spin" />
          ) : (
            <FileSearch size={16} />
          )}
          Run assessment
          <ChevronRight size={16} />
        </button>
      </div>
    </section>
  );
}