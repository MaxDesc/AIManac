export default function RowProb({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  const pct = (value * 100).toFixed(1);
  return (
    <div className={`flex items-center gap-3 ${highlight ? "font-semibold" : ""}`}>
      <div className="w-40 text-sm">{label}</div>
      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div className="h-full bg-gray-900" style={{ width: `${pct}%` }} />
      </div>
      <div className="w-16 text-right mono">{pct}%</div>
    </div>
  );
}
