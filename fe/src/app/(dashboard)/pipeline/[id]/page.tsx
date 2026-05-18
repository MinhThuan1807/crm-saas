"use client";
import { useState } from "react";
import {
  ArrowLeft,
  MoreHorizontal,
  Share2,
  Plus,
  Bell,
  Pencil,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { StageBadge } from "@/components/ui/StageBadge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { DealLeftPanel }  from "../_components/DealLeftPanel";
import { DealRightPanel } from "../_components/DealRightPanel";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDeleteDeal, useGetDealDetail } from "@/hooks/useDeals";
import { EditDealSheet } from "../_components/EditDealSheet";

export default function DealDetail() {
  const params = useParams();
  const id = params.id as string;

  const router = useRouter();
  
  const deal = useGetDealDetail(id).data;
  const deleteDeal = useDeleteDeal();

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const handleDelete = () => {
    if (deal) deleteDeal.mutate({ id, stage: deal.stage });
    router.push("/pipeline");
  };

  if (!deal) {
    return (
      <div className="flex items-center justify-center h-60">
        <p className="text-muted-foreground" style={{ fontSize: 14 }}>
          Không tìm thấy deal
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 min-w-0 overflow-hidden">

      {/* ── Top bar ─────────────────────────────────────────────────────── */}
      <header className="h-14 shrink-0 border-b bg-background flex items-center justify-between px-6 gap-3">

        {/* Left: back + breadcrumb */}
        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="icon"
            className="size-7 border-border text-muted-foreground hover:text-foreground shrink-0"
            asChild
          >
            <Link href="/pipeline">
              <ArrowLeft size={13} />
            </Link>
          </Button>

          <div className="flex items-center gap-1.5">
            <Link
              href="/pipeline"
              className="text-muted-foreground hover:text-foreground transition-colors"
              style={{ textDecoration: "none", fontSize: 13 }}
            >
              Pipeline
            </Link>
            <span className="text-muted-foreground/40" style={{ fontSize: 12 }}>/</span>
            <Link
              href={`/contacts/${deal?.contact.id ?? ""}`}
              className="text-muted-foreground hover:text-foreground transition-colors"
              style={{ textDecoration: "none", fontSize: 13 }}
            >
              {deal?.contact.name ?? "Ngân hàng JKL"}
            </Link>
            <span className="text-muted-foreground/40" style={{ fontSize: 12 }}>/</span>
            <span className="text-foreground" style={{ fontSize: 13, fontWeight: 500 }}>
              {deal?.title ?? "Security Audit Platform"}
            </span>
            <StageBadge stage={deal?.stage ?? "proposal"} className="ml-0.5" />
          </div>
        </div>

        {/* Right: action buttons */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 border-border text-muted-foreground hover:text-foreground text-xs"
          >
            <Bell size={12} />
            Theo dõi
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 border-border text-muted-foreground hover:text-foreground text-xs"
          >
            <Share2 size={12} />
            Chia sẻ
          </Button>

          <Button size="sm" className="h-8 gap-1.5 text-xs">
            <Plus size={13} />
            Thêm hoạt động
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="size-8 border-border text-muted-foreground hover:text-foreground"
              >
                <MoreHorizontal size={14} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem
                style={{ fontSize: 13 }}
                onClick={() => setEditOpen(true)}
              >
                <Pencil size={12} className="mr-2" />
                Chỉnh sửa deal
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                style={{ fontSize: 13 }}
                className="text-destructive focus:text-destructive"
                onClick={() => setDeleteOpen(true)}
              >
                <Trash2 size={12} className="mr-2" />
                Xóa deal
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* ── Split content ────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">
        <DealLeftPanel deal={deal} />
        <DealRightPanel />
      </div>

      {/* Edit sheet */}
      <EditDealSheet deal={deal} open={editOpen} onOpenChange={setEditOpen} />

      {/* Delete confirm */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle style={{ fontSize: 15 }}>Xóa deal này?</AlertDialogTitle>
            <AlertDialogDescription style={{ fontSize: 13 }}>
              Deal <strong>{deal?.title ?? "này"}</strong> sẽ bị xóa vĩnh viễn và không thể khôi phục.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel style={{ fontSize: 13 }}>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              style={{ fontSize: 13 }}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Xóa deal
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
