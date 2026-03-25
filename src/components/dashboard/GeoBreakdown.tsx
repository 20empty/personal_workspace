import { MapPin } from "lucide-react";

export type GeoItem = {
  location: string;
  count: number;
  learners: number;
  po: number;
};

type Props = {
  items: GeoItem[];
};

export default function GeoBreakdown({ items }: Props) {
  const displayItems = items.slice(0, 8);

  if (displayItems.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-[color:var(--border)] py-6 text-center text-sm text-[color:var(--muted)]">
        暂无地点数据
      </div>
    );
  }

  const maxPo = Math.max(...displayItems.map((i) => i.po), 1);

  return (
    <div className="space-y-2">
      {displayItems.map((item) => (
        <div key={item.location} className="flex items-center gap-3">
          <div className="flex w-32 shrink-0 items-center gap-1.5 text-xs text-[color:var(--muted)]">
            <MapPin className="h-3 w-3 shrink-0" />
            <span className="truncate">{item.location || "未知地点"}</span>
          </div>
          <div className="flex flex-1 items-center gap-3">
            <div className="h-2 min-w-[60px] flex-1 overflow-hidden rounded-full bg-[color:var(--border)]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-sky-500 to-indigo-500"
                style={{ width: `${(item.po / maxPo) * 100}%` }}
              />
            </div>
            <div className="flex w-36 shrink-0 justify-between text-xs text-[color:var(--muted)]">
              <span>{item.count} 班</span>
              <span>{item.learners} 人</span>
              <span>PO {item.po}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
