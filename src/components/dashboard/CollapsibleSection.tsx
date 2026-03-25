import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronRight } from "lucide-react";

type Props = {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  defaultExpanded?: boolean;
  children: React.ReactNode;
};

export default function CollapsibleSection({
  title,
  subtitle,
  icon,
  defaultExpanded = true,
  children,
}: Props) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <div className="overflow-hidden rounded-3xl border border-[color:var(--border)] bg-[color:var(--panel)]">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between px-5 py-4 transition hover:bg-white/[.03]"
      >
        <div className="flex items-center gap-3">
          {icon && <div className="text-[color:var(--muted)]">{icon}</div>}
          <div className="text-left">
            <p className="text-sm font-medium text-[color:var(--text)]">{title}</p>
            {subtitle && <p className="text-xs text-[color:var(--muted)]">{subtitle}</p>}
          </div>
        </div>
        {expanded ? (
          <ChevronDown className="h-4 w-4 text-[color:var(--muted)]" />
        ) : (
          <ChevronRight className="h-4 w-4 text-[color:var(--muted)]" />
        )}
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="border-t border-[color:var(--border)]"
          >
            <div className="p-5">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
