const tone = {
  Open: 'ok', Confirmed: 'ok', Completed: 'ok',
  Closed: 'bad', Cancelled: 'bad',
  'Under Maintenance': 'warn', 'In Progress': 'warn',
  Scheduled: 'info',
};

export default function Badge({ s }) {
  return <span className={`badge b-${tone[s] || 'info'}`}>{s}</span>;
}