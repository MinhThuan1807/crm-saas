"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useMe } from "@/hooks/useAuth";
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";
import { gsap } from "gsap";
import {
  LayoutDashboard,
  GitBranch,
  Users,
  TrendingUp,
  Bot,
  Sparkles,
  ShieldCheck,
  Layers,
  ArrowRight,
  Sun,
  Moon,
  Workflow,
  Cpu,
  Database,
  Network,
  Menu,
  X,
  CheckCircle2,
  ChevronRight,
  Play,
  RotateCcw
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  const router = useRouter();
  const { data: me } = useMe();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // AI Simulation State
  const [aiStep, setAiStep] = useState(0); // 0: Idle, 1: Typing Raw, 2: Analyzing, 3: Completed
  const [typedText, setTypedText] = useState("");
  const rawTranscript = "Cuộc gọi với anh Minh công ty ABC lúc 10h sáng. Anh ấy muốn nâng cấp lên gói Enterprise cho 12 users, báo giá chiết khấu 15tr/tháng. Deal này rất tiềm năng, anh ấy hẹn thứ Hai tuần sau gửi hợp đồng để ký kết và thanh toán.";
  const typingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // SVG lines ref for GSAP animation
  const svgRef = useRef<SVGSVGElement | null>(null);
  const pulseNodeRefs = useRef<Array<SVGGElement | null>>([]);

  // Perspective tilt effect for Hero Mockup
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  
  // Transform values for 3D card tilt
  const rotateX = useTransform(y, [-300, 300], [15, -15]);
  const rotateY = useTransform(x, [-300, 300], [-15, 15]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // GSAP Animation for Tech Architecture SVG
  useEffect(() => {
    if (!mounted) return;

    // Pulse effects for connection paths
    const paths = svgRef.current?.querySelectorAll(".flow-path");
    if (paths && paths.length > 0) {
      paths.forEach((path) => {
        // Create dynamic flowing dash offset
        gsap.to(path, {
          strokeDashoffset: -40,
          repeat: -1,
          ease: "none",
          duration: 2,
        });
      });
    }

    // Bounce effect for elements
    gsap.fromTo(
      ".arch-node",
      { scale: 0.9, opacity: 0.7 },
      {
        scale: 1,
        opacity: 1,
        duration: 1.5,
        repeat: -1,
        yoyo: true,
        stagger: 0.2,
        ease: "power1.inOut"
      }
    );
  }, [mounted]);

  // Mouse move handler for Hero Tilt
  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = event.clientX - rect.left - width / 2;
    const mouseY = event.clientY - rect.top - height / 2;
    x.set(mouseX);
    y.set(mouseY);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  // AI Interactive Demo Actions
  const startAiSimulation = () => {
    if (typingTimerRef.current) clearInterval(typingTimerRef.current);
    setTypedText("");
    setAiStep(1);

    let charIndex = 0;
    typingTimerRef.current = setInterval(() => {
      if (charIndex < rawTranscript.length) {
        setTypedText((prev) => prev + rawTranscript.charAt(charIndex));
        charIndex++;
      } else {
        if (typingTimerRef.current) clearInterval(typingTimerRef.current);
        setAiStep(2);
        // Simulate progress timer
        setTimeout(() => {
          setAiStep(3);
        }, 2200);
      }
    }, 25);
  };

  const resetAiSimulation = () => {
    if (typingTimerRef.current) clearInterval(typingTimerRef.current);
    setTypedText("");
    setAiStep(0);
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/30 font-sans transition-colors duration-300">
      
      {/* ── BACKGROUND ORNAMENT ────────────────────────────────────────── */}
      <div className="absolute top-0 left-0 right-0 h-[600px] bg-gradient-to-b from-primary/10 via-transparent to-transparent pointer-events-none z-0" />
      <div className="absolute top-[10%] left-[5%] w-[350px] h-[350px] bg-primary/20 rounded-full blur-[120px] pointer-events-none z-0 dark:bg-primary/15" />
      <div className="absolute top-[40%] right-[10%] w-[300px] h-[300px] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none z-0 dark:bg-indigo-500/5" />

      {/* ── HEADER / NAVBAR ────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 w-full backdrop-blur-md bg-background/80 border-b border-border/40 transition-all">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="size-8 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-105 transition-transform duration-300">
              <svg width="18" height="18" viewBox="0 0 13 13" fill="none">
                <path d="M2 10L6.5 3L11 10H2Z" fill="white" fillOpacity="0.95" />
              </svg>
            </div>
            <span className="text-lg font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground via-foreground to-primary/80">
              SalesFlow
            </span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors font-medium">Tính năng</a>
            <a href="#ai-demo" className="text-sm text-muted-foreground hover:text-foreground transition-colors font-medium">Trải nghiệm AI</a>
            <a href="#architecture" className="text-sm text-muted-foreground hover:text-foreground transition-colors font-medium">Kiến trúc</a>
          </div>

          <div className="hidden md:flex items-center gap-3">
            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="rounded-xl hover:bg-muted"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              {theme === "dark" ? <Sun className="size-4.5 text-yellow-500" /> : <Moon className="size-4.5 text-slate-700" />}
            </Button>

            {me ? (
              <Button
                onClick={() => router.push("/dashboard")}
                className="bg-primary hover:bg-primary/95 text-white font-medium rounded-xl px-5 shadow-lg shadow-primary/15 flex items-center gap-2 group cursor-pointer"
              >
                Vào Dashboard
                <ArrowRight className="size-4 group-hover:translate-x-0.5 transition-transform" />
              </Button>
            ) : (
              <>
                <Button
                  variant="ghost"
                  onClick={() => router.push("/login")}
                  className="text-foreground hover:bg-muted rounded-xl font-medium px-4 cursor-pointer"
                >
                  Đăng nhập
                </Button>
                <Button
                  onClick={() => router.push("/register")}
                  className="bg-primary hover:bg-primary/95 text-white font-medium rounded-xl px-5 shadow-lg shadow-primary/15 cursor-pointer"
                >
                  Dùng thử miễn phí
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center gap-2 md:hidden">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-xl"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              {theme === "dark" ? <Sun className="size-4.5 text-yellow-500" /> : <Moon className="size-4.5 text-slate-700" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-xl"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="absolute top-16 left-0 right-0 bg-background border-b border-border/80 p-5 flex flex-col gap-4 shadow-xl md:hidden z-40"
            >
              <a
                href="#features"
                onClick={() => setMobileMenuOpen(false)}
                className="text-sm font-medium py-1.5 text-muted-foreground hover:text-foreground border-b border-border/40"
              >
                Tính năng
              </a>
              <a
                href="#ai-demo"
                onClick={() => setMobileMenuOpen(false)}
                className="text-sm font-medium py-1.5 text-muted-foreground hover:text-foreground border-b border-border/40"
              >
                Trải nghiệm AI
              </a>
              <a
                href="#architecture"
                onClick={() => setMobileMenuOpen(false)}
                className="text-sm font-medium py-1.5 text-muted-foreground hover:text-foreground border-b border-border/40"
              >
                Kiến trúc
              </a>
              <div className="flex flex-col gap-2 pt-2">
                {me ? (
                  <Button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      router.push("/dashboard");
                    }}
                    className="w-full bg-primary hover:bg-primary/95 text-white font-medium rounded-xl"
                  >
                    Vào Dashboard
                  </Button>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        router.push("/login");
                      }}
                      className="w-full border-border rounded-xl font-medium"
                    >
                      Đăng nhập
                    </Button>
                    <Button
                      onClick={() => {
                        setMobileMenuOpen(false);
                        router.push("/register");
                      }}
                      className="w-full bg-primary hover:bg-primary/95 text-white font-medium rounded-xl"
                    >
                      Dùng thử miễn phí
                    </Button>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* ── HERO SECTION ───────────────────────────────────────────────── */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 pt-16 pb-24 md:pt-24 md:pb-32 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        
        {/* Left column info */}
        <div className="lg:col-span-6 space-y-6 text-center lg:text-left">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary/10 rounded-full border border-primary/20"
          >
            <Sparkles className="size-3.5 text-primary" />
            <span className="text-xs font-semibold text-primary uppercase tracking-wide">CRM Multi-Tenant SaaS</span>
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-[1.1] text-foreground"
          >
            Giải pháp Quản lý Khách hàng <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-indigo-600 dark:from-primary dark:to-indigo-400">Thông minh</span> thế hệ mới
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-base sm:text-lg text-muted-foreground max-w-xl mx-auto lg:mx-0 font-normal leading-relaxed"
          >
            Tăng tốc doanh số bán hàng cho các doanh nghiệp vừa và nhỏ (SME) với giao diện Kanban trực quan, bảo mật cô lập đa khách thuê và trợ lý AI phân tích ghi chú thông minh.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-2"
          >
            {me ? (
              <Button
                onClick={() => router.push("/dashboard")}
                size="lg"
                className="bg-primary hover:bg-primary/95 text-white text-base font-semibold rounded-2xl px-8 py-6 shadow-xl shadow-primary/20 flex items-center gap-2 group cursor-pointer"
              >
                Truy cập hệ thống quản trị
                <ArrowRight className="size-5 group-hover:translate-x-1 transition-transform duration-300" />
              </Button>
            ) : (
              <>
                <Button
                  onClick={() => router.push("/register")}
                  size="lg"
                  className="bg-primary hover:bg-primary/95 text-white text-base font-semibold rounded-2xl px-8 py-6 shadow-xl shadow-primary/20 cursor-pointer"
                >
                  Bắt đầu dùng thử
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.push("/login")}
                  size="lg"
                  className="border-border text-foreground hover:bg-muted text-base font-semibold rounded-2xl px-8 py-6 cursor-pointer"
                >
                  Xem Demo tài khoản
                </Button>
              </>
            )}
          </motion.div>

          {/* Key Quick Stats */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="grid grid-cols-3 gap-6 pt-10 border-t border-border/40 max-w-md mx-auto lg:mx-0"
          >
            <div>
              <p className="text-2xl font-bold text-foreground">10x</p>
              <p className="text-xs text-muted-foreground mt-0.5">Tốc độ xử lý deals</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">99.9%</p>
              <p className="text-xs text-muted-foreground mt-0.5">Cô lập Tenant an toàn</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">92%</p>
              <p className="text-xs text-muted-foreground mt-0.5">Hài lòng từ SMEs</p>
            </div>
          </motion.div>
        </div>

        {/* Right column perspective interactive graphic */}
        <div className="lg:col-span-6 flex justify-center items-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, rotate: -2 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            style={{
              perspective: 1200,
            }}
            className="w-full max-w-[500px] h-[340px] md:h-[400px] relative cursor-pointer group"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            <motion.div
              style={{
                rotateX,
                rotateY,
                transformStyle: "preserve-3d",
              }}
              className="w-full h-full bg-gradient-to-tr from-primary/30 to-indigo-500/20 rounded-3xl p-3 border border-primary/20 backdrop-blur-sm shadow-2xl relative overflow-hidden transition-all duration-200"
            >
              {/* Inner Mockup Frame */}
              <div className="w-full h-full bg-card rounded-2xl border border-border shadow-lg flex flex-col overflow-hidden relative" style={{ transform: "translateZ(30px)" }}>
                
                {/* Header bar */}
                <div className="h-10 bg-muted shrink-0 border-b border-border px-4 flex items-center justify-between">
                  <div className="flex gap-1.5">
                    <span className="size-2.5 rounded-full bg-red-400/80" />
                    <span className="size-2.5 rounded-full bg-yellow-400/80" />
                    <span className="size-2.5 rounded-full bg-green-400/80" />
                  </div>
                  <div className="text-[10px] text-muted-foreground font-mono bg-background border border-border rounded-md px-4 py-0.5">
                    salesflow.io/pipeline
                  </div>
                  <div className="size-3 bg-muted rounded-full" />
                </div>

                {/* Body mock contents (Kanban board layout) */}
                <div className="flex-1 p-3 grid grid-cols-3 gap-2 bg-[#F8F8F7] dark:bg-background/40">
                  {/* Column 1 */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center px-1">
                      <span className="text-[10px] font-semibold text-muted-foreground uppercase">Tiếp cận (3)</span>
                      <span className="size-4 rounded-full bg-muted flex items-center justify-center text-[9px] font-semibold">3</span>
                    </div>
                    <div className="bg-card border border-border rounded-lg p-2 space-y-1.5 shadow-xs">
                      <p className="text-[11px] font-semibold truncate text-foreground">Hợp đồng ABC Group</p>
                      <div className="flex justify-between items-center text-[9px] text-primary font-medium">
                        <span>12.5tr</span>
                        <span className="text-[8px] bg-secondary text-primary px-1.5 py-0.5 rounded-full">High</span>
                      </div>
                    </div>
                    <div className="bg-card border border-border rounded-lg p-2 space-y-1.5 shadow-xs">
                      <p className="text-[11px] font-semibold truncate text-foreground">Bản dùng thử XYZ</p>
                      <div className="flex justify-between items-center text-[9px] text-primary font-medium">
                        <span>5.0tr</span>
                      </div>
                    </div>
                  </div>

                  {/* Column 2 */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center px-1">
                      <span className="text-[10px] font-semibold text-primary uppercase">Đàm phán (1)</span>
                      <span className="size-4 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[9px] font-semibold">1</span>
                    </div>
                    {/* Simulated dragging card */}
                    <motion.div
                      animate={{ y: [0, 4, 0] }}
                      transition={{ repeat: -1, duration: 3, ease: "easeInOut" }}
                      className="bg-card border-2 border-primary/50 rounded-lg p-2 space-y-1.5 shadow-md scale-[1.02]"
                    >
                      <p className="text-[11px] font-semibold truncate text-foreground flex items-center gap-1">
                        <Sparkles className="size-3 text-primary shrink-0 animate-pulse" />
                        Gói Enterprise Minh
                      </p>
                      <div className="flex justify-between items-center text-[9px] text-primary font-bold">
                        <span>15.0tr/tháng</span>
                        <span className="text-[8px] bg-primary text-white px-1.5 py-0.5 rounded-full font-semibold">AI Suggested</span>
                      </div>
                    </motion.div>
                  </div>

                  {/* Column 3 */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center px-1">
                      <span className="text-[10px] font-semibold text-muted-foreground uppercase">Thành công (4)</span>
                      <span className="size-4 rounded-full bg-muted flex items-center justify-center text-[9px] font-semibold">4</span>
                    </div>
                    <div className="bg-card border border-border rounded-lg p-2 opacity-60 space-y-1 shadow-xs">
                      <p className="text-[11px] font-semibold truncate text-foreground">Triển khai VinaTech</p>
                      <span className="text-[9px] text-green-600 font-medium">Done</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Decorative side badge (AI analysis result) */}
              <div 
                className="absolute -bottom-4 -left-6 bg-card border border-border rounded-2xl p-3 shadow-xl flex items-center gap-3 max-w-[200px]"
                style={{ transform: "translateZ(50px)" }}
              >
                <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <Bot className="size-4.5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">AI Phân tích</p>
                  <p className="text-xs font-semibold text-foreground truncate mt-0.5">Đề xuất nâng cấp stage</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── CORE FEATURES SHOWCASE ─────────────────────────────────────── */}
      <section id="features" className="bg-muted/40 py-20 md:py-24 border-y border-border/40 relative z-10 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-6">
          
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-16">
            <span className="text-xs font-bold text-primary uppercase tracking-widest bg-primary/10 px-3 py-1 rounded-full">Tính năng cốt lõi</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
              Giải quyết mọi nỗi đau của các SME bán hàng
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base">
              Chúng tôi tối ưu hóa quy trình nghiệp vụ và áp dụng công nghệ tự động hóa AI nâng cao nhằm giúp doanh nghiệp của bạn vượt trội.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Feature 1 */}
            <motion.div
              whileHover={{ y: -6 }}
              className="bg-card border border-border p-6 rounded-2xl shadow-sm transition-all flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="size-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                  <Layers className="size-5" />
                </div>
                <h3 className="text-lg font-bold text-foreground">Cô lập Tenant tuyệt đối</h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Thiết kế kiến trúc Multi-tenant chuẩn chỉnh, cách ly hoàn toàn dữ liệu ở tầng database và cache, ngăn chặn rò rỉ thông tin tối đa.
                </p>
              </div>
              <div className="pt-4 flex items-center gap-1 text-xs text-primary font-semibold">
                Độ trễ thấp
                <ChevronRight className="size-3" />
              </div>
            </motion.div>

            {/* Feature 2 */}
            <motion.div
              whileHover={{ y: -6 }}
              className="bg-card border border-border p-6 rounded-2xl shadow-sm transition-all flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="size-10 bg-green-500/10 rounded-xl flex items-center justify-center text-green-500">
                  <GitBranch className="size-5" />
                </div>
                <h3 className="text-lg font-bold text-foreground">Kanban Deal mượt mà</h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Kéo thả linh hoạt các cơ hội bán hàng giữa các cột giai đoạn bán hàng, phản hồi tức thời nhờ tích hợp công nghệ DnD-kit cao cấp.
                </p>
              </div>
              <div className="pt-4 flex items-center gap-1 text-xs text-green-600 font-semibold">
                Hiển thị trực quan
                <ChevronRight className="size-3" />
              </div>
            </motion.div>

            {/* Feature 3 */}
            <motion.div
              whileHover={{ y: -6 }}
              className="bg-card border border-border p-6 rounded-2xl shadow-sm transition-all flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="size-10 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-500">
                  <Bot className="size-5" />
                </div>
                <h3 className="text-lg font-bold text-foreground">AI Phân tích & Gợi ý</h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Tích hợp sâu OpenAI GPT-4o-mini & Groq Llama3 để phân tích thô biên bản cuộc họp, đề xuất tác vụ và tạo bản nháp email follow-up.
                </p>
              </div>
              <div className="pt-4 flex items-center gap-1 text-xs text-blue-500 font-semibold">
                Xử lý không đồng bộ
                <ChevronRight className="size-3" />
              </div>
            </motion.div>

            {/* Feature 4 */}
            <motion.div
              whileHover={{ y: -6 }}
              className="bg-card border border-border p-6 rounded-2xl shadow-sm transition-all flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="size-10 bg-purple-500/10 rounded-xl flex items-center justify-center text-purple-500">
                  <TrendingUp className="size-5" />
                </div>
                <h3 className="text-lg font-bold text-foreground">Báo cáo & Phân quyền</h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Phân quyền linh hoạt theo hành động và điều kiện (ABAC/RBAC). Dashboard báo cáo trực quan hiệu năng làm việc của đội ngũ sales.
                </p>
              </div>
              <div className="pt-4 flex items-center gap-1 text-xs text-purple-600 font-semibold">
                Theo dõi thời gian thực
                <ChevronRight className="size-3" />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── AI INTERACTIVE DEMO ────────────────────────────────────────── */}
      <section id="ai-demo" className="py-20 md:py-24 relative z-10">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left intro */}
            <div className="lg:col-span-5 space-y-6">
              <span className="text-xs font-bold text-primary uppercase tracking-widest bg-primary/10 px-3 py-1 rounded-full inline-flex items-center gap-1">
                <Bot className="size-3.5" />
                Trợ lý AI SalesFlow
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
                Tự động hóa tác vụ thô chỉ trong 1 nốt nhạc
              </h2>
              <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
                Rút ngắn thời gian ghi chép họp hành. Nhập ghi chú thô của buổi họp hoặc tóm tắt nhanh cuộc điện thoại, trợ lý AI sẽ tự động phân loại Deal, liệt kê danh sách công việc cần làm và soạn thư nháp chăm sóc khách hàng.
              </p>
              <div className="flex gap-4 pt-2">
                {aiStep === 0 || aiStep === 3 ? (
                  <Button
                    onClick={startAiSimulation}
                    className="bg-primary hover:bg-primary/95 text-white font-semibold rounded-xl px-5 py-5 flex items-center gap-2 cursor-pointer shadow-lg shadow-primary/10"
                  >
                    <Play className="size-4 fill-white" />
                    Chạy thử AI Demo
                  </Button>
                ) : null}
                {aiStep > 0 ? (
                  <Button
                    variant="outline"
                    onClick={resetAiSimulation}
                    className="border-border rounded-xl font-semibold px-4 cursor-pointer"
                  >
                    <RotateCcw className="size-4 mr-1.5" />
                    Đặt lại
                  </Button>
                ) : null}
              </div>
            </div>

            {/* Right Interactive Showcase */}
            <div className="lg:col-span-7">
              <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-xl min-h-[380px] flex flex-col">
                
                {/* Visual Header */}
                <div className="h-11 bg-muted shrink-0 border-b border-border px-4 flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground flex items-center gap-2">
                    <span className="size-2 rounded-full bg-primary animate-pulse" />
                    AI Action Items Generator
                  </span>
                  <div className="flex gap-1">
                    <span className="size-2.5 rounded-full bg-border" />
                    <span className="size-2.5 rounded-full bg-border" />
                  </div>
                </div>

                {/* Display Body */}
                <div className="flex-1 p-5 space-y-4 flex flex-col justify-between">
                  
                  {/* Step 0: Idle */}
                  {aiStep === 0 && (
                    <div className="flex-1 flex flex-col items-center justify-center text-center space-y-3 py-10">
                      <div className="size-16 rounded-full bg-primary/5 flex items-center justify-center text-primary/70 animate-bounce">
                        <Bot className="size-8" />
                      </div>
                      <p className="text-sm font-medium text-muted-foreground max-w-sm">
                        Nhấp vào nút <strong className="text-primary font-bold">Chạy thử AI Demo</strong> ở bên trái để xem cách AI tự động chuyển hóa ghi chú thô của nhân viên Sales.
                      </p>
                    </div>
                  )}

                  {/* Step 1: Typing Raw Info */}
                  {aiStep === 1 && (
                    <div className="space-y-2 flex-1">
                      <label className="text-xs font-bold text-muted-foreground uppercase">Ghi chú thô của cuộc gọi (Nhân viên nhập)</label>
                      <div className="bg-[#F8F8F7] dark:bg-background/40 border border-border p-4 rounded-xl text-xs sm:text-sm font-medium text-foreground min-h-[120px] font-mono leading-relaxed relative">
                        {typedText}
                        <span className="w-1.5 h-4.5 bg-primary inline-block ml-0.5 animate-ping absolute" />
                      </div>
                      <p className="text-[11px] text-muted-foreground animate-pulse">SalesFlow AI đang nhập tự động ghi chép thô...</p>
                    </div>
                  )}

                  {/* Step 2: Processing Spinner */}
                  {aiStep === 2 && (
                    <div className="flex-1 flex flex-col items-center justify-center text-center space-y-3 py-10">
                      <div className="relative">
                        <div className="size-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                        <Bot className="size-5 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">AI Đang phân tích dữ liệu...</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Trích xuất action items và soạn thảo email follow-up</p>
                      </div>
                    </div>
                  )}

                  {/* Step 3: Analysis Results */}
                  {aiStep === 3 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="space-y-4 flex-1"
                    >
                      {/* Deal suggestion alert */}
                      <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Sparkles className="size-4.5 text-primary" />
                          <span className="text-xs font-semibold text-foreground">Đề xuất Stage: <span className="text-primary font-bold">Negotiation (Đàm phán)</span></span>
                        </div>
                        <span className="text-[10px] bg-primary text-white px-2 py-0.5 rounded-full font-bold">Tự tin 95%</span>
                      </div>

                      {/* Extracted tasks checklist */}
                      <div className="space-y-2">
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Việc cần làm (Action Items)</p>
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2.5 bg-background border border-border p-2.5 rounded-lg text-xs sm:text-sm">
                            <CheckCircle2 className="size-4 text-green-500 shrink-0" />
                            <span className="font-semibold text-foreground">Soạn thảo & gửi hợp đồng Enterprise (12 users, 15tr/tháng)</span>
                          </div>
                          <div className="flex items-center gap-2.5 bg-background border border-border p-2.5 rounded-lg text-xs sm:text-sm">
                            <CheckCircle2 className="size-4 text-green-500 shrink-0" />
                            <span className="font-semibold text-foreground">Follow-up khách hàng để ký hợp đồng và thanh toán vào thứ Hai</span>
                          </div>
                        </div>
                      </div>

                      {/* Generated Email Draft */}
                      <div className="space-y-2">
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Bản nháp Email soạn bởi AI</p>
                        <div className="bg-[#F8F8F7] dark:bg-background/40 border border-border p-3.5 rounded-xl text-xs leading-relaxed font-sans text-muted-foreground relative">
                          <strong className="text-foreground block mb-1">Tiêu đề: SalesFlow - Đề xuất nâng cấp Enterprise & Hợp đồng dịch vụ</strong>
                          Chào anh Minh,<br />
                          Cảm ơn anh vì cuộc trao đổi hữu ích sáng nay. Như đã thống nhất, em gửi thông tin gói Enterprise cho 12 users với đơn giá ưu đãi 15tr/tháng. Em đính kèm dự thảo hợp đồng dưới đây để anh duyệt...
                        </div>
                      </div>
                    </motion.div>
                  )}

                </div>
              </div>
            </div>
            
          </div>
        </div>
      </section>

      {/* ── TECH STACK & ARCHITECTURE SECTION ──────────────────────────── */}
      <section id="architecture" className="bg-muted/40 py-20 md:py-24 border-y border-border/40 relative z-10 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-6">
          
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-16">
            <span className="text-xs font-bold text-primary uppercase tracking-widest bg-primary/10 px-3 py-1 rounded-full inline-flex items-center gap-1.5">
              <Cpu className="size-3.5" />
              Cơ sở kỹ thuật & Triển khai
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
              Kiến trúc hệ thống chuẩn doanh nghiệp
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base">
              Chúng tôi sử dụng mô hình client-server hiện đại kết hợp với kiến trúc xử lý tác vụ nền hàng đợi (Message Queue) hiệu năng cao.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* SVG Interactive Diagram (GSAP elements) */}
            <div className="lg:col-span-7 flex justify-center bg-card border border-border rounded-2xl p-6 shadow-sm overflow-hidden min-h-[380px] items-center relative">
              
              <svg
                ref={svgRef}
                width="100%"
                height="320"
                viewBox="0 0 540 320"
                fill="none"
                className="z-10"
              >
                {/* Gradient definitions */}
                <defs>
                  <linearGradient id="primary-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#534AB7" />
                    <stop offset="100%" stopColor="#818CF8" />
                  </linearGradient>
                </defs>

                {/* Connection Lines (Paths) */}
                {/* 1. Client -> Gateway */}
                <path
                  d="M100 160 L180 160"
                  stroke="#534AB7"
                  strokeWidth="2.5"
                  strokeDasharray="5,5"
                  className="flow-path"
                  strokeLinecap="round"
                />
                {/* 2. Gateway -> Queue */}
                <path
                  d="M260 140 Q330 80 400 80"
                  stroke="#818CF8"
                  strokeWidth="2"
                  strokeDasharray="5,5"
                  className="flow-path"
                  strokeLinecap="round"
                />
                {/* 3. Gateway -> Database */}
                <path
                  d="M260 180 Q330 240 400 240"
                  stroke="#10B981"
                  strokeWidth="2"
                  strokeDasharray="5,5"
                  className="flow-path"
                  strokeLinecap="round"
                />
                {/* 4. Queue -> AI Workers */}
                <path
                  d="M440 110 L440 210"
                  stroke="#EC4899"
                  strokeWidth="2"
                  strokeDasharray="5,5"
                  className="flow-path"
                  strokeLinecap="round"
                />

                {/* Nodes (Boxes) */}
                
                {/* NODE: Next.js Client */}
                <g className="arch-node cursor-pointer">
                  <rect x="15" y="125" width="85" height="70" rx="14" fill="var(--background)" stroke="#534AB7" strokeWidth="2" />
                  <text x="57" y="155" fill="var(--foreground)" fontSize="11" fontWeight="bold" textAnchor="middle">Next.js 16</text>
                  <text x="57" y="172" fill="var(--muted-foreground)" fontSize="9" textAnchor="middle">Frontend</text>
                  <circle cx="57" cy="115" r="4" fill="#534AB7" />
                </g>

                {/* NODE: NestJS Gateway */}
                <g className="arch-node cursor-pointer">
                  <rect x="180" y="125" width="85" height="70" rx="14" fill="var(--background)" stroke="url(#primary-grad)" strokeWidth="2" />
                  <text x="222" y="155" fill="var(--foreground)" fontSize="11" fontWeight="bold" textAnchor="middle">NestJS API</text>
                  <text x="222" y="172" fill="var(--muted-foreground)" fontSize="9" textAnchor="middle">Gateway</text>
                </g>

                {/* NODE: Redis Queue */}
                <g className="arch-node cursor-pointer">
                  <rect x="400" y="45" width="85" height="65" rx="14" fill="var(--background)" stroke="#EF4444" strokeWidth="2" />
                  <text x="442" y="75" fill="var(--foreground)" fontSize="11" fontWeight="bold" textAnchor="middle">Upstash Redis</text>
                  <text x="442" y="90" fill="var(--muted-foreground)" fontSize="9" textAnchor="middle">BullMQ Queue</text>
                </g>

                {/* NODE: AI Worker */}
                <g className="arch-node cursor-pointer">
                  <rect x="400" y="210" width="85" height="65" rx="14" fill="var(--background)" stroke="#EC4899" strokeWidth="2" />
                  <text x="442" y="238" fill="var(--foreground)" fontSize="11" fontWeight="bold" textAnchor="middle">AI Worker</text>
                  <text x="442" y="253" fill="var(--muted-foreground)" fontSize="9" textAnchor="middle">OpenAI / Groq</text>
                </g>

                {/* NODE: PostgreSQL Database */}
                <g className="arch-node cursor-pointer">
                  <rect x="290" y="225" width="85" height="65" rx="14" fill="var(--background)" stroke="#10B981" strokeWidth="2" />
                  <text x="332" y="255" fill="var(--foreground)" fontSize="11" fontWeight="bold" textAnchor="middle">RDS Postgres</text>
                  <text x="332" y="270" fill="var(--muted-foreground)" fontSize="9" textAnchor="middle">Tenant Isolation</text>
                </g>
              </svg>

              <div className="absolute bottom-4 right-4 bg-background/90 text-[10px] text-muted-foreground border border-border px-2.5 py-1 rounded-md">
                ⚡ Sơ đồ dữ liệu không đồng bộ
              </div>
            </div>

            {/* Right Tech Info */}
            <div className="lg:col-span-5 space-y-6">
              <h3 className="text-xl font-bold text-foreground">Hạ tầng mạng lưới tin cậy</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Chúng tôi thiết kế ứng dụng chạy trên nền tảng VPS cô lập hoặc cụm dịch vụ AWS (ECS + RDS). Sử dụng hàng đợi Redis kết hợp BullMQ giúp giảm tải tối đa cho luồng xử lý API chính khi chạy các lệnh phân tích trí tuệ nhân tạo (AI).
              </p>

              <ul className="space-y-3 pt-2">
                <li className="flex items-start gap-2.5 text-xs sm:text-sm">
                  <CheckCircle2 className="size-4.5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-foreground font-semibold">Bảo mật thông tin:</strong> Tự động phân tách dữ liệu theo tenantId thông qua Prisma query middleware mở rộng.
                  </div>
                </li>
                <li className="flex items-start gap-2.5 text-xs sm:text-sm">
                  <CheckCircle2 className="size-4.5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-foreground font-semibold">Tối ưu hóa chi phí:</strong> Sử dụng Upstash Serverless Redis bên ngoài VPC giúp linh hoạt thanh toán theo lượng sử dụng thực tế.
                  </div>
                </li>
                <li className="flex items-start gap-2.5 text-xs sm:text-sm">
                  <CheckCircle2 className="size-4.5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-foreground font-semibold">Tốc độ cao:</strong> Next.js deploy CDN Edge tối ưu hóa thời gian tải trang đầu tiên trên toàn cầu.
                  </div>
                </li>
              </ul>
            </div>

          </div>
        </div>
      </section>

      {/* ── CALL TO ACTION & FOOTER ────────────────────────────────────── */}
      <section className="relative z-10 py-20 bg-gradient-to-b from-transparent to-primary/5">
        <div className="max-w-4xl mx-auto px-6 text-center space-y-6">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            Bắt đầu số hóa quy trình kinh doanh của bạn ngay hôm nay
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto text-sm sm:text-base leading-relaxed">
            Tham gia cùng hàng trăm nhóm bán hàng SME đang sử dụng SalesFlow để tối ưu hóa quy trình, chăm sóc khách hàng và gia tăng tỷ lệ chốt deal vượt bậc.
          </p>
          <div className="pt-2 flex justify-center gap-4">
            {me ? (
              <Button
                onClick={() => router.push("/dashboard")}
                size="lg"
                className="bg-primary hover:bg-primary/95 text-white font-semibold rounded-2xl px-8 py-6 shadow-xl shadow-primary/10 cursor-pointer"
              >
                Vào Dashboard Quản trị
              </Button>
            ) : (
              <>
                <Button
                  onClick={() => router.push("/register")}
                  size="lg"
                  className="bg-primary hover:bg-primary/95 text-white font-semibold rounded-2xl px-8 py-6 shadow-xl shadow-primary/10 cursor-pointer"
                >
                  Đăng ký miễn phí
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.push("/login")}
                  size="lg"
                  className="border-border text-foreground hover:bg-muted font-semibold rounded-2xl px-8 py-6 cursor-pointer"
                >
                  Đăng nhập
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="max-w-7xl mx-auto px-6 pt-20 pb-8 mt-10 border-t border-border/40 text-center space-y-4">
          <div className="flex justify-center items-center gap-2 text-primary font-bold">
            <svg width="15" height="15" viewBox="0 0 13 13" fill="none">
              <path d="M2 10L6.5 3L11 10H2Z" fill="currentColor" />
            </svg>
            <span>SalesFlow CRM</span>
          </div>
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} SalesFlow. Phát triển dành cho SMEs Việt Nam. Bảo lưu mọi quyền.
          </p>
        </div>
      </section>

    </div>
  );
}
