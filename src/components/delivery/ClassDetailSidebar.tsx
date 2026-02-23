import { motion } from "framer-motion";
import { MapPin, Users, CalendarClock, X } from "lucide-react";
import type { ViewClass } from "../../pages/DeliveryManager";

interface ClassDetailSidebarProps {
    selected: ViewClass;
    onClose: () => void;
}

export default function ClassDetailSidebar({ selected, onClose }: ClassDetailSidebarProps) {
    return (
        <motion.div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
        >
            <motion.aside
                initial={{ x: 420 }}
                animate={{ x: 0 }}
                exit={{ x: 420 }}
                transition={{ type: "spring", stiffness: 220, damping: 24 }}
                onClick={(event) => event.stopPropagation()}
                className="absolute right-0 top-0 h-full w-[420px] border-l border-[color:var(--border)] bg-[color:var(--panel-strong)] p-6 shadow-2xl shadow-black/40 backdrop-blur-xl"
            >
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--muted)]">
                            {selected.code}
                        </p>
                        <h2 className="mt-2 text-xl font-semibold text-[color:var(--text)]">
                            {selected.title}
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded-full border border-[color:var(--border)] p-2 text-[color:var(--muted)] transition hover:text-[color:var(--text)]"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <div className="mt-6 space-y-4 text-sm text-[color:var(--muted)]">
                    <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        {selected.location}
                    </div>
                    <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        {selected.learners} 位学员
                    </div>
                    <div className="flex items-center gap-2">
                        <CalendarClock className="h-4 w-4" />
                        {selected.dateRange}
                    </div>
                </div>

                <div className="mt-6">
                    <div className="flex items-center justify-between text-xs text-[color:var(--muted)]">
                        <span>交付进度</span>
                        <span className="text-[color:var(--text)]">
                            {selected.progress}%
                        </span>
                    </div>
                    <div className="mt-2 h-2 w-full rounded-full bg-black/20">
                        <div
                            className="h-2 rounded-full bg-gradient-to-r from-cyan-400 to-sky-500"
                            style={{ width: `${selected.progress}%` }}
                        />
                    </div>
                </div>

                <div className="mt-6 rounded-2xl border border-[color:var(--border)] bg-[color:var(--panel)] p-4">
                    <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--muted)]">
                        交付重点
                    </p>
                    <ul className="mt-3 space-y-2 text-sm text-[color:var(--muted)]">
                        {selected.focus.map((item) => (
                            <li key={item} className="flex items-center gap-2">
                                <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--accent)]" />
                                {item}
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="mt-6 rounded-2xl border border-[color:var(--border)] bg-[color:var(--panel)] px-4 py-3 text-sm text-[color:var(--muted)]">
                    下次课程：{selected.nextSession}
                </div>
            </motion.aside>
        </motion.div>
    );
}
