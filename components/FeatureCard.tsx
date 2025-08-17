export function FeatureCard({
  title,
  rank,
  overall,
  surface,
}: {
  title: string;
  rank: number | null;
  overall: number;
  surface: number;
}) {
  return (
    <div className="rounded-xl border border-gray-200 p-4">
      <div className="text-gray-700 font-medium">{title}</div>
      <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
        <div className="text-gray-500">Winrate overall</div>
        <div className="text-right mono">{(overall * 100).toFixed(1)}%</div>
        <div className="text-gray-500">Winrate surface</div>
        <div className="text-right mono">{(surface * 100).toFixed(1)}%</div>
        <div className="text-gray-500">Rank</div>
        <div className="text-right mono">{rank ?? "?"}</div>
      </div>
    </div>
  );
}
