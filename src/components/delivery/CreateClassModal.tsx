import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Search } from "lucide-react";
import { CLASS_TYPE_LABELS, type ClassType, type DeliveryClassRecord } from "../../db/delivery";

const GLOBAL_CITIES = [
    // --- 中国 一级与新一线、二线核心城市 ---
    // 一线及新一线
    "中国-北京", "中国-上海", "中国-广州", "中国-深圳",
    "中国-成都", "中国-重庆", "中国-杭州", "中国-武汉", "中国-西安", "中国-郑州", "中国-青岛", "中国-长沙", "中国-天津", "中国-苏州", "中国-南京", "中国-东莞", "中国-沈阳", "中国-合肥", "中国-佛山",
    // 重点二线
    "中国-昆明", "中国-福州", "中国-无锡", "中国-厦门", "中国-哈尔滨", "中国-长春", "中国-南昌", "中国-济南", "中国-大连", "中国-贵阳", "中国-温州", "中国-石家庄", "中国-泉州", "中国-南宁", "中国-金华", "中国-常州", "中国-珠海", "中国-惠州", "中国-嘉兴", "中国-南通", "中国-中山", "中国-保定", "中国-兰州", "中国-台州", "中国-徐州", "中国-太原", "中国-绍兴", "中国-烟台", "中国-廊坊",
    "中国-香港", "中国-澳门", "中国-台北",

    // --- 东南亚 (Southeast Asia) ---
    "新加坡-新加坡市",
    "印度尼西亚-雅加达", "印度尼西亚-泗水", "印度尼西亚-巴厘岛", "印度尼西亚-万隆",
    "马来西亚-吉隆坡", "马来西亚-槟城", "马来西亚-柔佛新山",
    "泰国-曼谷", "泰国-清迈", "泰国-普吉岛",
    "越南-胡志明市", "越南-河内", "越南-岘港",
    "菲律宾-马尼拉", "菲律宾-宿务",
    "缅甸-仰光", "缅甸-内比都",
    "柬埔寨-金边", "老挝-万象", "文莱-斯里巴加湾市",

    // --- 中东 (Middle East) ---
    "阿联酋-迪拜", "阿联酋-阿布扎比", "阿联酋-沙迦",
    "沙特阿拉伯-利雅得", "沙特阿拉伯-吉达", "沙特阿拉伯-达曼", "沙特阿拉伯-麦加",
    "卡塔尔-多哈",
    "科威特-科威特城",
    "巴林-麦纳麦",
    "阿曼-马斯喀特",
    "土耳其-伊斯坦布尔", "土耳其-安卡拉", "土耳其-伊兹密尔",
    "以色列-特拉维夫", "以色列-耶路撒冷",
    "伊朗-德黑兰", "约旦-安曼", "黎巴嫩-贝鲁特", "伊拉克-巴格达",

    // --- 非洲 (Africa) ---
    "南非-约翰内斯堡", "南非-开普敦", "南非-比勒陀利亚", "南非-德班",
    "尼日利亚-拉各斯", "尼日利亚-阿布贾",
    "肯尼亚-内罗毕", "肯尼亚-蒙巴萨",
    "埃及-开罗", "埃及-亚历山大",
    "摩洛哥-卡萨布兰卡", "摩洛哥-拉巴特", "摩洛哥-马拉喀什",
    "阿尔及利亚-阿尔及尔",
    "埃塞俄比亚-亚的斯亚贝巴",
    "加纳-阿克拉",
    "坦桑尼亚-达累斯萨拉姆",
    "安哥拉-罗安达",
    "塞内加尔-达喀尔",
    "科特迪瓦-阿比让",
    "乌干达-坎帕拉",
    "卢旺达-基加利",

    // --- 其他全球核心城市 ---
    "美国-纽约", "美国-旧金山 (硅谷)", "美国-西雅图", "美国-洛杉矶", "美国-芝加哥", "美国-波士顿", "美国-达拉斯",
    "英国-伦敦", "法国-巴黎", "德国-法兰克福", "德国-柏林", "德国-慕尼黑", "荷兰-阿姆斯特丹",
    "日本-东京", "日本-大阪", "韩国-首尔",
    "澳大利亚-悉尼", "澳大利亚-墨尔本", "澳大利亚-布里斯班",
    "加拿大-多伦多", "加拿大-温哥华",
    "印度-孟买", "印度-新德里", "印度-班加罗尔",
    "巴西-圣保罗", "巴西-里约热内卢", "墨西哥-墨西哥城", "阿根廷-布宜诺斯艾利斯",
];

export type CreatePayload = Omit<DeliveryClassRecord, "id" | "createdAt" | "updatedAt">;
type ClassFormState = {
    title: string;
    code: string;
    contractNo: string;
    location: string;
    classType: ClassType;
    startDate: string;
    endDate: string;
    learners: string;
    teacherPo: string;
    projectSupportPo: string;
    headteacherPo: string;
    notes: string;
};

const getInitialForm = (initialValues?: Partial<CreatePayload>): ClassFormState => ({
    title: initialValues?.title ?? "",
    code: initialValues?.code ?? "",
    contractNo: initialValues?.contractNo ?? "",
    location: initialValues?.location ?? "",
    classType: initialValues?.classType ?? "centralized",
    startDate: initialValues?.startDate ?? "",
    endDate: initialValues?.endDate ?? "",
    learners: initialValues?.learners?.toString() ?? "",
    teacherPo: initialValues?.teacherPo?.toString() ?? "",
    projectSupportPo: initialValues?.projectSupportPo?.toString() ?? "",
    headteacherPo: initialValues?.headteacherPo?.toString() ?? "",
    notes: initialValues?.notes ?? "",
});

interface CreateClassModalProps {
    mode?: "create" | "edit";
    initialValues?: Partial<CreatePayload>;
    onClose: () => void;
    onSubmit: (payload: CreatePayload) => Promise<void>;
}

export default function CreateClassModal({
    mode = "create",
    initialValues,
    onClose,
    onSubmit,
}: CreateClassModalProps) {
    const [form, setForm] = useState<ClassFormState>(() => getInitialForm(initialValues));
    const [formErrors, setFormErrors] = useState({
        title: "",
        code: "",
        location: "",
        startDate: "",
        endDate: "",
    });
    const [showCityDropdown, setShowCityDropdown] = useState(false);
    const [showArchivePrompt, setShowArchivePrompt] = useState(false);
    const [pendingPayload, setPendingPayload] = useState<CreatePayload | null>(null);
    const [showAutoCalcHint, setShowAutoCalcHint] = useState(false);
    const hintTimeoutRef = useState<{ timer: any | null }>({ timer: null })[0];

    const filteredCities = useMemo(() => {
        if (!form.location) return GLOBAL_CITIES;
        const query = form.location.toLowerCase();
        return GLOBAL_CITIES.filter((city) => city.toLowerCase().includes(query));
    }, [form.location]);

    const formatDate = (value: string) => value.replace(/-/g, ".");
    const isEditMode = mode === "edit";

    /** 计算两个 ISO 日期字符串之间的工作日天数（含首尾，剔除周六/周日） */
    const countWorkdays = (start: string, end: string): number => {
        if (!start || !end || end < start) return 0;
        const s = new Date(`${start}T00:00:00`);
        const e = new Date(`${end}T00:00:00`);
        let count = 0;
        const cur = new Date(s);
        while (cur <= e) {
            const dow = cur.getDay(); // 0=Sun, 6=Sat
            if (dow !== 0 && dow !== 6) count++;
            cur.setDate(cur.getDate() + 1);
        }
        return count;
    };

    /** 当日期变化后，若用户尚未手动填写 PO，则自动填入工作日天数 */
    const applyDateDefaults = (nextStart: string, nextEnd: string) => {
        if (!nextStart || !nextEnd || nextEnd < nextStart) return;
        const days = countWorkdays(nextStart, nextEnd);
        if (days <= 0) return;
        setForm((prev) => ({
            ...prev,
            teacherPo: String(days),
            headteacherPo: String(days),
            // projectSupportPo 保持不变，默认留空
        }));

        // 显示提示并设置 2 秒自动消失
        setShowAutoCalcHint(true);
        if (hintTimeoutRef.timer) clearTimeout(hintTimeoutRef.timer);
        hintTimeoutRef.timer = setTimeout(() => {
            setShowAutoCalcHint(false);
            hintTimeoutRef.timer = null;
        }, 2000);
    };

    useEffect(() => {
        setForm(getInitialForm(initialValues));
        setFormErrors({
            title: "",
            code: "",
            location: "",
            startDate: "",
            endDate: "",
        });
    }, [initialValues, isEditMode]);

    const resetForm = () => {
        setForm(getInitialForm(initialValues));
        setFormErrors({
            title: "",
            code: "",
            location: "",
            startDate: "",
            endDate: "",
        });
    };

    const handleCreate = async () => {
        const nextErrors = {
            title: form.title ? "" : "请输入班级名称",
            code: form.code ? "" : "请输入班级编号",
            location: form.location ? "" : "请输入交付地点",
            startDate: form.startDate ? "" : "请选择开始日期",
            endDate: !form.endDate
                ? "请选择结束日期"
                : form.startDate && form.endDate < form.startDate
                    ? "结束日期不能早于开始日期"
                    : "",
        };
        setFormErrors(nextErrors);
        const hasError = Object.values(nextErrors).some(Boolean);
        if (hasError) {
            return;
        }
        const teacherPo = Math.round(((Number.parseFloat(form.teacherPo || "0") || 0) + Number.EPSILON) * 100) / 100;
        const projectSupportPo = Math.round(((Number.parseFloat(form.projectSupportPo || "0") || 0) + Number.EPSILON) * 100) / 100;
        const headteacherPo = Math.round(((Number.parseFloat(form.headteacherPo || "0") || 0) + Number.EPSILON) * 100) / 100;
        const payload: CreatePayload = {
            code: form.code,
            contractNo: form.contractNo.trim(),
            title: form.title,
            location: form.location,
            classType: form.classType,
            startDate: form.startDate,
            endDate: form.endDate,
            learners: Number.parseInt(form.learners || "0", 10) || 0,
            teacherPo,
            projectSupportPo,
            headteacherPo,
            status: "已排期",
            stage: "upcoming",
            progress: 0,
            focus: form.notes ? [form.notes] : ["待完善"],
            archiveState: "待归档",
            notes: form.notes ? form.notes : null,
        };

        if (isEditMode) {
            payload.status = initialValues?.status ?? payload.status;
            payload.stage = initialValues?.stage ?? payload.stage;
            payload.progress = initialValues?.progress ?? payload.progress;
            payload.focus = initialValues?.focus ?? payload.focus;
            payload.archiveState = initialValues?.archiveState ?? payload.archiveState;
            payload.nextSession = initialValues?.nextSession ?? payload.nextSession;
        }

        const end = new Date(`${form.endDate}T00:00:00`).getTime();
        const today = new Date().setHours(0, 0, 0, 0);

        if (end < today && !(isEditMode && initialValues?.archiveState === "已归档")) {
            setPendingPayload(payload);
            setShowArchivePrompt(true);
            return;
        }

        await onSubmit(payload);
    };

    const handleConfirmArchivePrompt = async (archive: boolean) => {
        if (!pendingPayload) return;
        const finalPayload = { ...pendingPayload };
        if (archive) {
            finalPayload.status = "已交付";
            finalPayload.stage = "completed";
            finalPayload.progress = 100;
            finalPayload.archiveState = "已归档";
        }
        setShowArchivePrompt(false);
        await onSubmit(finalPayload);
    };

    return (
        <motion.div
            className="fixed inset-0 z-40 grid place-items-center bg-black/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
        >
            <AnimatePresence>
                {showArchivePrompt && pendingPayload ? (
                    <motion.div
                        className="absolute inset-0 z-50 grid place-items-center rounded-3xl bg-black/60 backdrop-blur-[2px]"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 10 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 10 }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-[360px] max-w-[85vw] rounded-3xl border border-[color:var(--border)] bg-[color:var(--panel-strong)] p-6 shadow-2xl"
                        >
                            <h3 className="text-lg font-semibold text-[color:var(--text)]">已过期的截止时间</h3>
                            <p className="mt-2 text-sm text-[color:var(--muted)]">
                                当前设置的交付结束时间早于今天。是否需要直接将该班级置为「已交付」并归档？
                            </p>
                            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
                                <button
                                    onClick={() => setShowArchivePrompt(false)}
                                    className="rounded-xl border border-[color:var(--border)] px-4 py-2 text-sm text-[color:var(--muted)] transition hover:text-[color:var(--text)]"
                                >
                                    取消
                                </button>
                                <button
                                    onClick={() => handleConfirmArchivePrompt(false)}
                                    className="rounded-xl border border-[color:var(--border)] px-4 py-2 text-sm text-[color:var(--muted)] transition hover:text-[color:var(--text)]"
                                >
                                    仅保存
                                </button>
                                <button
                                    onClick={() => handleConfirmArchivePrompt(true)}
                                    className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20"
                                >
                                    直接归档
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                ) : null}
            </AnimatePresence>

            <motion.div
                initial={{ opacity: 0, scale: 0.98, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98, y: 10 }}
                transition={{ type: "spring", stiffness: 220, damping: 22 }}
                onClick={(event) => event.stopPropagation()}
                className="relative flex max-h-[90vh] w-[520px] max-w-[92vw] flex-col overflow-hidden rounded-3xl border border-[color:var(--border)] bg-[color:var(--panel-strong)] p-6 shadow-2xl shadow-black/40 backdrop-blur-xl"
            >
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--muted)]">
                            {isEditMode ? "Edit Class" : "Create Class"}
                        </p>
                        <h2 className="mt-2 text-xl font-semibold text-[color:var(--text)]">
                            {isEditMode ? "编辑班级" : "新建班级"}
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded-full border border-[color:var(--border)] p-2 text-[color:var(--muted)] transition hover:text-[color:var(--text)]"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <div className="mt-6 grid flex-1 gap-4 overflow-y-auto pr-1">
                    <label className="block text-sm text-[color:var(--muted)]">
                        班级名称
                        <input
                            value={form.title}
                            onChange={(event) =>
                                setForm((prev) => ({ ...prev, title: event.target.value }))
                            }
                            className="mt-2 w-full rounded-2xl border border-[color:var(--border)] bg-transparent px-4 py-3 text-[color:var(--text)] outline-none transition focus:border-[color:var(--accent)]"
                            placeholder="例如：HCS xx银行培训"
                        />
                        {formErrors.title ? (
                            <span className="mt-2 block text-xs text-amber-300">
                                {formErrors.title}
                            </span>
                        ) : null}
                    </label>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <label className="block text-sm text-[color:var(--muted)]">
                            班级编号
                            <input
                                value={form.code}
                                onChange={(event) =>
                                    setForm((prev) => ({ ...prev, code: event.target.value }))
                                }
                                className="mt-2 w-full rounded-2xl border border-[color:var(--border)] bg-transparent px-4 py-3 text-[color:var(--text)] outline-none transition focus:border-[color:var(--accent)]"
                                placeholder="例如：CN-SZ-2403"
                            />
                            {formErrors.code ? (
                                <span className="mt-2 block text-xs text-amber-300">
                                    {formErrors.code}
                                </span>
                            ) : null}
                        </label>
                        <label className="block text-sm text-[color:var(--muted)]">
                            合同号
                            <input
                                value={form.contractNo}
                                onChange={(event) =>
                                    setForm((prev) => ({ ...prev, contractNo: event.target.value }))
                                }
                                className="mt-2 w-full rounded-2xl border border-[color:var(--border)] bg-transparent px-4 py-3 text-[color:var(--text)] outline-none transition focus:border-[color:var(--accent)]"
                                placeholder="例如：HT-2026-001"
                            />
                        </label>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="relative">
                            <label className="block text-sm text-[color:var(--muted)]">
                                交付地点
                                <div className="relative mt-2">
                                    <input
                                        value={form.location}
                                        onFocus={() => setShowCityDropdown(true)}
                                        onBlur={() => setTimeout(() => setShowCityDropdown(false), 200)}
                                        onChange={(event) => {
                                            setForm((prev) => ({ ...prev, location: event.target.value }));
                                            setShowCityDropdown(true);
                                        }}
                                        className="w-full rounded-2xl border border-[color:var(--border)] bg-transparent py-3 pl-4 pr-10 text-[color:var(--text)] outline-none transition focus:border-[color:var(--accent)]"
                                        placeholder="例如：约翰内斯堡"
                                    />
                                    <Search className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--muted)]" />
                                </div>
                                {formErrors.location ? (
                                    <span className="mt-2 block text-xs text-amber-300">
                                        {formErrors.location}
                                    </span>
                                ) : null}
                            </label>

                            {showCityDropdown && filteredCities.length > 0 && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="absolute left-0 right-0 top-[calc(100%+8px)] z-50 max-h-52 overflow-y-auto rounded-2xl border border-[color:var(--border)] bg-[color:var(--panel)] p-2 shadow-2xl backdrop-blur-xl"
                                >
                                    <div className="mb-2 px-3 text-xs font-medium text-[color:var(--muted)]">
                                        选择或搜索城市
                                    </div>
                                    {filteredCities.map((city) => (
                                        <div
                                            key={city}
                                            onClick={() => {
                                                setForm((prev) => ({ ...prev, location: city }));
                                                setShowCityDropdown(false);
                                            }}
                                            className="cursor-pointer rounded-xl px-3 py-2.5 text-sm text-[color:var(--text)] transition hover:bg-[color:var(--accent)]/15 hover:text-[color:var(--accent)]"
                                        >
                                            {/* Highlighting the matched text parts for better UX */}
                                            {form.location && city.toLowerCase().includes(form.location.toLowerCase()) ? (
                                                <span>
                                                    {city.split(new RegExp(`(${form.location})`, "i")).map((part, i) =>
                                                        part.toLowerCase() === form.location.toLowerCase()
                                                            ? <span key={i} className="font-semibold text-[color:var(--accent)]">{part}</span>
                                                            : part
                                                    )}
                                                </span>
                                            ) : city}
                                        </div>
                                    ))}
                                </motion.div>
                            )}
                        </div>
                    </div>

                    <label className="block text-sm text-[color:var(--muted)]">
                        班级类型
                        <select
                            value={form.classType}
                            onChange={(event) =>
                                setForm((prev) => ({ ...prev, classType: event.target.value as ClassType }))
                            }
                            className="mt-2 w-full rounded-2xl border border-[color:var(--border)] bg-[color:var(--panel)] px-4 py-3 text-[color:var(--text)] outline-none transition focus:border-[color:var(--accent)]"
                        >
                            {Object.entries(CLASS_TYPE_LABELS).map(([value, label]) => (
                                <option key={value} value={value}>
                                    {label}
                                </option>
                            ))}
                        </select>
                    </label>

                    <div className="flex flex-col gap-2">
                        <span className="text-sm text-[color:var(--muted)]">交付周期</span>
                        <div className="flex items-center gap-3 rounded-2xl border border-[color:var(--border)] bg-transparent px-4 py-3 focus-within:border-[color:var(--accent)] transition">
                            <input
                                type="date"
                                value={form.startDate}
                                onChange={(event) => {
                                    const nextStart = event.target.value;
                                    setForm((prev) => ({ ...prev, startDate: nextStart }));
                                    applyDateDefaults(nextStart, form.endDate);
                                }}
                                className="w-full bg-transparent text-[color:var(--text)] outline-none [color-scheme:light]"
                            />
                            <span className="text-xs text-[color:var(--muted)]">至</span>
                            <input
                                type="date"
                                value={form.endDate}
                                onChange={(event) => {
                                    const nextEnd = event.target.value;
                                    setForm((prev) => ({ ...prev, endDate: nextEnd }));
                                    applyDateDefaults(form.startDate, nextEnd);
                                }}
                                className="w-full bg-transparent text-[color:var(--text)] outline-none [color-scheme:light]"
                            />
                        </div>
                        <p className="text-xs text-[color:var(--muted)]">
                            {form.startDate && form.endDate
                                ? `${formatDate(form.startDate)} - ${formatDate(form.endDate)}`
                                : "请选择起止日期"}
                        </p>
                        <AnimatePresence>
                            {showAutoCalcHint && (
                                <motion.p
                                    initial={{ opacity: 0, y: -5, height: 0 }}
                                    animate={{ opacity: 1, y: 0, height: "auto" }}
                                    exit={{ opacity: 0, y: -5, height: 0 }}
                                    className="overflow-hidden flex items-center gap-1 text-xs text-emerald-400 font-medium"
                                >
                                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
                                    已根据选择时间自动计算 PO，如有调整请手动修改
                                </motion.p>
                            )}
                        </AnimatePresence>
                        {formErrors.startDate || formErrors.endDate ? (
                            <span className="mt-1 block text-xs text-amber-300">
                                {formErrors.startDate || formErrors.endDate}
                            </span>
                        ) : null}
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <label className="block text-sm text-[color:var(--muted)]">
                            学员规模
                            <input
                                value={form.learners}
                                onChange={(event) =>
                                    setForm((prev) => ({ ...prev, learners: event.target.value }))
                                }
                                className="mt-2 w-full rounded-2xl border border-[color:var(--border)] bg-transparent px-4 py-3 text-[color:var(--text)] outline-none transition focus:border-[color:var(--accent)]"
                                placeholder="例如：30"
                            />
                        </label>
                        <label className="block text-sm text-[color:var(--muted)]">
                            授课PO
                            <input
                                value={form.teacherPo}
                                type="number"
                                step="0.01"
                                min="0"
                                onChange={(event) =>
                                    setForm((prev) => ({ ...prev, teacherPo: event.target.value }))
                                }
                                className="mt-2 w-full rounded-2xl border border-[color:var(--border)] bg-transparent px-4 py-3 text-[color:var(--text)] outline-none transition focus:border-[color:var(--accent)]"
                                placeholder="例如：1.50"
                            />
                        </label>
                        <label className="block text-sm text-[color:var(--muted)]">
                            项目支持PO
                            <input
                                value={form.projectSupportPo}
                                type="number"
                                step="0.01"
                                min="0"
                                onChange={(event) =>
                                    setForm((prev) => ({ ...prev, projectSupportPo: event.target.value }))
                                }
                                className="mt-2 w-full rounded-2xl border border-[color:var(--border)] bg-transparent px-4 py-3 text-[color:var(--text)] outline-none transition focus:border-[color:var(--accent)]"
                                placeholder="例如：0.50"
                            />
                        </label>
                        <label className="block text-sm text-[color:var(--muted)]">
                            班主任时长(天)
                            <input
                                value={form.headteacherPo}
                                type="number"
                                step="0.01"
                                min="0"
                                onChange={(event) =>
                                    setForm((prev) => ({ ...prev, headteacherPo: event.target.value }))
                                }
                                className="mt-2 w-full rounded-2xl border border-[color:var(--border)] bg-transparent px-4 py-3 text-[color:var(--text)] outline-none transition focus:border-[color:var(--accent)]"
                                placeholder="例如：5"
                            />
                        </label>
                    </div>

                    <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--panel)] px-4 py-3 text-sm text-[color:var(--muted)]">
                        总PO：<span className="font-semibold text-[color:var(--text)]">
                            {Number((
                                (Number.parseFloat(form.teacherPo || "0") || 0) +
                                (Number.parseFloat(form.projectSupportPo || "0") || 0) +
                                (Number.parseFloat(form.headteacherPo || "0") || 0) * 0.1
                            ).toFixed(2))}
                        </span>
                    </div>

                    <label className="block text-sm text-[color:var(--muted)]">
                        备注（可选）
                        <textarea
                            value={form.notes}
                            onChange={(event) =>
                                setForm((prev) => ({ ...prev, notes: event.target.value }))
                            }
                            rows={3}
                            className="mt-2 w-full rounded-2xl border border-[color:var(--border)] bg-transparent px-4 py-3 text-[color:var(--text)] outline-none transition focus:border-[color:var(--accent)]"
                            placeholder="补充说明与交付重点"
                        />
                    </label>
                </div>

                <div className="mt-6 flex shrink-0 items-center justify-end gap-3">
                    <button
                        onClick={() => {
                            onClose();
                            resetForm();
                        }}
                        className="rounded-2xl border border-[color:var(--border)] px-4 py-2 text-sm text-[color:var(--muted)] transition hover:text-[color:var(--text)]"
                    >
                        取消
                    </button>
                    <button
                        onClick={handleCreate}
                        className="rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-sky-500/20"
                    >
                        {isEditMode ? "保存修改" : "保存"}
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
}
