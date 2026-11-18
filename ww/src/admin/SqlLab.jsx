import { useEffect, useState } from 'react';
import { FaPlay, FaDatabase, FaClock } from 'react-icons/fa';
import { labList, labRun } from '../api';

const GROUPS = [
  ['All', () => true],
  ['Joins', (c) => c.includes('JOIN')],
  ['Grouping', (c) => c.includes('GROUP') || c.includes('Aggregate') || c.includes('Window') || c.includes('UNION')],
  ['Subqueries', (c) => c.includes('ubquery')],
  ['Views', (c) => c === 'VIEW'],
  ['Procedures', (c) => c.includes('PROCEDURE')],
  ['Functions', (c) => c === 'FUNCTION'],
  ['Triggers', (c) => c.includes('TRIGGER') || c.includes('Routines')],
  ['Indexes', (c) => c.includes('INDEX') || c.includes('EXPLAIN')],
];

const show = (v) => (v === null || v === undefined ? 'NULL' : String(v));

export default function SqlLab() {
  const [list, setList] = useState([]);
  const [group, setGroup] = useState('All');
  const [key, setKey] = useState(null);
  const [params, setParams] = useState([]);
  const [result, setResult] = useState(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const choose = (q) => {
    setKey(q.key);
    setParams(q.params.map((p) => p.value));
    setResult(null);
    setErr('');
  };

  useEffect(() => {
    labList()
      .then((l) => {
        setList(l);
        if (l.length) choose(l[0]);
      })
      .catch((e) => setErr(e.message));
  }, []);

  const q = list.find((x) => x.key === key);
  const test = GROUPS.find(([g]) => g === group)[1];
  const shown = list.filter((x) => test(x.concept));

  const run = async () => {
    setBusy(true);
    setErr('');
    try {
      setResult(await labRun(q.key, params));
    } catch (e) {
      setResult(null);
      setErr(e.message);
    }
    setBusy(false);
  };

  return (
    <>
      <h3 className="h"><FaDatabase /> SQL Lab</h3>
      <p className="mut small mb">Run ready-made queries on the live database to show joins, views, stored procedures, functions, triggers and indexes.</p>

      <div className="toolbar">
        {GROUPS.map(([g]) => (
          <button key={g} className={`chip ${group === g ? 'on' : ''}`} onClick={() => setGroup(g)}>{g}</button>
        ))}
      </div>

      <div className="lab">
        <div className="card lab-list">
          {shown.map((x) => (
            <button key={x.key} className={`lab-item ${x.key === key ? 'on' : ''}`} onClick={() => choose(x)}>
              <span className="lab-tag">{x.concept}</span>
              <b>{x.title}</b>
            </button>
          ))}
        </div>

        <div className="card lab-main">
          {!q ? (
            <p className="mut">{err || 'Loading queries...'}</p>
          ) : (
            <>
              <span className="lab-tag">{q.concept}</span>
              <h3 className="h" style={{ marginTop: 8 }}>{q.title}</h3>
              <pre className="sql">{q.sql}</pre>

              {q.params.length > 0 && (
                <div className="fgrid">
                  {q.params.map((p, i) => (
                    <label key={p.name}>{p.name}
                      <input
                        type={p.type === 'number' ? 'number' : p.type}
                        value={params[i]}
                        onChange={(e) => setParams(params.map((v, j) => (j === i ? e.target.value : v)))}
                      />
                    </label>
                  ))}
                </div>
              )}

              <div className="row">
                <button className="btn" onClick={run} disabled={busy}><FaPlay /> {busy ? 'Running...' : 'Run Query'}</button>
                {result && <span className="small mut"><FaClock /> {result.rows.length} rows in {result.ms} ms</span>}
              </div>
              {err && <p className="err">{err}</p>}

              {result && (
                <div className="tbl-wrap lab-result">
                  {result.rows.length === 0 ? (
                    <p className="mut small">The query ran but returned no rows.</p>
                  ) : (
                    <table className="tbl">
                      <thead><tr>{result.columns.map((c) => <th key={c}>{c}</th>)}</tr></thead>
                      <tbody>
                        {result.rows.map((r, i) => (
                          <tr key={i}>{result.columns.map((c) => <td key={c} className={r[c] === null ? 'mut' : ''}>{show(r[c])}</td>)}</tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}