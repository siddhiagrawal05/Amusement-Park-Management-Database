const tone = {
  Open: 'ok', Confirmed: 'ok', Completed: 'ok', Active: 'ok', Booked: 'ok', Ready: 'ok', Collected: 'ok', Present: 'ok', Returned: 'ok', Running: 'ok',
  Closed: 'bad', Cancelled: 'bad', Expired: 'bad', Absent: 'bad', 'Used up': 'bad',
  'Under Maintenance': 'warn', 'In Progress': 'warn', Preparing: 'warn', Leave: 'warn', Found: 'warn', Upcoming: 'warn', Off: 'warn',
  Scheduled: 'info', Placed: 'info', Reported: 'info', Resolved: 'ok',
};

export default function Badge({ s }) {
  return <span className={`badge b-${tone[s] || 'info'}`}>{s}</span>;
}