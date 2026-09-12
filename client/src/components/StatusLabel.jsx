const statusText = {
  PENDING: 'Pending',
  PAID: 'Paid',
  CANCELLED: 'Cancelled',
};

export default function StatusLabel({ status }) {
  return <span className={`status-label status-${status.toLowerCase()}`}>{statusText[status] || status}</span>;
}
