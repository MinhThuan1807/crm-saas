"use client";
import { useState, useEffect, useRef } from "react";
import {
  Sparkles,
  Loader2,
  Copy,
  Check,
  Edit3,
  Mail,
  ListChecks,
  RotateCcw,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { dealsService } from "@/services/deals.service";
import { useQueryClient } from "@tanstack/react-query";
import { dealKeys } from "@/hooks/useDeals";
import { toast } from "sonner";

// ── AI content constants ────────────────────────────────────────────────────────
const MEETING_NOTE =
  `Cuộc họp ngày 19/03/2026 tại văn phòng Ngân hàng JKL, Hà Nội.\n` +
  `\n` +
  `Tham dự: Phạm Đức Quang (Giám đốc IT), Nguyễn Thị Lan (Trưởng phòng bảo mật), Đặng Tuấn (Sales Manager – SalesFlow).\n` +
  `\n` +
  `Nội dung thảo luận:\n` +
  `• Khách hàng yêu cầu kiểm tra bảo mật toàn diện cho hệ thống core banking.\n` +
  `• Phạm vi: penetration testing, security audit code, đánh giá tuân thủ PCI-DSS.\n` +
  `• Timeline mong muốn: bắt đầu tháng 4/2026, hoàn thành trong 8 tuần.\n` +
  `• Ngân sách đã được CFO phê duyệt ở mức 480 triệu VND.\n` +
  `\n` +
  `Bước tiếp theo:\n` +
  `• Gửi hợp đồng và SOW chi tiết trước ngày 22/03.\n` +
  `• Lên lịch kickoff meeting với đội kỹ thuật.`;

interface AITask {
  id: string;
  title: string;
  due: string;
  done: boolean;
}

const AI_TASKS: AITask[] = [
  { id: "ai1", title: "Soạn và gửi hợp đồng + SOW chi tiết",          due: "22/03/2026", done: false },
  { id: "ai2", title: "Lên lịch kickoff meeting với đội kỹ thuật JKL", due: "24/03/2026", done: false },
  { id: "ai3", title: "Chuẩn bị quyền truy cập staging environment",   due: "25/03/2026", done: false },
  { id: "ai4", title: "Xác nhận danh sách checklist PCI-DSS với JKL",  due: "28/03/2026", done: false },
];

const EMAIL_DRAFT =
  `Kính gửi anh Phạm Đức Quang,\n\n` +
  `Cảm ơn anh đã dành thời gian cho cuộc gặp hôm nay tại văn phòng Ngân hàng JKL. Chúng tôi rất trân trọng cơ hội được hỗ trợ dự án bảo mật quan trọng này.\n\n` +
  `Như đã thảo luận, chúng tôi sẽ tiến hành Security Audit toàn diện bao gồm:\n` +
  `  • Penetration testing cho toàn bộ hệ thống core banking\n` +
  `  • Security code review và đánh giá kiến trúc bảo mật\n` +
  `  • Đánh giá tuân thủ tiêu chuẩn PCI-DSS\n\n` +
  `Timeline dự kiến: 8 tuần, bắt đầu đầu tháng 4/2026. Báo cáo bàn giao song ngữ Việt – Anh.\n\n` +
  `Hợp đồng và Statement of Work chi tiết sẽ được gửi trước ngày 22/03/2026.\n\n` +
  `Trân trọng,\n` +
  `Đặng Tuấn — Sales Manager, SalesFlow\n` +
  `0912 888 999 | tuan.dang@salesflow.vn`;

type Phase = "idle" | "analyzing" | "streaming_tasks" | "streaming_email" | "done";

interface DealAiAnalyzerProps {
  dealId: string;
}

export function DealAiAnalyzer({ dealId }: DealAiAnalyzerProps) {
  const [note, setNote] = useState(MEETING_NOTE);
  const [phase, setPhase] = useState<Phase>("idle");
  const [revealedTasks, setRevealedTasks] = useState(0);
  const [aiTasks, setAiTasks] = useState<AITask[]>([]);
  const [emailText, setEmailText] = useState("");
  const [emailEditing, setEmailEditing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isAccepting, setIsAccepting] = useState(false);
  const [tasksAccepted, setTasksAccepted] = useState(false);

  const queryClient = useQueryClient();
  const realTasksRef = useRef<AITask[]>([]);
  const rawTasksRef = useRef<Array<{ title: string; dueDate?: string | null }>>([]);
  const realEmailRef = useRef<string>("");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  // Clean up SSE connection on unmount
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  // ── Streaming state machine ──────────────────────────────────────────────
  useEffect(() => {
    if (phase !== "streaming_tasks") return;
    const targetTasks = realTasksRef.current;
    if (revealedTasks >= targetTasks.length) {
      const t = setTimeout(() => setPhase("streaming_email"), 450);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => {
      setAiTasks((prev) => [...prev, targetTasks[revealedTasks]]);
      setRevealedTasks((n) => n + 1);
    }, 320);
    return () => clearTimeout(t);
  }, [phase, revealedTasks]);

  useEffect(() => {
    if (phase !== "streaming_email") return;
    let i = 0;
    const draft = realEmailRef.current;
    intervalRef.current = setInterval(() => {
      i += Math.ceil(Math.random() * 7 + 5);
      const slice = draft.slice(0, Math.min(i, draft.length));
      setEmailText(slice);
      if (i >= draft.length) {
        clearInterval(intervalRef.current!);
        setPhase("done");
      }
    }, 18);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [phase]);

  const startAnalyze = async () => {
    setPhase("analyzing");
    setRevealedTasks(0);
    setAiTasks([]);
    setEmailText("");
    setCopied(false);
    setErrorMsg("");
    setTasksAccepted(false);

    try {
      // 1. Send analysis request to backend
      await dealsService.analyze(dealId, note);

      // 2. Establish EventSource connection to stream results
      const eventSource = new EventSource(`/api/deals/${dealId}/ai-stream`, {
        withCredentials: true,
      });

      eventSourceRef.current = eventSource;

      eventSource.addEventListener("ai-connected", () => {
        console.log("SSE connected successfully");
      });

      eventSource.addEventListener("ai-complete", (e) => {
        try {
          const data = JSON.parse(e.data);
          const mapped = (data.tasks || []).map((t: { title: string; dueDate?: string | null }, idx: number) => ({
            id: `ai-${idx}-${Date.now()}`,
            title: t.title,
            due: t.dueDate ? new Date(t.dueDate).toLocaleDateString("vi-VN") : "Không có hạn",
            done: false,
          }));

          realTasksRef.current = mapped;
          rawTasksRef.current = data.tasks || [];
          realEmailRef.current = data.emailDraft || "Không có nội dung email được tạo.";

          // Switch to streaming phase
          setPhase("streaming_tasks");
        } catch (err) {
          console.error("Error parsing ai-complete payload:", err);
          setErrorMsg("Dữ liệu trả về từ AI không hợp lệ.");
          setPhase("idle");
        }
        eventSource.close();
      });

      eventSource.addEventListener("ai-error", (e) => {
        try {
          const data = JSON.parse(e.data);
          setErrorMsg(data.message || "Lỗi xử lý từ hệ thống AI.");
        } catch {
          setErrorMsg("Hệ thống AI gặp sự cố.");
        }
        setPhase("idle");
        eventSource.close();
      });

      eventSource.onerror = (e) => {
        console.error("EventSource connection error:", e);
        setErrorMsg("Mất kết nối với máy chủ AI.");
        setPhase("idle");
        eventSource.close();
      };

    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      console.error("Error triggering analyze:", err);
      setErrorMsg(
        error.response?.data?.message || "Không thể khởi động phân tích AI. Vui lòng thử lại sau."
      );
      setPhase("idle");
    }
  };

  const reset = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setPhase("idle");
    setRevealedTasks(0);
    setAiTasks([]);
    setEmailText("");
    setCopied(false);
    setErrorMsg("");
    setTasksAccepted(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(emailText).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  const handleAcceptTasks = async () => {
    if (rawTasksRef.current.length === 0) return;
    setIsAccepting(true);
    try {
      await dealsService.createTasksBulk(dealId, rawTasksRef.current);
      await queryClient.invalidateQueries({ queryKey: dealKeys.detail(dealId) });
      setTasksAccepted(true);
      toast.success("Đã thêm các task gợi ý vào Deal thành công!");
    } catch (err) {
      console.error("Failed to accept tasks:", err);
      toast.error("Không thể lưu tasks vào Deal.");
    } finally {
      setIsAccepting(false);
    }
  };

  const toggleAiTask = (id: string) =>
    setAiTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
    );

  const isStreaming = phase === "streaming_tasks" || phase === "streaming_email";

  return (
    <div className="px-6 pt-5 pb-5 space-y-4">
      {/* ── Main AI card ── */}
      <div className="bg-background rounded-xl border border-border overflow-hidden">
        {/* Card header */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border">
          <div className="size-[32px] rounded-[9px] bg-secondary flex items-center justify-center shrink-0">
            <Sparkles size={15} className="text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-foreground" style={{ fontSize: 14, fontWeight: 600 }}>
              Phân tích cuộc họp bằng AI
            </p>
            <p className="text-muted-foreground" style={{ fontSize: 11, marginTop: 1 }}>
              Dán ghi chú → AI tạo tasks + email follow-up
            </p>
          </div>
          {phase === "done" && (
            <button
              onClick={reset}
              className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors cursor-pointer bg-transparent border-0 p-0"
              style={{ fontSize: 12 }}
            >
              <RotateCcw size={12} />
              Phân tích lại
            </button>
          )}
        </div>

        {/* Textarea + button */}
        <div className="px-4 pt-4 pb-3.5">
          <p
            className="text-muted-foreground uppercase mb-2"
            style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.06em" }}
          >
            Ghi chú cuộc họp
          </p>
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            disabled={isStreaming || phase === "analyzing"}
            rows={phase === "idle" ? 10 : 5}
            className={cn(
              "resize-none border-border focus-visible:border-primary transition-all duration-300",
              (isStreaming || phase === "analyzing") && "bg-[#F8F8F7] dark:bg-muted text-muted-foreground"
            )}
            style={{ fontSize: 12, lineHeight: 1.75 }}
          />

          <Button
            onClick={phase === "done" ? reset : startAnalyze}
            disabled={isStreaming || phase === "analyzing" || !note.trim()}
            className="w-full mt-3 gap-2 h-9"
          >
            {phase === "analyzing" ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Đang phân tích...
              </>
            ) : isStreaming ? (
              <>
                <Sparkles size={14} className="animate-pulse" />
                Đang tạo nội dung...
              </>
            ) : (
              <>
                <Sparkles size={14} />
                Phân tích bằng AI
              </>
            )}
          </Button>
          {errorMsg && (
            <div className="mt-2 text-xs text-red-500 bg-red-50/50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/50 rounded-lg p-2.5 animate-in fade-in duration-300">
              {errorMsg}
            </div>
          )}
        </div>
      </div>

      {/* ── Analyzing skeleton ── */}
      {phase === "analyzing" && (
        <div className="bg-background rounded-xl border border-border px-4 py-5">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="size-[26px] rounded-[7px] bg-secondary flex items-center justify-center shrink-0">
              <Sparkles size={12} className="text-primary animate-pulse" />
            </div>
            <p className="text-primary" style={{ fontSize: 13, fontWeight: 500 }}>
              AI đang đọc và phân tích ghi chú...
            </p>
          </div>
          {/* Scanning lines */}
          {[80, 95, 60, 75, 45].map((w, i) => (
            <div
              key={i}
              className="h-2.5 bg-muted rounded-full mb-2 animate-pulse overflow-hidden"
              style={{ animationDelay: `${i * 0.12}s` }}
            >
              <div className="h-full rounded-full bg-primary/15" style={{ width: `${w}%` }} />
            </div>
          ))}
        </div>
      )}

      {/* ── Generated tasks ── */}
      {(phase === "streaming_tasks" || phase === "streaming_email" || phase === "done") &&
        aiTasks.length > 0 && (
          <div className="bg-background rounded-xl border border-border overflow-hidden">
            <div className="flex items-center gap-2.5 px-4 py-3 border-b border-border">
              <div className="size-[26px] rounded-[7px] bg-secondary flex items-center justify-center shrink-0">
                <ListChecks size={12} className="text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-foreground" style={{ fontSize: 13, fontWeight: 600 }}>
                  Tasks được tạo
                </p>
                <p className="text-muted-foreground" style={{ fontSize: 10, marginTop: 1 }}>
                  Từ nội dung cuộc họp
                </p>
              </div>
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-primary bg-secondary"
                style={{ fontSize: 10 }}
              >
                <Sparkles size={9} />
                AI · {aiTasks.length}
              </span>
            </div>

            <div className="px-3 py-3 space-y-1.5">
              {aiTasks.map((task, i) => (
                <div
                  key={task.id}
                  onClick={() => toggleAiTask(task.id)}
                  className={cn(
                    "flex items-start gap-2.5 px-3 py-2.5 rounded-lg border cursor-pointer transition-all",
                    "animate-in fade-in slide-in-from-bottom-1 duration-300",
                    task.done
                      ? "border-green-100 dark:border-green-950/60 bg-green-50/50 dark:bg-green-950/20"
                      : "border-border bg-background hover:bg-muted/20"
                  )}
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  <Checkbox
                    checked={task.done}
                    onCheckedChange={() => toggleAiTask(task.id)}
                    className="mt-0.5 shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div className="flex-1 min-w-0">
                    <p
                      className={cn(
                        "leading-snug",
                        task.done ? "text-muted-foreground line-through" : "text-foreground"
                      )}
                      style={{ fontSize: 12, fontWeight: 500 }}
                    >
                      {task.title}
                    </p>
                    <div
                      className="flex items-center gap-1 mt-1 text-muted-foreground"
                      style={{ fontSize: 10 }}
                    >
                      <Clock size={9} strokeWidth={1.7} />
                      {task.due}
                    </div>
                  </div>
                </div>
              ))}

              {/* Streaming cursor while adding tasks */}
              {phase === "streaming_tasks" && (
                <div className="flex items-center gap-2 px-3 py-2.5">
                  <div className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        className="size-1.5 rounded-full bg-primary/40 animate-bounce"
                        style={{ animationDelay: `${i * 0.15}s` }}
                      />
                    ))}
                  </div>
                  <span className="text-muted-foreground" style={{ fontSize: 11 }}>
                    Đang tạo thêm...
                  </span>
                </div>
              )}

              {/* Accept tasks button */}
              {phase === "done" && (
                <div className="pt-2 px-3 pb-1 border-t border-border/50">
                  <Button
                    onClick={handleAcceptTasks}
                    disabled={isAccepting || tasksAccepted}
                    variant={tasksAccepted ? "outline" : "default"}
                    className={cn(
                      "w-full h-8 text-xs gap-1.5 transition-all",
                      tasksAccepted && "bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-950/40 border-green-200 dark:border-green-900"
                    )}
                  >
                    {isAccepting ? (
                      <>
                        <Loader2 size={11} className="animate-spin" />
                        Đang đồng bộ...
                      </>
                    ) : tasksAccepted ? (
                      <>
                        <Check size={11} />
                        Đã chấp nhận và thêm vào Deal
                      </>
                    ) : (
                      <>
                        <Check size={11} />
                        Chấp nhận và Thêm Tasks vào Deal
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

      {/* ── Email draft card ── */}
      {(phase === "streaming_email" || phase === "done") && emailText.length > 0 && (
        <div className="bg-background rounded-xl border border-border overflow-hidden animate-in fade-in duration-300">
          {/* Card header */}
          <div className="flex items-center gap-2.5 px-4 py-3 border-b border-border">
            <div className="size-[26px] rounded-[7px] bg-secondary flex items-center justify-center shrink-0">
              <Mail size={12} className="text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-foreground" style={{ fontSize: 13, fontWeight: 600 }}>
                Email follow-up từ AI
              </p>
              <p className="text-muted-foreground" style={{ fontSize: 10, marginTop: 1 }}>
                Gửi tới: quang.pham@jklbank.vn
              </p>
            </div>
            <span
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-primary bg-secondary"
              style={{ fontSize: 10 }}
            >
              <Sparkles size={9} />
              AI
            </span>
          </div>

          {/* Email body */}
          <div className="px-4 py-3.5">
            {emailEditing ? (
              <Textarea
                value={emailText}
                onChange={(e) => setEmailText(e.target.value)}
                rows={12}
                className="resize-none border-primary/50 bg-[#F8F8F7] dark:bg-card text-foreground focus-visible:ring-primary/20"
                style={{ fontSize: 12, lineHeight: 1.75 }}
                autoFocus
              />
            ) : (
              <pre
                className="text-foreground m-0 whitespace-pre-wrap break-words"
                style={{ fontSize: 12, fontFamily: "inherit", lineHeight: 1.75 }}
              >
                {emailText}
                {/* Typing cursor */}
                {phase === "streaming_email" && (
                  <span className="inline-block w-0.5 h-3.5 bg-primary ml-0.5 animate-pulse align-middle" />
                )}
              </pre>
            )}
          </div>

          {/* Action bar */}
          {phase === "done" && (
            <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-border">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEmailEditing(!emailEditing)}
                className={cn(
                  "h-7 gap-1 border-border",
                  emailEditing
                    ? "bg-secondary text-primary border-secondary hover:bg-secondary/80 text-xs"
                    : "text-muted-foreground hover:text-foreground text-xs"
                )}
              >
                <Edit3 size={11} />
                {emailEditing ? "Xong" : "Chỉnh sửa"}
              </Button>
              <Button
                size="sm"
                onClick={handleCopy}
                variant={copied ? "outline" : "default"}
                className={cn(
                  "h-7 gap-1 text-xs transition-all",
                  copied && "bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-950/40 border-green-200 dark:border-green-900"
                )}
              >
                {copied ? <Check size={11} /> : <Copy size={11} />}
                {copied ? "Đã sao chép!" : "Sao chép"}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* AI footer note */}
      {phase === "done" && (
        <div className="flex items-center gap-1.5 px-1">
          <Sparkles size={10} color="#7B74C9" />
          <span className="text-muted-foreground" style={{ fontSize: 11 }}>
            Được tạo bởi SalesFlow AI · Kết quả mang tính tham khảo, hãy kiểm tra trước khi gửi
          </span>
        </div>
      )}
    </div>
  );
}
