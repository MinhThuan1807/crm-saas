"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import logoImg from "@/app/icon.png";
import { useMe, useLogin } from "@/hooks/useAuth";
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
  RotateCcw,
  FileSpreadsheet,
  Settings,
  Lock,
  ArrowDown,
  ShieldAlert,
  FolderSync,
  History,
  Eye
} from "lucide-react";
import { Button } from "@/components/ui/button";
import TargetCursor from "@/components/TargetCursor";

const featuresData = [
  {
    icon: <Layers className="size-5" />,
    title: "Cô lập Tenant tuyệt đối",
    shortDesc: "Thiết kế kiến trúc Multi-tenant chuẩn chỉnh, cách ly hoàn toàn dữ liệu ở tầng database và cache, ngăn chặn rò rỉ thông tin tối đa.",
    color: "text-primary bg-primary/10",
    detailsTitle: "Kiến trúc Đa thuê bao Bảo mật cao",
    detailsDesc: "Mỗi doanh nghiệp đăng ký tài khoản được cấp một Workspace riêng biệt với mã định danh TenantID độc nhất. Dữ liệu của khách thuê được mã hóa và lọc an toàn ngay tại tầng Prisma ORM trước khi thực thi SQL, đảm bảo không bao giờ xảy ra rò rỉ dữ liệu chéo giữa các tổ chức.",
    demoContent: (
      <div className="border border-border rounded-xl p-4 bg-muted/30 font-mono text-[10px] space-y-2">
        <p className="text-green-600 font-bold">// SQL Query executed by Prisma extension:</p>
        <p className="text-foreground">SELECT * FROM "Contact" WHERE "tenantId" = 'tenant_company_abc';</p>
        <div className="h-px bg-border my-2" />
        <p className="text-red-500 font-bold">// Request from tenant XYZ trying to access ABC:</p>
        <p className="text-muted-foreground font-semibold">Error: ForbiddenException (Access denied - Dynamic isolation check failed)</p>
      </div>
    )
  },
  {
    icon: <GitBranch className="size-5" />,
    title: "Kanban Deal mượt mà",
    shortDesc: "Kéo thả linh hoạt các cơ hội bán hàng giữa các cột giai đoạn bán hàng, phản hồi tức thời nhờ tích hợp công nghệ DnD-kit cao cấp.",
    color: "text-green-500 bg-green-500/10",
    detailsTitle: "Bảng điều khiển Kanban Bán Hàng Trực Quan",
    detailsDesc: "Theo dõi và cập nhật trạng thái cơ hội bán hàng trong chớp mắt. Hệ thống được tối ưu hóa khả năng phản hồi kéo thả mượt mà với dnd-kit và đồng bộ cache tức thì với React Query, mang lại trải nghiệm không độ trễ.",
    demoContent: (
      <div className="grid grid-cols-3 gap-2 border border-border rounded-xl p-3 bg-muted/30 text-[10px]">
        <div className="bg-background border border-border p-2 rounded-lg text-center space-y-1">
          <span className="font-bold text-muted-foreground block border-b pb-1">Tiềm năng</span>
          <span className="bg-primary/10 text-primary px-1 rounded">5.0tr</span>
        </div>
        <div className="bg-background border-2 border-primary border-dashed p-2 rounded-lg text-center flex items-center justify-center text-primary font-bold">
          Drop here
        </div>
        <div className="bg-background border border-border p-2 rounded-lg text-center space-y-1">
          <span className="font-bold text-muted-foreground block border-b pb-1">Chốt thành công</span>
          <span className="bg-green-100 text-green-800 px-1 rounded">15.0tr</span>
        </div>
      </div>
    )
  },
  {
    icon: <Bot className="size-5" />,
    title: "AI Phân tích & Gợi ý",
    shortDesc: "Tích hợp sâu OpenAI GPT-4o-mini & Groq Llama3 để phân tích thô biên bản cuộc họp, đề xuất tác vụ và tạo bản nháp email follow-up.",
    color: "text-blue-500 bg-blue-500/10",
    detailsTitle: "Trợ lý Trí tuệ Nhân tạo Sales Helper",
    detailsDesc: "Bóc tách biên bản họp hoặc bản ghi âm thô chỉ trong vài giây. AI tự động lập danh sách các công việc cụ thể cần thực hiện kèm thời hạn hoàn thành và soạn thảo sẵn một email theo sát thương vụ mẫu bằng tiếng Việt.",
    demoContent: (
      <div className="border border-border rounded-xl p-3 bg-muted/30 text-[10px] space-y-2">
        <div className="bg-background p-2 rounded border border-border">
          <strong className="text-primary block">AI Extracted Action Items:</strong>
          <p className="mt-1">1. Gửi báo giá Enterprise trước thứ 5 (Due: 12/07)</p>
          <p>2. Gọi điện xác nhận số lượng user lúc 9h sáng</p>
        </div>
        <div className="bg-background p-2 rounded border border-border">
          <strong className="text-primary block">AI Drafted Email:</strong>
          <p className="mt-1 text-muted-foreground truncate">Chào anh Minh, em gửi dự thảo hợp đồng 12 users gói Enterprise...</p>
        </div>
      </div>
    )
  },
  {
    icon: <FileSpreadsheet className="size-5" />,
    title: "AI Excel Import",
    shortDesc: "Tải lên tệp Excel nạp dữ liệu khách hàng hàng loạt. AI tự động nhận diện và ánh xạ các tiêu đề cột thông minh, chính xác.",
    color: "text-purple-500 bg-purple-500/10",
    detailsTitle: "Nạp Dữ Liệu Tự Động Với AI Match",
    detailsDesc: "Giải phóng thời gian nhập liệu thủ công bằng cách tải lên file Excel thô. Công nghệ AI tự động nhận biết, ánh xạ và khớp các cột tùy chỉnh (ví dụ: 'Số phone', 'Hòm thư') vào các trường dữ liệu chuẩn tương ứng trong hệ thống CRM.",
    demoContent: (
      <div className="border border-border rounded-xl p-3 bg-muted/30 text-[10px] space-y-2">
        <div className="flex justify-between items-center bg-background p-1.5 border border-border rounded">
          <span>Cột trong file: "Email KH"</span>
          <span className="text-primary font-bold">→ email</span>
        </div>
        <div className="flex justify-between items-center bg-background p-1.5 border border-border rounded">
          <span>Cột trong file: "Tên công ty"</span>
          <span className="text-primary font-bold">→ companyName</span>
        </div>
      </div>
    )
  },
  {
    icon: <ShieldCheck className="size-5" />,
    title: "Dynamic RBAC & ABAC",
    shortDesc: "Phân quyền động theo vai trò (RBAC) kết hợp kiểm soát truy cập theo thuộc tính sở hữu dữ liệu (ABAC) bảo mật tối đa.",
    color: "text-teal-500 bg-teal-500/10",
    detailsTitle: "Kiến trúc Phân quyền Dynamic RBAC & ABAC",
    detailsDesc: "Kết hợp hoàn hảo giữa phân quyền vai trò (RBAC) linh hoạt thông qua Ma trận quyền hạn trực quan và kiểm soát truy cập chi tiết theo thuộc tính sở hữu tài nguyên (ABAC). Toàn bộ luật được cache trên Redis giúp tăng tốc độ phản hồi API tức thì.",
    demoContent: (
      <div className="border border-border rounded-xl p-3 bg-muted/30 text-[10px] space-y-1.5">
        <div className="flex justify-between items-center bg-background p-1.5 border border-border rounded">
          <span className="font-bold text-foreground">RBAC (Admin/Manager/Sales)</span>
          <span className="text-green-600 font-bold">Ma trận vai trò động</span>
        </div>
        <div className="flex justify-between items-center bg-background p-1.5 border border-border rounded">
          <span className="font-bold text-foreground">ABAC (ownerId = user.id)</span>
          <span className="text-primary font-bold">Chỉ thao tác dữ liệu tự sở hữu</span>
        </div>
      </div>
    )
  },
  {
    icon: <History className="size-5" />,
    title: "Nhật ký Hoạt động (Audit Logs)",
    shortDesc: "Tự động lưu lại mọi thao tác thêm, sửa, xóa dữ liệu Deal và Khách hàng kèm chi tiết giá trị trước/sau. Tăng tính minh bạch.",
    color: "text-orange-500 bg-orange-500/10",
    detailsTitle: "Nhật Ký Hệ Thống Giám Sát Chống Gian Lận",
    detailsDesc: "Bảo vệ thông tin tổ chức bằng cách tự động ghi chép toàn bộ hoạt động cập nhật hay xóa bỏ dữ liệu Deal, Khách hàng. Admin/Manager có thể đối chiếu giá trị cũ/mới để khôi phục nhanh thông tin bị nhầm lẫn.",
    demoContent: (
      <div className="border border-border rounded-xl p-3 bg-muted/30 text-[9px] space-y-1.5 font-mono">
        <div className="flex justify-between border-b pb-1 font-bold">
          <span>Trường</span>
          <span>Giá trị cũ</span>
          <span>Giá trị mới</span>
        </div>
        <div className="flex justify-between text-red-500">
          <span>stage</span>
          <span>PROSPECT</span>
          <span className="text-green-600 font-bold">PROPOSAL</span>
        </div>
        <div className="flex justify-between text-red-500">
          <span>value</span>
          <span>10,000,000đ</span>
          <span className="text-green-600 font-bold">12,500,000đ</span>
        </div>
      </div>
    )
  }
];

// Magnetic wrapper component for premium tactile feel
function Magnetic({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const { clientX, clientY } = e;
    const { left, top, width, height } = ref.current.getBoundingClientRect();
    const centerX = left + width / 2;
    const centerY = top + height / 2;
    const distanceX = clientX - centerX;
    const distanceY = clientY - centerY;
    setPosition({ x: distanceX * 0.35, y: distanceY * 0.35 });
  };

  const handleMouseLeave = () => {
    setPosition({ x: 0, y: 0 });
  };

  const { x, y } = position;

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      animate={{ x, y }}
      transition={{ type: "spring", stiffness: 150, damping: 15, mass: 0.1 }}
      className="inline-block"
    >
      {children}
    </motion.div>
  );
}

export default function LandingPage() {
  const router = useRouter();
  const { data: me } = useMe();
  const { mutate: login, isPending: isLoggingIn } = useLogin();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [demoDropdownOpen, setDemoDropdownOpen] = useState(false);

  // AI Simulation Tab State
  const [activeDemoTab, setActiveDemoTab] = useState<"notes" | "excel">("notes");

  // 1. AI Meeting Notes State
  const [aiNotesStep, setAiNotesStep] = useState(0); // 0: Idle, 1: Typing Raw, 2: Analyzing, 3: Completed
  const [typedNotesText, setTypedNotesText] = useState("");
  const rawNotesTranscript = "Cuộc gọi với anh Minh công ty ABC lúc 10h sáng. Anh ấy muốn nâng cấp lên gói Enterprise cho 12 users, báo giá chiết khấu 15tr/tháng. Deal này rất tiềm năng, anh ấy hẹn thứ Hai tuần sau gửi hợp đồng để ký kết và thanh toán.";
  const typingNotesTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 2. AI Excel Mapping State
  const [aiExcelStep, setAiExcelStep] = useState(0); // 0: Idle, 1: Scanning, 2: Mapping, 3: Completed
  const [excelMappingProgress, setExcelMappingProgress] = useState(0);

  // 3. Dynamic Roles Matrix State
  const [selectedMatrixRole, setSelectedMatrixRole] = useState<"ADMIN" | "MANAGER" | "SALES_REP">("SALES_REP");

  // 4. Audit Logs Mock State
  const [selectedMockLog, setSelectedMockLog] = useState<number>(0);
  const mockAuditLogs = [
    {
      id: "log-1",
      time: "10:14:02 - Hôm nay",
      user: "Nguyễn Văn A",
      role: "Sales Rep",
      action: "UPDATE",
      targetType: "DEAL",
      targetName: "Hợp đồng VinaTech",
      changes: {
        stage: { old: "PROPOSAL", new: "CLOSED_WON" },
        value: { old: "12,500,000đ", new: "15,000,000đ" },
        updatedAt: { old: "2026-07-09T17:00:00Z", new: "2026-07-10T03:14:02Z" }
      }
    },
    {
      id: "log-2",
      time: "09:45:18 - Hôm nay",
      user: "Trần Thị B",
      role: "Manager",
      action: "DELETE",
      targetType: "CONTACT",
      targetName: "Lê Minh C (VinaTech)",
      changes: {
        deleted: { old: "false", new: "true" },
        deletedBy: { old: "null", new: "Trần Thị B" }
      }
    },
    {
      id: "log-3",
      time: "17:30:00 - Hôm qua",
      user: "Phạm Văn D",
      role: "Sales Rep",
      action: "CREATE",
      targetType: "DEAL",
      targetName: "Dự án ABC Group",
      changes: {
        title: { old: "N/A", new: "Dự án ABC Group" },
        value: { old: "0đ", new: "8,500,000đ" },
        stage: { old: "N/A", new: "PROSPECT" }
      }
    }
  ];

  // SVG lines ref for GSAP animation
  const excelLinesSvgRef = useRef<SVGSVGElement | null>(null);

  // Perspective tilt effect for Hero Mockup
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  
  // Transform values for 3D card tilt
  const rotateX = useTransform(y, [-300, 300], [15, -15]);
  const rotateY = useTransform(x, [-300, 300], [-15, 15]);

  // 5. Hero Section Mockup Animation State
  const [heroAnimStep, setHeroAnimStep] = useState<"negotiation" | "sliding" | "won">("negotiation");
  const [heroKpiValue, setHeroKpiValue] = useState<number>(12.5);
  const [particles, setParticles] = useState<{ id: number; x: number; y: number; color: string }[]>([]);

  // 6. Active Feature Card Index for Expandable Cards
  const [activeFeatureIndex, setActiveFeatureIndex] = useState<number | null>(null);

  // 7. Custom cursor coordinates and proximity snap state
  const [mousePos, setMousePos] = useState({ x: -100, y: -100 });
  const [nearestCardIndex, setNearestCardIndex] = useState<number | null>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (!mounted) return;

    const handleGlobalMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });

      let nearestIndex: number | null = null;
      let minDistance = 220; // snap distance threshold

      cardRefs.current.forEach((ref, idx) => {
        if (!ref) return;
        const rect = ref.getBoundingClientRect();
        const cardX = rect.left + rect.width / 2;
        const cardY = rect.top + rect.height / 2;
        const distance = Math.hypot(e.clientX - cardX, e.clientY - cardY);

        if (distance < minDistance) {
          minDistance = distance;
          nearestIndex = idx;
        }
      });

      setNearestCardIndex(nearestIndex);
    };

    window.addEventListener("mousemove", handleGlobalMouseMove);
    return () => window.removeEventListener("mousemove", handleGlobalMouseMove);
  }, [mounted]);

  const triggerParticles = () => {
    const colors = ["#8B5CF6", "#F59E0B", "#10B981", "#3B82F6", "#EC4899"];
    const newParticles = Array.from({ length: 25 }).map((_, i) => ({
      id: Date.now() + i,
      x: (Math.random() - 0.5) * 120, // wider spread
      y: (Math.random() - 0.5) * 120,
      color: colors[Math.floor(Math.random() * colors.length)]
    }));
    setParticles(newParticles);
    setTimeout(() => setParticles([]), 1500);
  };

  const handleDemoLogin = (role: "ADMIN" | "MANAGER" | "SALES") => {
    if (role === "ADMIN") {
      login({ email: "admin@abc.com", password: "Password123!" });
    } else if (role === "MANAGER") {
      login({ email: "manager@abc.com", password: "Password123!" });
    } else {
      login({ email: "sales@abc.com", password: "Password123!" });
    }
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    const interval = setInterval(() => {
      // 1. Start sliding from Negotiation to Won
      setHeroAnimStep("sliding");
      
      // 2. Lands in Won column after 1.2 seconds
      setTimeout(() => {
        setHeroAnimStep("won");
        
        // Trigger counter
        let start = 12.5;
        const end = 27.5;
        const duration = 1000; // ms
        const steps = 20;
        const stepTime = duration / steps;
        const increment = (end - start) / steps;
        
        let currentStep = 0;
        const counterInterval = setInterval(() => {
          currentStep++;
          start += increment;
          setHeroKpiValue(Number(start.toFixed(1)));
          if (currentStep >= steps) {
            clearInterval(counterInterval);
            setHeroKpiValue(end);
          }
        }, stepTime);

        // Spawn particles
        triggerParticles();
      }, 1200);

      // 3. Reset back to Negotiation column after 4.5 seconds
      setTimeout(() => {
        setHeroAnimStep("negotiation");
        setHeroKpiValue(12.5);
      }, 4500);

    }, 6000);

    return () => clearInterval(interval);
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

  // AI Interactive Notes Simulator Actions
  const startAiNotesSimulation = () => {
    if (typingNotesTimerRef.current) clearInterval(typingNotesTimerRef.current);
    setTypedNotesText("");
    setAiNotesStep(1);

    let charIndex = 0;
    typingNotesTimerRef.current = setInterval(() => {
      if (charIndex < rawNotesTranscript.length) {
        setTypedNotesText((prev) => prev + rawNotesTranscript.charAt(charIndex));
        charIndex++;
      } else {
        if (typingNotesTimerRef.current) clearInterval(typingNotesTimerRef.current);
        setAiNotesStep(2);
        // Simulate progress timer
        setTimeout(() => {
          setAiNotesStep(3);
        }, 1800);
      }
    }, 20);
  };

  const resetAiNotesSimulation = () => {
    if (typingNotesTimerRef.current) clearInterval(typingNotesTimerRef.current);
    setTypedNotesText("");
    setAiNotesStep(0);
  };

  // AI Excel Mapping Simulator Actions
  const startAiExcelSimulation = () => {
    setAiExcelStep(1);
    setExcelMappingProgress(0);
    
    // Simulate reading headers
    setTimeout(() => {
      setAiExcelStep(2);
      // Animate progress bar
      let progress = 0;
      const progressInterval = setInterval(() => {
        progress += 10;
        setExcelMappingProgress(progress);
        if (progress >= 100) {
          clearInterval(progressInterval);
          // Wait briefly then show mapping done
          setTimeout(() => {
            setAiExcelStep(3);
            // Draw matching lines using GSAP
            setTimeout(() => {
              const lines = excelLinesSvgRef.current?.querySelectorAll(".mapping-line");
              if (lines) {
                lines.forEach((line) => {
                  gsap.fromTo(line, { strokeDashoffset: 100 }, { strokeDashoffset: 0, duration: 1.2, ease: "power2.out" });
                });
              }
            }, 100);
          }, 400);
        }
      }, 150);
    }, 1200);
  };

  const resetAiExcelSimulation = () => {
    setAiExcelStep(0);
    setExcelMappingProgress(0);
  };

  // Framer Motion scroll animation config
  const revealVariants = {
    hidden: { opacity: 0, y: 35 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" as const } }
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/30 font-sans transition-colors duration-300">
      
      <TargetCursor 
        targetSelector=".cursor-target" 
        excludeSelector=".no-custom-cursor"
        cursorColor="var(--primary)" 
        cursorColorOnTarget="var(--primary)"
        parallaxOn={true}
      />
      
      {/* ── BACKGROUND ORNAMENT ────────────────────────────────────────── */}
      <div className="absolute top-0 left-0 right-0 h-[600px] bg-gradient-to-b from-primary/10 via-transparent to-transparent pointer-events-none z-0" />
      <div className="absolute top-[8%] left-[4%] w-[380px] h-[380px] bg-primary/20 rounded-full blur-[140px] pointer-events-none z-0 dark:bg-primary/12" />
      <div className="absolute top-[35%] right-[8%] w-[320px] h-[320px] bg-indigo-500/10 rounded-full blur-[110px] pointer-events-none z-0 dark:bg-indigo-500/6" />

      {/* ── HEADER / NAVBAR ────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 w-full backdrop-blur-md bg-background/80 border-b border-border/40 transition-all">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <Image
              src={logoImg}
              alt="salesFlow"
              width={32}
              height={32}
              unoptimized
              className="rounded-lg shadow-md group-hover:scale-105 transition-transform duration-300 shrink-0"
            />
            <span className="text-lg font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground via-foreground to-primary/80 pr-1.5">
              SalesFlow
            </span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="cursor-target text-sm text-muted-foreground hover:text-foreground transition-colors font-medium">Tính năng</a>
            <a href="#ai-demo" className="cursor-target text-sm text-muted-foreground hover:text-foreground transition-colors font-medium">Trải nghiệm AI</a>
            <a href="#roles-matrix" className="cursor-target text-sm text-muted-foreground hover:text-foreground transition-colors font-medium">Phân quyền</a>
            <a href="#audit-logs" className="cursor-target text-sm text-muted-foreground hover:text-foreground transition-colors font-medium">Nhật ký hoạt động</a>
          </div>

          <div className="hidden md:flex items-center gap-3">
            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="rounded-xl hover:bg-muted cursor-target"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              {theme === "dark" ? <Sun className="size-4.5 text-yellow-500" /> : <Moon className="size-4.5 text-slate-700" />}
            </Button>

            {me ? (
              <Button
                onClick={() => router.push("/dashboard")}
                className="bg-primary hover:bg-primary/95 text-white font-medium rounded-xl px-5 shadow-lg shadow-primary/15 flex items-center gap-2 group cursor-pointer cursor-target"
              >
                Vào Dashboard
                <ArrowRight className="size-4 group-hover:translate-x-0.5 transition-transform" />
              </Button>
            ) : (
              <>
                <Button
                  variant="ghost"
                  onClick={() => router.push("/login")}
                  className="text-foreground hover:bg-muted rounded-xl font-medium px-4 cursor-pointer cursor-target"
                >
                  Đăng nhập
                </Button>
                <Button
                  onClick={() => router.push("/register")}
                  className="bg-primary hover:bg-primary/95 text-white font-medium rounded-xl px-5 shadow-lg shadow-primary/15 cursor-pointer cursor-target"
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
              className="rounded-xl cursor-target"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              {theme === "dark" ? <Sun className="size-4.5 text-yellow-500" /> : <Moon className="size-4.5 text-slate-700" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-xl cursor-target"
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
              <a href="#features" onClick={() => setMobileMenuOpen(false)} className="text-sm font-medium py-1.5 text-muted-foreground hover:text-foreground border-b border-border/40">Tính năng</a>
              <a href="#ai-demo" onClick={() => setMobileMenuOpen(false)} className="text-sm font-medium py-1.5 text-muted-foreground hover:text-foreground border-b border-border/40">Trải nghiệm AI</a>
              <a href="#roles-matrix" onClick={() => setMobileMenuOpen(false)} className="text-sm font-medium py-1.5 text-muted-foreground hover:text-foreground border-b border-border/40">Phân quyền</a>
              <a href="#audit-logs" onClick={() => setMobileMenuOpen(false)} className="text-sm font-medium py-1.5 text-muted-foreground hover:text-foreground border-b border-border/40">Nhật ký hoạt động</a>
              <div className="flex flex-col gap-2 pt-2">
                {me ? (
                  <Button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      router.push("/dashboard");
                    }}
                    className="w-full bg-primary hover:bg-primary/95 text-white font-medium rounded-xl cursor-target"
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
                      className="w-full border-border rounded-xl font-medium cursor-target"
                    >
                      Đăng nhập
                    </Button>
                    <Button
                      onClick={() => {
                        setMobileMenuOpen(false);
                        router.push("/register");
                      }}
                      className="w-full bg-primary hover:bg-primary/95 text-white font-medium rounded-xl cursor-target"
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
      <section id="hero-section" className="relative z-10 max-w-7xl mx-auto px-6 pt-16 pb-20 md:pt-20 md:pb-28 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        
        {/* Left column info */}
        <div className="lg:col-span-6 space-y-6 text-center lg:text-left">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary/10 rounded-full border border-primary/20"
          >
            <Sparkles className="size-3.5 text-primary" />
            <span className="text-xs font-semibold text-primary uppercase tracking-wide">CRM Multi-Tenant SaaS v2.0</span>
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="cursor-target text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-[1.1] text-foreground"
          >
            Giải pháp Quản lý Khách hàng <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-indigo-600 dark:from-primary dark:to-indigo-400">Thông minh</span> thế hệ mới
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="cursor-target text-base sm:text-lg text-muted-foreground max-w-xl mx-auto lg:mx-0 font-normal leading-relaxed"
          >
            Tăng tốc doanh số bán hàng cho các doanh nghiệp vừa và nhỏ (SME) với giao diện Kanban trực quan, bảo mật cô lập đa khách thuê và trợ lý AI phân tích ghi chú thông minh. Tích hợp nạp dữ liệu tự động bằng AI Mapping Import và Nhật ký hoạt động (Audit Logs) giúp bảo vệ tài sản doanh nghiệp.
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
                className="bg-primary hover:bg-primary/95 text-white text-base font-semibold rounded-2xl px-8 py-6 shadow-xl shadow-primary/20 flex items-center gap-2 group cursor-pointer cursor-target"
              >
                Truy cập hệ thống quản trị
                <ArrowRight className="size-5 group-hover:translate-x-1 transition-transform duration-300" />
              </Button>
            ) : (
              <>
                <Button
                  onClick={() => router.push("/register")}
                  size="lg"
                  className="bg-primary hover:bg-primary/95 text-white text-base font-semibold rounded-2xl px-8 py-6 shadow-xl shadow-primary/20 cursor-pointer cursor-target"
                >
                  Bắt đầu dùng thử
                </Button>
                <div
                  className="relative"
                  onMouseEnter={() => setDemoDropdownOpen(true)}
                  onMouseLeave={() => setDemoDropdownOpen(false)}
                >
                  <Button
                    variant="outline"
                    onClick={() => handleDemoLogin("ADMIN")}
                    disabled={isLoggingIn}
                    size="lg"
                    className="border-border text-foreground hover:bg-muted text-base font-semibold rounded-2xl px-8 py-6 cursor-pointer flex items-center gap-2 cursor-target"
                  >
                    {isLoggingIn ? "Đang kết nối..." : "Xem Demo tài khoản"}
                  </Button>

                  <AnimatePresence>
                    {demoDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute left-0 mt-2 w-72 bg-card border border-border rounded-2xl p-2.5 shadow-2xl z-50 flex flex-col gap-1 text-left"
                      >
                        <div className="px-2.5 py-1.5 border-b border-border/60 mb-1">
                          <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Chọn tài khoản thử nghiệm</p>
                        </div>
                        
                        <button
                          onClick={() => handleDemoLogin("ADMIN")}
                          className="w-full text-left p-2 hover:bg-muted/60 rounded-xl transition-colors flex items-start gap-2.5 group/item cursor-pointer cursor-target"
                        >
                          <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0 group-hover/item:bg-primary group-hover/item:text-white transition-colors">
                            <ShieldCheck className="size-4.5" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold text-foreground">Admin Account</span>
                              <span className="text-[9px] font-mono px-1 py-0.2 bg-primary/10 text-primary border border-primary/20 rounded">Full</span>
                            </div>
                            <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">Toàn quyền quản trị, xem logs, cấu hình phân quyền.</p>
                          </div>
                        </button>

                        <button
                          onClick={() => handleDemoLogin("MANAGER")}
                          className="w-full text-left p-2 hover:bg-muted/60 rounded-xl transition-colors flex items-start gap-2.5 group/item cursor-pointer cursor-target"
                        >
                          <div className="size-8 rounded-lg bg-green-500/10 flex items-center justify-center text-green-500 shrink-0 group-hover/item:bg-green-500 group-hover/item:text-white transition-colors">
                            <Users className="size-4.5" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold text-foreground">Manager Account</span>
                              <span className="text-[9px] font-mono px-1 py-0.2 bg-green-500/10 text-green-600 border border-green-200 rounded">Lead</span>
                            </div>
                            <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">Quản lý cơ hội bán hàng, giao dịch của đội ngũ.</p>
                          </div>
                        </button>

                        <button
                          onClick={() => handleDemoLogin("SALES")}
                          className="w-full text-left p-2 hover:bg-muted/60 rounded-xl transition-colors flex items-start gap-2.5 group/item cursor-pointer cursor-target"
                        >
                          <div className="size-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500 shrink-0 group-hover/item:bg-blue-500 group-hover/item:text-white transition-colors">
                            <GitBranch className="size-4.5" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold text-foreground">Sales Rep Account</span>
                              <span className="text-[9px] font-mono px-1 py-0.2 bg-blue-500/10 text-blue-600 border border-blue-200 rounded">ABAC</span>
                            </div>
                            <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">Chỉ xem/sửa dữ liệu tự sở hữu. Chặn xem logs.</p>
                          </div>
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            )
            }
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
                  <div className="text-[10px] font-bold text-primary bg-primary/10 border border-primary/20 rounded-md px-2.5 py-0.5 flex items-center gap-1 font-mono">
                    <span>MRR:</span>
                    <span className="tabular-nums">{heroKpiValue}tr</span>
                  </div>
                </div>

                {/* Body mock contents (Kanban board layout) */}
                <div className="flex-1 p-3 grid grid-cols-3 gap-2 bg-[#F8F8F7] dark:bg-background/40 relative overflow-hidden">
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
                      <span className="text-[10px] font-semibold text-primary uppercase">Đàm phán ({heroAnimStep === "won" ? 0 : 1})</span>
                      <span className="size-4 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[9px] font-semibold">{heroAnimStep === "won" ? 0 : 1}</span>
                    </div>
                    {/* Simulated dragging card */}
                    <motion.div
                      animate={
                        heroAnimStep === "negotiation"
                          ? { x: 0, y: 0, scale: 1.02 }
                          : { x: 145, y: 70, scale: 0.95 }
                      }
                      transition={{
                        type: "spring",
                        stiffness: 70,
                        damping: 15,
                      }}
                      className="bg-card border-2 border-primary/50 rounded-lg p-2 space-y-1.5 shadow-md relative z-20"
                    >
                      <p className="text-[11px] font-semibold truncate text-foreground flex items-center gap-1">
                        <Sparkles className="size-3 text-primary shrink-0 animate-pulse" />
                        Gói Enterprise Minh
                      </p>
                      <div className="flex justify-between items-center text-[9px] text-primary font-bold">
                        <span>15.0tr/tháng</span>
                        <span className="text-[8px] bg-primary text-white px-1.5 py-0.5 rounded-full font-semibold font-mono">AI Match</span>
                      </div>
                    </motion.div>
                  </div>

                  {/* Column 3 */}
                  <div className="space-y-2 relative">
                    <div className="flex justify-between items-center px-1">
                      <span className="text-[10px] font-semibold text-muted-foreground uppercase">Thành công ({heroAnimStep === "won" ? 5 : 4})</span>
                      <span className="size-4 rounded-full bg-muted flex items-center justify-center text-[9px] font-semibold">{heroAnimStep === "won" ? 5 : 4}</span>
                    </div>
                    <div className="bg-card border border-border rounded-lg p-2 opacity-60 space-y-1 shadow-xs">
                      <p className="text-[11px] font-semibold truncate text-foreground">Triển khai VinaTech</p>
                      <span className="text-[9px] text-green-600 font-medium">Done</span>
                    </div>
                  </div>

                  {/* Particles animation layer */}
                  {particles.map((p) => (
                    <motion.div
                      key={p.id}
                      initial={{ x: 330, y: 120, scale: 0, opacity: 1 }}
                      animate={{
                        x: 330 + p.x,
                        y: 120 + p.y,
                        scale: Math.random() * 1.5 + 0.5,
                        opacity: 0,
                      }}
                      transition={{ duration: 1.2, ease: "easeOut" }}
                      className="absolute w-1.5 h-1.5 rounded-full pointer-events-none z-30"
                      style={{ backgroundColor: p.color }}
                    />
                  ))}
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
                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">AI Auto-Map</p>
                  <p className="text-xs font-semibold text-foreground truncate mt-0.5">So khớp cột Excel</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── CORE FEATURES SHOWCASE (Scroll Reveal) ────────────────────── */}
      <motion.section
        id="features"
        variants={revealVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        className="bg-muted/40 py-20 md:py-24 border-y border-border/40 relative z-10 transition-colors duration-300"
      >
        <div className="max-w-7xl mx-auto px-6">
          
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-16">
            <span className="text-xs font-bold text-primary uppercase tracking-widest bg-primary/10 px-3 py-1 rounded-full">Tính năng cốt lõi</span>
            <h2 className="cursor-target text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground mt-2">
              Giải quyết mọi nỗi đau của các SME bán hàng
            </h2>
            <p className="cursor-target text-muted-foreground text-sm sm:text-base">
              Chúng tôi tối ưu hóa quy trình nghiệp vụ và áp dụng công nghệ tự động hóa AI nâng cao nhằm giúp doanh nghiệp của bạn vượt trội.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuresData.map((feat, index) => {
              const isNearest = nearestCardIndex === index;
              return (
                <motion.div
                  key={feat.title}
                  ref={(el) => { cardRefs.current[index] = el; }}
                  layoutId={`feature-card-${index}`}
                  onClick={() => setActiveFeatureIndex(index)}
                  animate={{
                    scale: isNearest ? 1.05 : 1,
                    y: isNearest ? -8 : 0,
                    boxShadow: isNearest 
                      ? "0 20px 25px -5px rgb(0 0 0 / 0.15), 0 8px 10px -6px rgb(0 0 0 / 0.15)" 
                      : "0 1px 3px 0 rgb(0 0 0 / 0.05), 0 1px 2px -1px rgb(0 0 0 / 0.05)"
                  }}
                  transition={{ type: "spring", stiffness: 150, damping: 18 }}
                  className="bg-card border border-border p-6 rounded-2xl flex flex-col justify-between cursor-pointer group origin-center transition-colors duration-300 cursor-target"
                >
                  <div className="space-y-4">
                    <div className={`size-10 rounded-xl flex items-center justify-center ${feat.color}`}>
                      {feat.icon}
                    </div>
                    <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                      {feat.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                      {feat.shortDesc}
                    </p>
                  </div>
                  <div className="pt-4 flex items-center gap-1 text-xs text-primary font-semibold">
                    Xem chi tiết
                    <ChevronRight className="size-3 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </motion.section>

      {/* ── AI INTERACTIVE DEMO (2 TABS - Notes vs Excel Mapping) ───────── */}
      <motion.section
        id="ai-demo"
        variants={revealVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        className="py-20 md:py-24 relative z-10"
      >
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left intro */}
            <div className="lg:col-span-5 space-y-6">
              <span className="text-xs font-bold text-primary uppercase tracking-widest bg-primary/10 px-3 py-1 rounded-full inline-flex items-center gap-1">
                <Bot className="size-3.5" />
                Trợ lý AI SalesFlow
              </span>
              <h2 className="cursor-target text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
                Động cơ Tự động hóa tích hợp Trí tuệ Nhân tạo
              </h2>
              <p className="cursor-target text-muted-foreground text-sm sm:text-base leading-relaxed">
                Chúng tôi cung cấp các công cụ AI đột phá để loại bỏ các thao tác thủ công phức tạp nhất trong quy trình quản trị khách hàng. Hãy chọn và trải nghiệm các tính năng AI dưới đây:
              </p>

              {/* Tab Selector Buttons */}
              <div className="bg-muted p-1 rounded-xl flex gap-1 border border-border/60 max-w-sm">
                <button
                  onClick={() => {
                    setActiveDemoTab("notes");
                    resetAiNotesSimulation();
                    resetAiExcelSimulation();
                  }}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-target cursor-pointer ${
                    activeDemoTab === "notes"
                      ? "bg-background text-primary shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  AI Phân Tích Ghi Chú
                </button>
                <button
                  onClick={() => {
                    setActiveDemoTab("excel");
                    resetAiNotesSimulation();
                    resetAiExcelSimulation();
                  }}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-target cursor-pointer ${
                    activeDemoTab === "excel"
                      ? "bg-background text-primary shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  AI Excel Mapping (AI Match)
                </button>
              </div>

              {/* Action Buttons based on Tab */}
              <div className="flex gap-4 pt-2">
                {activeDemoTab === "notes" ? (
                  <>
                    {(aiNotesStep === 0 || aiNotesStep === 3) && (
                      <Button
                        onClick={startAiNotesSimulation}
                        className="bg-primary hover:bg-primary/95 text-white font-semibold rounded-xl px-5 py-5 flex items-center gap-2 cursor-pointer shadow-lg shadow-primary/10 cursor-target"
                      >
                        <Play className="size-4 fill-white" />
                        Chạy thử phân tích cuộc gọi
                      </Button>
                    )}
                    {aiNotesStep > 0 && (
                      <Button
                        variant="outline"
                        onClick={resetAiNotesSimulation}
                        className="border-border rounded-xl font-semibold px-4 cursor-pointer cursor-target"
                      >
                        <RotateCcw className="size-4 mr-1.5" />
                        Đặt lại
                      </Button>
                    )}
                  </>
                ) : (
                  <>
                    {(aiExcelStep === 0 || aiExcelStep === 3) && (
                      <Button
                        onClick={startAiExcelSimulation}
                        className="bg-primary hover:bg-primary/95 text-white font-semibold rounded-xl px-5 py-5 flex items-center gap-2 cursor-pointer shadow-lg shadow-primary/10 cursor-target"
                      >
                        <Play className="size-4 fill-white" />
                        Chạy thử AI Match cột Excel
                      </Button>
                    )}
                    {aiExcelStep > 0 && (
                      <Button
                        variant="outline"
                        onClick={resetAiExcelSimulation}
                        className="border-border rounded-xl font-semibold px-4 cursor-pointer cursor-target"
                      >
                        <RotateCcw className="size-4 mr-1.5" />
                        Đặt lại
                      </Button>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Right Interactive Showcase */}
            <div className="lg:col-span-7">
              <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-xl min-h-[420px] flex flex-col">
                
                {/* Visual Header */}
                <div className="h-11 bg-muted shrink-0 border-b border-border px-4 flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground flex items-center gap-2 font-mono">
                    <span className="size-2 rounded-full bg-primary animate-pulse" />
                    {activeDemoTab === "notes" ? "AI Meeting Notes Analyzer" : "AI Spreadsheet Column Matcher"}
                  </span>
                  <div className="flex gap-1.5">
                    <span className="size-2.5 rounded-full bg-border" />
                    <span className="size-2.5 rounded-full bg-border" />
                  </div>
                </div>

                {/* Display Body */}
                <div className="flex-1 p-5 space-y-4 flex flex-col justify-between">
                  
                  {/* ───────────────── TAB 1: NOTES SHOWCASE ───────────────── */}
                  {activeDemoTab === "notes" && (
                    <>
                      {/* Step 0: Idle */}
                      {aiNotesStep === 0 && (
                        <div className="flex-1 flex flex-col items-center justify-center text-center space-y-3 py-10">
                          <div className="size-16 rounded-full bg-primary/5 flex items-center justify-center text-primary/70 animate-bounce">
                            <Bot className="size-8" />
                          </div>
                          <p className="text-sm font-medium text-muted-foreground max-w-sm">
                            Nhấp vào nút <strong className="text-primary font-bold">Chạy thử phân tích cuộc gọi</strong> để xem AI bóc tách thông tin từ đoạn ghi chú thô của Sales.
                          </p>
                        </div>
                      )}

                      {/* Step 1: Typing Raw Info */}
                      {aiNotesStep === 1 && (
                        <div className="space-y-2 flex-1">
                          <label className="text-xs font-bold text-muted-foreground uppercase">Ghi chép cuộc gọi thô</label>
                          <div className="bg-[#F8F8F7] dark:bg-background/40 border border-border p-4 rounded-xl text-xs sm:text-sm font-medium text-foreground min-h-[140px] font-mono leading-relaxed relative">
                            {typedNotesText}
                            <span className="w-1.5 h-4.5 bg-primary inline-block ml-0.5 animate-ping absolute" />
                          </div>
                          <p className="text-[11px] text-muted-foreground animate-pulse">SalesFlow AI đang gõ tự động văn bản thô...</p>
                        </div>
                      )}

                      {/* Step 2: Processing Spinner */}
                      {aiNotesStep === 2 && (
                        <div className="flex-1 flex flex-col items-center justify-center text-center space-y-3 py-10">
                          <div className="relative">
                            <div className="size-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                            <Bot className="size-5 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-foreground">AI Đang phân tích ghi chú...</p>
                            <p className="text-xs text-muted-foreground mt-0.5 font-mono">Model: GPT-4o-mini / Llama-3.3-70b</p>
                          </div>
                        </div>
                      )}

                      {/* Step 3: Analysis Results */}
                      {aiNotesStep === 3 && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="space-y-4 flex-1"
                        >
                          <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Sparkles className="size-4.5 text-primary" />
                              <span className="text-xs font-semibold text-foreground">Đề xuất Stage: <span className="text-primary font-bold">Negotiation (Đàm phán)</span></span>
                            </div>
                            <span className="text-[10px] bg-primary text-white px-2 py-0.5 rounded-full font-bold font-mono">Tự tin 95%</span>
                          </div>

                          <div className="space-y-2">
                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Tác vụ bóc tách (Action Items)</p>
                            <div className="space-y-1.5">
                              <div className="flex items-center gap-2.5 bg-background border border-border p-2.5 rounded-lg text-xs">
                                <CheckCircle2 className="size-4 text-green-500 shrink-0" />
                                <span className="font-semibold text-foreground">Soạn thảo & gửi hợp đồng Enterprise (12 users, 15tr/tháng)</span>
                              </div>
                              <div className="flex items-center gap-2.5 bg-background border border-border p-2.5 rounded-lg text-xs">
                                <CheckCircle2 className="size-4 text-green-500 shrink-0" />
                                <span className="font-semibold text-foreground">Follow-up khách hàng để ký hợp đồng và thanh toán vào thứ Hai tuần sau</span>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Thư nháp đề xuất</p>
                            <div className="bg-[#F8F8F7] dark:bg-background/40 border border-border p-3.5 rounded-xl text-[11px] leading-relaxed text-muted-foreground font-sans">
                              <strong className="text-foreground block mb-0.5">Tiêu đề: SalesFlow - Đề xuất nâng cấp Enterprise & Dự thảo hợp đồng</strong>
                              Chào anh Minh, Cảm ơn anh đã dành thời gian trao đổi. Em gửi kèm dự thảo hợp đồng Enterprise cho 12 users ưu đãi 15tr/tháng để anh duyệt...
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </>
                  )}

                  {/* ───────────────── TAB 2: EXCEL SHOWCASE ───────────────── */}
                  {activeDemoTab === "excel" && (
                    <>
                      {/* Step 0: Idle */}
                      {aiExcelStep === 0 && (
                        <div className="flex-1 flex flex-col items-center justify-center text-center space-y-3 py-10">
                          <div className="size-16 rounded-full bg-green-500/5 flex items-center justify-center text-green-600 animate-bounce">
                            <FileSpreadsheet className="size-8" />
                          </div>
                          <p className="text-sm font-medium text-muted-foreground max-w-sm">
                            Nhấp vào nút <strong className="text-primary font-bold">Chạy thử AI Match cột Excel</strong> để xem AI phân tích tiêu đề cột tùy chỉnh từ file Excel thô của khách hàng.
                          </p>
                        </div>
                      )}

                      {/* Step 1: Scanning / Reading */}
                      {aiExcelStep === 1 && (
                        <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4 py-8">
                          <div className="flex gap-2">
                            <motion.div animate={{ y: [-5, 5, -5] }} transition={{ repeat: -1, duration: 1 }} className="size-8 bg-green-500/10 rounded-lg flex items-center justify-center text-green-600"><FileSpreadsheet className="size-5" /></motion.div>
                            <motion.div animate={{ y: [5, -5, 5] }} transition={{ repeat: -1, duration: 1 }} className="size-8 bg-primary/10 rounded-lg flex items-center justify-center text-primary"><FolderSync className="size-5 animate-spin" /></motion.div>
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-foreground">Đang tải tệp Excel lên...</p>
                            <p className="text-xs text-muted-foreground mt-0.5 font-mono">Đang đọc các cột: "Họ tên KH", "Hòm thư", "Số điện thoại", "Dự án"...</p>
                          </div>
                        </div>
                      )}

                      {/* Step 2: Mapping columns with progress */}
                      {aiExcelStep === 2 && (
                        <div className="flex-1 flex flex-col items-center justify-center space-y-4 py-8 px-6">
                          <div className="w-full bg-muted rounded-full h-2 overflow-hidden border border-border">
                            <motion.div
                              className="bg-primary h-full"
                              initial={{ width: 0 }}
                              animate={{ width: `${excelMappingProgress}%` }}
                              transition={{ duration: 0.1 }}
                            />
                          </div>
                          <div className="text-center">
                            <p className="text-sm font-semibold text-foreground">Trợ lý AI đang ánh xạ tự động...</p>
                            <p className="text-xs text-muted-foreground mt-0.5 font-mono">Gọi contactsService.aiMapColumns() [ Tiến trình: {excelMappingProgress}% ]</p>
                          </div>
                        </div>
                      )}

                      {/* Step 3: Excel Mapping Results Visual GSAP */}
                      {aiExcelStep === 3 && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="flex-1 flex flex-col justify-between"
                        >
                          <div className="bg-green-500/5 border border-green-500/20 rounded-xl p-3 flex items-center justify-between text-xs mb-2">
                            <span className="font-semibold text-green-700 dark:text-green-400 flex items-center gap-1.5">
                              <Sparkles className="size-4 text-green-500 animate-pulse" />
                              Tự động ánh xạ thành công 6 cột (Độ chính xác cao)
                            </span>
                            <span className="text-[10px] bg-green-500 text-white px-2 py-0.5 rounded-full font-bold">AI Match 100%</span>
                          </div>

                          {/* Graphical mapping connection matrix */}
                          <div className="grid grid-cols-12 gap-2 py-2 items-center relative">
                            {/* SVG Connection Lines Overlay */}
                            <div className="absolute inset-0 pointer-events-none z-0">
                              <svg ref={excelLinesSvgRef} className="w-full h-full" viewBox="0 0 460 140" fill="none">
                                {/* Connectors */}
                                <path d="M140 15 L320 15" stroke="#534AB7" strokeWidth="1.5" strokeDasharray="3,3" strokeDashoffset="100" className="mapping-line" />
                                <path d="M140 45 L320 45" stroke="#534AB7" strokeWidth="1.5" strokeDasharray="3,3" strokeDashoffset="100" className="mapping-line" />
                                <path d="M140 75 L320 75" stroke="#534AB7" strokeWidth="1.5" strokeDasharray="3,3" strokeDashoffset="100" className="mapping-line" />
                                <path d="M140 105 L320 105" stroke="#534AB7" strokeWidth="1.5" strokeDasharray="3,3" strokeDashoffset="100" className="mapping-line" />
                              </svg>
                            </div>

                            {/* Left Side: Raw File Headers */}
                            <div className="col-span-5 space-y-2 z-10">
                              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider pl-1">Cột trong File của bạn</p>
                              <div className="bg-background border border-border rounded-lg p-1.5 text-xs text-foreground font-semibold font-mono truncate shadow-xs">Họ tên KH</div>
                              <div className="bg-background border border-border rounded-lg p-1.5 text-xs text-foreground font-semibold font-mono truncate shadow-xs">Hòm thư</div>
                              <div className="bg-background border border-border rounded-lg p-1.5 text-xs text-foreground font-semibold font-mono truncate shadow-xs">Số phone</div>
                              <div className="bg-background border border-border rounded-lg p-1.5 text-xs text-foreground font-semibold font-mono truncate shadow-xs">Dự án quan tâm</div>
                            </div>

                            {/* Center separator label */}
                            <div className="col-span-2 flex flex-col justify-center items-center gap-6">
                              <div className="text-[8px] font-bold text-primary bg-primary/10 rounded px-1 py-0.5">Match</div>
                              <div className="text-[8px] font-bold text-primary bg-primary/10 rounded px-1 py-0.5">Match</div>
                              <div className="text-[8px] font-bold text-primary bg-primary/10 rounded px-1 py-0.5">Match</div>
                              <div className="text-[8px] font-bold text-primary bg-primary/10 rounded px-1 py-0.5">Match</div>
                            </div>

                            {/* Right Side: System Database fields */}
                            <div className="col-span-5 space-y-2 z-10">
                              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider pl-1 text-right">Trường chuẩn hệ thống</p>
                              <div className="bg-primary/5 border border-primary/20 text-primary rounded-lg p-1.5 text-xs font-bold text-right font-mono truncate shadow-xs">name (Bắt buộc)</div>
                              <div className="bg-primary/5 border border-primary/20 text-primary rounded-lg p-1.5 text-xs font-bold text-right font-mono truncate shadow-xs">email</div>
                              <div className="bg-primary/5 border border-primary/20 text-primary rounded-lg p-1.5 text-xs font-bold text-right font-mono truncate shadow-xs">phone</div>
                              <div className="bg-primary/5 border border-primary/20 text-primary rounded-lg p-1.5 text-xs font-bold text-right font-mono truncate shadow-xs">dealTitle</div>
                            </div>
                          </div>

                          <div className="bg-muted p-2 rounded-lg text-center mt-2">
                            <span className="text-[10px] text-muted-foreground">Ấn nút "Xác nhận Import" sẽ kích hoạt logic ghi nhận trùng lặp, gán Owner và tự động lưu vào DB.</span>
                          </div>
                        </motion.div>
                      )}
                    </>
                  )}

                </div>
              </div>
            </div>
            
          </div>
        </div>
      </motion.section>

      {/* ── NEW SECTION: WORKSPACE ROLES & ABAC PERMISSIONS MATRIX ──────── */}
      <motion.section
        id="roles-matrix"
        variants={revealVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        className="bg-muted/40 py-20 md:py-24 border-y border-border/40 relative z-10 transition-colors duration-300"
      >
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Column Interactive Table Mock */}
            <div className="lg:col-span-7 bg-card border border-border rounded-2xl p-5 shadow-lg overflow-hidden flex flex-col justify-between min-h-[380px]">
              
              <div className="space-y-4">
                {/* Title inside card */}
                <div className="flex items-center justify-between border-b border-border/60 pb-3">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="size-5 text-primary" />
                    <span className="text-sm font-bold text-foreground">Bảng Quyền Hạn: 
                      <span className="text-primary font-extrabold ml-1">
                        {selectedMatrixRole === "ADMIN" ? "Quản Trị Viên (ADMIN)" : selectedMatrixRole === "MANAGER" ? "Quản Lý (MANAGER)" : "Nhân viên Sales (SALES_REP)"}
                      </span>
                    </span>
                  </div>
                  
                  {/* Selector in header */}
                  <div className="flex bg-muted p-0.5 rounded-lg border border-border text-[10px] font-bold">
                    <button
                      onClick={() => setSelectedMatrixRole("ADMIN")}
                      className={`px-2 py-1 rounded cursor-target cursor-pointer ${selectedMatrixRole === "ADMIN" ? "bg-background text-primary" : "text-muted-foreground"}`}
                    >
                      ADMIN
                    </button>
                    <button
                      onClick={() => setSelectedMatrixRole("MANAGER")}
                      className={`px-2 py-1 rounded cursor-target cursor-pointer ${selectedMatrixRole === "MANAGER" ? "bg-background text-primary" : "text-muted-foreground"}`}
                    >
                      MANAGER
                    </button>
                    <button
                      onClick={() => setSelectedMatrixRole("SALES_REP")}
                      className={`px-2 py-1 rounded cursor-target cursor-pointer ${selectedMatrixRole === "SALES_REP" ? "bg-background text-primary" : "text-muted-foreground"}`}
                    >
                      SALES_REP
                    </button>
                  </div>
                </div>

                {/* Matrix table mock */}
                <div className="border border-border/60 rounded-xl overflow-hidden bg-background">
                  <table className="w-full text-left border-collapse text-[11px] sm:text-xs">
                    <thead>
                      <tr className="border-b border-border bg-muted/50 font-semibold text-muted-foreground">
                        <th className="p-2.5 pl-4">Tài nguyên</th>
                        <th className="p-2.5 text-center">Xem</th>
                        <th className="p-2.5 text-center">Thêm</th>
                        <th className="p-2.5 text-center">Sửa</th>
                        <th className="p-2.5 text-center">Xóa</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40 font-medium">
                      {/* Contacts Row */}
                      <tr className="hover:bg-muted/10 transition-colors">
                        <td className="p-2.5 pl-4 font-bold text-foreground">Khách Hàng (Contact)</td>
                        <td className="p-2.5 text-center">{selectedMatrixRole === "ADMIN" || selectedMatrixRole === "MANAGER" ? "✅" : <span title="Chỉ xem dữ liệu sở hữu">🔒 ✅</span>}</td>
                        <td className="p-2.5 text-center">✅</td>
                        <td className="p-2.5 text-center">{selectedMatrixRole === "ADMIN" || selectedMatrixRole === "MANAGER" ? "✅" : <span title="Chỉ sửa dữ liệu sở hữu">🔒 ✅</span>}</td>
                        <td className="p-2.5 text-center">{selectedMatrixRole === "ADMIN" ? "✅" : selectedMatrixRole === "MANAGER" ? "✅" : <span title="Chỉ xóa dữ liệu sở hữu">🔒 ✅</span>}</td>
                      </tr>
                      {/* Deals Row */}
                      <tr className="hover:bg-muted/10 transition-colors">
                        <td className="p-2.5 pl-4 font-bold text-foreground">Cơ Hội Bán Hàng (Deal)</td>
                        <td className="p-2.5 text-center">{selectedMatrixRole === "ADMIN" || selectedMatrixRole === "MANAGER" ? "✅" : <span title="Chỉ xem deal sở hữu">🔒 ✅</span>}</td>
                        <td className="p-2.5 text-center">✅</td>
                        <td className="p-2.5 text-center">{selectedMatrixRole === "ADMIN" || selectedMatrixRole === "MANAGER" ? "✅" : <span title="Chỉ sửa deal sở hữu">🔒 ✅</span>}</td>
                        <td className="p-2.5 text-center">{selectedMatrixRole === "ADMIN" ? "✅" : selectedMatrixRole === "MANAGER" ? "✅" : <span title="Chỉ xóa deal sở hữu">🔒 ✅</span>}</td>
                      </tr>
                      {/* Tasks Row */}
                      <tr className="hover:bg-muted/10 transition-colors">
                        <td className="p-2.5 pl-4 font-bold text-foreground">Công Việc (Task)</td>
                        <td className="p-2.5 text-center">{selectedMatrixRole === "ADMIN" || selectedMatrixRole === "MANAGER" ? "✅" : <span title="Chỉ xem tác vụ sở hữu">🔒 ✅</span>}</td>
                        <td className="p-2.5 text-center">✅</td>
                        <td className="p-2.5 text-center">{selectedMatrixRole === "ADMIN" || selectedMatrixRole === "MANAGER" ? "✅" : <span title="Chỉ sửa tác vụ sở hữu">🔒 ✅</span>}</td>
                        <td className="p-2.5 text-center">{selectedMatrixRole === "ADMIN" ? "✅" : selectedMatrixRole === "MANAGER" ? "✅" : <span title="Chỉ xóa tác vụ sở hữu">🔒 ✅</span>}</td>
                      </tr>
                      {/* Users Row */}
                      <tr className="hover:bg-muted/10 transition-colors">
                        <td className="p-2.5 pl-4 font-bold text-foreground">Thành Viên (User)</td>
                        <td className="p-2.5 text-center">{selectedMatrixRole === "ADMIN" || selectedMatrixRole === "MANAGER" ? "✅" : "❌"}</td>
                        <td className="p-2.5 text-center">{selectedMatrixRole === "ADMIN" ? "✅" : "❌"}</td>
                        <td className="p-2.5 text-center">{selectedMatrixRole === "ADMIN" ? "✅" : "❌"}</td>
                        <td className="p-2.5 text-center">{selectedMatrixRole === "ADMIN" ? "✅" : "❌"}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Explanatory notes */}
              <div className="bg-primary/5 border border-primary/20 p-2.5 rounded-xl flex items-start gap-2 text-[10px] text-muted-foreground mt-3">
                <Lock className="size-3.5 text-primary shrink-0 mt-0.5 animate-pulse" />
                <div>
                  <strong className="text-foreground">Ký hiệu 🔒 biểu trưng cho ABAC (Attribute-Based Access Control):</strong> Hệ thống sẽ tự động ghép bộ lọc an toàn vào SQL thông qua Prisma để người dùng chỉ được quyền thao tác trên các bản ghi mà họ là người sở hữu trực tiếp.
                </div>
              </div>
            </div>

            {/* Right column intro info */}
            <div className="lg:col-span-5 space-y-6">
              <span className="text-xs font-bold text-primary uppercase tracking-widest bg-primary/10 px-3 py-1 rounded-full inline-flex items-center gap-1.5">
                <ShieldCheck className="size-3.5" />
                Kiểm Soát Quyền Chuyên Sâu
              </span>
              <h2 className="cursor-target text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
                Quản trị vai trò động & Bảo mật cấp dòng
              </h2>
              <p className="cursor-target text-muted-foreground text-sm sm:text-base leading-relaxed">
                Đảm bảo an toàn thông tin tối đa cho tổ chức của bạn. Hệ thống nâng cấp toàn diện từ phân quyền vai trò tĩnh truyền thống sang phân quyền động linh hoạt thông qua Giao diện Bảng Ma trận trực quan.
              </p>
              
              <ul className="space-y-3 pt-2">
                <li className="flex items-start gap-2.5 text-xs sm:text-sm cursor-target">
                  <CheckCircle2 className="size-4.5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <strong className=" text-foreground font-semibold">Tạo vai trò tùy biến:</strong> Dễ dàng bổ sung vai trò mới (ví dụ: Cộng tác viên, Hỗ trợ kỹ thuật) và phân quyền chi tiết.
                  </div>
                </li>
                <li className="flex items-start gap-2.5 text-xs sm:text-sm cursor-target">
                  <CheckCircle2 className="size-4.5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-foreground font-semibold">Lọc dữ liệu thông minh (ABAC):</strong> Nhân viên Sales chỉ nhìn thấy và chăm sóc khách hàng của chính họ, ngăn rò rỉ cơ hội bán hàng chéo.
                  </div>
                </li>
                <li className="flex items-start gap-2.5 text-xs sm:text-sm cursor-target">
                  <CheckCircle2 className="size-4.5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-foreground font-semibold">Tốc độ tức thì với Redis:</strong> Quyền hạn của User được cache trên bộ nhớ đệm giúp các lượt gọi API kiểm tra quyền không bị chậm trễ.
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </motion.section>

      {/* ── AUDIT LOGS & SECURITY SECTION ──────────────────────────── */}
      <motion.section
        id="audit-logs"
        variants={revealVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        className="py-20 md:py-24 relative z-10 transition-colors duration-300"
      >
        <div className="max-w-7xl mx-auto px-6">
          
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-12">
            <span className="text-xs font-bold text-primary uppercase tracking-widest bg-primary/10 px-3 py-1 rounded-full inline-flex items-center gap-1.5">
              <History className="size-3.5" />
              An toàn & Bảo mật thông tin
            </span>
            <h2 className="cursor-target text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
              Giám sát Hoạt động & Nhật ký Thay đổi (Audit Logs)
            </h2>
            <p className="cursor-target text-muted-foreground text-sm sm:text-base">
              Mọi thay đổi dữ liệu nhạy cảm (Deal, Khách hàng) đều được lưu vết tự động. Giúp bạn chủ động kiểm soát quy trình và chống thất thoát tài nguyên doanh nghiệp.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            
            {/* Left column: Mock Audit Log Viewer */}
            <div className="lg:col-span-7 bg-card border border-border rounded-2xl p-5 shadow-lg flex flex-col justify-between min-h-[420px]">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-border/60 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="size-2.5 rounded-full bg-primary animate-pulse" />
                    <span className="text-xs font-bold text-foreground font-mono">WORKSPACE_AUDIT_LOGS</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground font-semibold">Chế độ giả lập tương tác</span>
                </div>

                {/* Log Row Items */}
                <div className="space-y-2">
                  {mockAuditLogs.map((log, index) => (
                    <div
                      key={log.id}
                      onClick={() => setSelectedMockLog(index)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer text-left ${
                        selectedMockLog === index
                          ? "bg-primary/5 border-primary/40 shadow-xs"
                          : "bg-background border-border/40 hover:bg-muted/40"
                      }`}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <p className="text-xs font-bold text-foreground">{log.user}</p>
                          <p className="text-[10px] text-muted-foreground font-medium mt-0.5">{log.time} · {log.role}</p>
                        </div>
                        <div className="flex gap-1.5 items-center">
                          <span className={`text-[9px] font-bold px-2 py-0.5 border rounded-full ${
                            log.action === "CREATE"
                              ? "bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800"
                              : log.action === "UPDATE"
                              ? "bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800"
                              : "bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800"
                          }`}>
                            {log.action}
                          </span>
                          <span className="text-[9px] font-semibold text-[#534AB7] dark:text-primary font-mono">{log.targetType}</span>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2 truncate">
                        Tác động lên: <strong className="text-foreground font-semibold">{log.targetName}</strong>
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Dynamic diff viewer for selected log */}
              <div className="mt-4 bg-muted/40 border border-border/60 rounded-xl p-3.5 text-xs">
                <p className="font-bold text-foreground mb-2 flex items-center gap-1.5">
                  <Eye className="size-3.5 text-primary" />
                  Chi tiết thay đổi của {mockAuditLogs[selectedMockLog].user}
                </p>
                <div className="border border-border/60 rounded-lg overflow-hidden bg-background">
                  <table className="w-full text-left border-collapse text-[11px]">
                    <thead>
                      <tr className="border-b border-border bg-muted/50 font-semibold text-muted-foreground">
                        <th className="p-2">Trường dữ liệu</th>
                        <th className="p-2">Trước thay đổi (Old)</th>
                        <th className="p-2">Sau thay đổi (New)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40 font-medium">
                      {Object.entries(mockAuditLogs[selectedMockLog].changes).map(([field, val]) => (
                        <tr key={field} className="hover:bg-muted/10 transition-colors">
                          <td className="p-2 text-primary font-mono font-semibold">{field}</td>
                          <td className="p-2 text-red-500 line-through bg-red-50/20 dark:bg-red-950/10 font-mono">{val.old}</td>
                          <td className="p-2 text-green-600 font-bold bg-green-50/20 dark:bg-green-950/10 font-mono">{val.new}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Right column: Benefits list */}
            <div className="lg:col-span-5 flex flex-col justify-center space-y-6">
              <div className="space-y-2">
                <span className="text-xs font-bold text-primary uppercase tracking-widest bg-primary/10 px-3 py-1 rounded-full">
                  Tính năng nâng cao
                </span>
                <h3 className="cursor-target text-2xl font-bold text-foreground">
                  Vì sao doanh nghiệp cần Nhật ký hành động?
                </h3>
                <p className="cursor-target text-muted-foreground text-sm leading-relaxed">
                  Trong một đội ngũ bán hàng năng động, dữ liệu khách hàng và các deals thay đổi liên tục. Audit Logs giúp người quản lý nắm bắt rõ tiến trình và bảo vệ tài sản số của công ty.
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex gap-3 cursor-target">
                  <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0 mt-0.5">
                    <CheckCircle2 className="size-4.5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-foreground">Lưu vết lịch sử tự động</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      Mọi hành động tạo mới, cập nhật giá trị deal hoặc xóa khách hàng đều được hệ thống backend ghi nhận tức thì, không thể can thiệp hay xóa bỏ.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 cursor-target">
                  <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0 mt-0.5">
                    <CheckCircle2 className="size-4.5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-foreground">Chi tiết so sánh Old/New</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      Không chỉ ghi nhận hành động, hệ thống còn lưu trữ sự khác biệt của từng trường thông tin giúp dễ dàng khôi phục khi phát sinh nhầm lẫn.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 cursor-target">
                  <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0 mt-0.5">
                    <CheckCircle2 className="size-4.5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-foreground">Kiểm soát truy cập (RBAC)</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      Chỉ có các vai trò quản trị viên như ADMIN và MANAGER mới có thể xem Audit Logs toàn bộ workspace để đảm bảo tính riêng tư của nhân viên.
                    </p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </motion.section>

      {/* ── CALL TO ACTION & FOOTER ────────────────────────────────────── */}
      <section className="relative z-10 py-20 bg-gradient-to-b from-transparent to-primary/5">
        <div className="max-w-4xl mx-auto px-6 text-center space-y-6">
          <h2 className="cursor-target text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            Bắt đầu số hóa quy trình kinh doanh của bạn ngay hôm nay
          </h2>
          <p className="cursor-target text-muted-foreground max-w-xl mx-auto text-sm sm:text-base leading-relaxed">
            Tham gia cùng hàng trăm nhóm bán hàng SME đang sử dụng SalesFlow để tối ưu hóa quy trình, chăm sóc khách hàng và gia tăng tỷ lệ chốt deal vượt bậc.
          </p>
          <div className="pt-2 flex justify-center gap-4">
            {me ? (
              <Button
                onClick={() => router.push("/dashboard")}
                size="lg"
                className="bg-primary hover:bg-primary/95 text-white font-semibold rounded-2xl px-8 py-6 shadow-xl shadow-primary/10 cursor-target"
              >
                Vào Dashboard Quản trị
              </Button>
            ) : (
              <>
                <Button
                  onClick={() => router.push("/register")}
                  size="lg"
                  className="bg-primary hover:bg-primary/95 text-white font-semibold rounded-2xl px-8 py-6 shadow-xl shadow-primary/10 cursor-pointer cursor-target"
                >
                  Đăng ký miễn phí
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.push("/login")}
                  size="lg"
                  className="border-border text-foreground hover:bg-muted font-semibold rounded-2xl px-8 py-6 cursor-target"
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
            <Image
              src={logoImg}
              alt="salesFlow"
              width={16}
              height={16}
              unoptimized
              className="rounded shrink-0"
            />
            <span>SalesFlow CRM</span>
          </div>
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} SalesFlow. Phát triển dành cho SMEs Việt Nam. Bảo lưu mọi quyền.
          </p>
        </div>
      </section>

      {/* ── EXPANDABLE DETAIL MODAL ────────────────────────────────────── */}
      <AnimatePresence>
        {activeFeatureIndex !== null && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveFeatureIndex(null)}
              className="absolute inset-0 bg-zinc-950 backdrop-blur-xs cursor-pointer"
            />
            
            {/* Modal Card */}
            <motion.div
              layoutId={`feature-card-${activeFeatureIndex}`}
              className="bg-card border border-border rounded-3xl p-6 md:p-8 w-full max-w-xl shadow-2xl relative z-10 overflow-hidden flex flex-col justify-between"
              style={{ maxHeight: "90vh" }}
            >
              <button
                onClick={() => setActiveFeatureIndex(null)}
                className="absolute right-4 top-4 text-muted-foreground hover:text-foreground hover:bg-muted p-1.5 rounded-full transition-colors cursor-pointer cursor-target"
              >
                <X className="size-5" />
              </button>

              <div className="space-y-6 flex-1 overflow-y-auto pr-1">
                <div className="flex items-center gap-3">
                  <div className={`size-11 rounded-xl flex items-center justify-center ${featuresData[activeFeatureIndex].color}`}>
                    {featuresData[activeFeatureIndex].icon}
                  </div>
                  <h3 className="text-xl md:text-2xl font-extrabold text-foreground">
                    {featuresData[activeFeatureIndex].detailsTitle}
                  </h3>
                </div>

                <p className="text-sm md:text-base text-muted-foreground leading-relaxed font-normal">
                  {featuresData[activeFeatureIndex].detailsDesc}
                </p>

                <div className="space-y-2">
                  <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">Mô phỏng tính năng thực tế</span>
                  {featuresData[activeFeatureIndex].demoContent}
                </div>
              </div>

              <div className="pt-6 border-t border-border mt-6 flex justify-end">
                <Button
                  onClick={() => setActiveFeatureIndex(null)}
                  className="bg-primary hover:bg-primary/95 text-white font-bold rounded-xl px-6 cursor-pointer cursor-target"
                >
                  Đóng
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
