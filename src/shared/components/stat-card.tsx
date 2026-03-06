interface StatCardProps {
  title: string;
  value: string | number;
  sub?: string;
  color?: 'default' | 'green' | 'red';
}

export function StatCard({ title, value, sub, color = 'default' }: StatCardProps) {
  return (
    <div className="stat-card">
      <div className="stat-card__label">{title}</div>
      <div className={`stat-card__value stat-card__value--${color}`}>{value}</div>
      {sub && <div className="stat-card__sub">{sub}</div>}
    </div>
  );
}
