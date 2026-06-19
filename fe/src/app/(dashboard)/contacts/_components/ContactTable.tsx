import { useEffect, useRef, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Eye, Pencil, Plus, Users } from "lucide-react";
import Link from "next/link";
import { Button } from "../../../../components/ui/button";
import { getInitials, relativeTime } from "@/lib/helper";
import {
  Contact,
  GetContactWithDealsActivitiesResType,
} from "@/lib/validations/contacts.scheme";
interface ContactTableProps {
  contacts: GetContactWithDealsActivitiesResType[];
  onDirect: (id: string) => void;
  isPending?: boolean;
  onEdit: (contact: Contact) => void;
  onAdd?: () => void;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  fetchNextPage?: () => void;
}

const TABLE_COLUMNS = [
  "Liên hệ",
  "Công ty",
  "Email",
  "Số điện thoại",
  "Tags",
  "Deals",
  "Giá trị",
  "Ngày tạo",
  "Hoạt động cuối",
  "",
] as const;

function ContactTableSkeleton() {
  return (
    <>
      <Table className="min-w-[1200px]">
        <TableHeader>
          <TableRow className="hover:bg-transparent border-b border-border/60">
            {TABLE_COLUMNS.map((col, idx) => (
              <TableHead
                key={idx}
                className="px-4 py-3 text-muted-foreground uppercase"
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: "0.04em",
                }}
              >
                {col}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>

        <TableBody>
          {Array.from({ length: 8 }).map((_, idx) => (
            <TableRow
              key={`skeleton-${idx}`}
              className="border-b border-border/40"
            >
              <TableCell className="px-4 py-3">
                <div className="flex items-center gap-2.5">
                  <Skeleton className="size-8 rounded-full shrink-0" />
                  <div className="space-y-1.5">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-2.5 w-20" />
                  </div>
                </div>
              </TableCell>
              <TableCell className="px-4 py-3">
                <Skeleton className="h-3 w-20" />
              </TableCell>
              <TableCell className="px-4 py-3">
                <Skeleton className="h-3 w-32" />
              </TableCell>
              <TableCell className="px-4 py-3">
                <Skeleton className="h-3 w-24" />
              </TableCell>
              <TableCell className="px-4 py-3">
                <Skeleton className="h-5 w-16 rounded-full" />
              </TableCell>
              <TableCell className="px-4 py-3">
                <Skeleton className="h-3 w-12" />
              </TableCell>
              <TableCell className="px-4 py-3">
                <Skeleton className="h-3 w-20" />
              </TableCell>
              <TableCell className="px-4 py-3">
                <Skeleton className="h-3 w-14" />
              </TableCell>
              <TableCell className="px-4 py-3">
                <Skeleton className="h-3 w-16" />
              </TableCell>
              <TableCell className="px-3 py-3">
                <Skeleton className="h-7 w-14" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div
        className="px-4 py-0.5 border-t border-border/40 flex items-center gap-1.5 text-muted-foreground"
        style={{ fontSize: 12 }}
      >
        <div className="flex items-center gap-1.5 min-w-20">
          <Users size={12} className="shrink-0" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
    </>
  );
}

function EmptyIllustration() {
  return (
    <svg
      width="80"
      height="80"
      viewBox="0 0 80 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Card background */}
      <rect x="10" y="16" width="60" height="50" rx="8" fill="#EEEDFE" />
      {/* Card shine */}
      <rect
        x="10"
        y="16"
        width="60"
        height="50"
        rx="8"
        fill="url(#card-grad)"
        opacity="0.4"
      />
      {/* Avatar circle */}
      <circle cx="40" cy="35" r="11" fill="#C7C3F4" />
      {/* Head */}
      <circle cx="40" cy="32" r="5" fill="#534AB7" />
      {/* Shoulders */}
      <path
        d="M29 47c0-6.075 4.925-11 11-11s11 4.925 11 11"
        fill="#534AB7"
        opacity="0.35"
      />
      {/* Lines (text placeholder) */}
      <rect
        x="22"
        y="52"
        width="36"
        height="3"
        rx="1.5"
        fill="#A09ED6"
        opacity="0.5"
      />
      <rect
        x="28"
        y="58"
        width="24"
        height="2.5"
        rx="1.25"
        fill="#A09ED6"
        opacity="0.35"
      />
      {/* Plus badge */}
      <circle cx="61" cy="20" r="10" fill="#534AB7" />
      <path
        d="M61 15v10M56 20h10"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <defs>
        <linearGradient
          id="card-grad"
          x1="10"
          y1="16"
          x2="70"
          y2="66"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="white" stopOpacity="0.6" />
          <stop offset="1" stopColor="white" stopOpacity="0" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function ScrollFadeRow({
  children,
  className,
  ...props
}: React.ComponentProps<typeof TableRow>) {
  const ref = useRef<HTMLTableRowElement>(null);
  const [isIntersecting, setIsIntersecting] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
      },
      {
        rootMargin: "0px 0px -10% 0px", // Hàng ở 10% dưới cùng màn hình sẽ mờ
        threshold: 0.1,
      }
    );

    const currentRef = ref.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, []);

  return (
    <TableRow
      ref={ref}
      className={`transition-all duration-500 ease-in-out transform ${
        isIntersecting
          ? "opacity-100 blur-0 translate-y-0 scale-100"
          : "opacity-30 blur-[1.5px] translate-y-2 scale-[0.99]"
      } ${className || ""}`}
      {...props}
    >
      {children}
    </TableRow>
  );
}

function ContactTable({
  contacts,
  onDirect,
  isPending,
  onEdit,
  onAdd,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
}: ContactTableProps) {
  const observerTarget = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!hasNextPage || isFetchingNextPage || !fetchNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (isPending && contacts.length === 0) {
    return <ContactTableSkeleton />;
  }

  return (
    <>
      {contacts && contacts.length > 0 ? (
        /* ── Table ────────────────────────────────────────────────────── */
        <>
          <Table className="min-w-[1200px]">
            <TableHeader>
              <TableRow className="hover:bg-transparent border-b border-border/60">
                {TABLE_COLUMNS.map((col, idx) => (
                  <TableHead
                    key={idx}
                    className={`px-4 py-3 text-muted-foreground uppercase ${
                      idx === TABLE_COLUMNS.length - 1 ? "w-[80px]" : ""
                    }`}
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      letterSpacing: "0.04em",
                    }}
                  >
                    {col}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>

            <TableBody>
              {contacts.map((contact) => (
                <ScrollFadeRow
                  key={contact.id}
                  className="group border-b border-border/40 hover:bg-muted/30 cursor-pointer"
                >
                  {/* ── Name + avatar ── */}
                  <TableCell className="px-4 py-3">
                    <Link
                      href={`/contacts/${contact.id}`}
                      className="flex items-center gap-2.5"
                      style={{ textDecoration: "none" }}
                    >
                      <Avatar className="size-8 shrink-0">
                        <AvatarFallback
                          className="border-0"
                          style={{
                            background: "#C7C3F4",
                            color: "#6B6B67",
                            fontSize: 11,
                            fontWeight: 600,
                          }}
                        >
                          {getInitials(contact.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p
                          className="text-foreground"
                          style={{ fontSize: 13, fontWeight: 500 }}
                        >
                          {contact.name}
                        </p>
                        <p
                          className="text-muted-foreground"
                          style={{ fontSize: 11 }}
                        >
                          {contact.company}
                        </p>
                      </div>
                    </Link>
                  </TableCell>

                  {/* ── Company ── */}
                  <TableCell
                    className="px-4 py-3 text-muted-foreground"
                    style={{ fontSize: 12 }}
                  >
                    {contact.company}
                  </TableCell>

                  {/* ── Email ── */}
                  <TableCell
                    className="px-4 py-3 text-muted-foreground"
                    style={{ fontSize: 11, maxWidth: 180 }}
                  >
                    <span className="block truncate">{contact.email}</span>
                  </TableCell>

                  {/* ── Phone ── */}
                  <TableCell
                    className="px-4 py-3 text-muted-foreground whitespace-nowrap"
                    style={{ fontSize: 12 }}
                  >
                    {contact.phone}
                  </TableCell>

                  {/* ── Tags ── */}
                  <TableCell className="px-4 py-3">
                    <div className="flex gap-1 flex-wrap">
                      {/* {contact.tags.map((tag, i) => (
                            <span
                              key={tag}
                              className="inline-block px-2 py-0.5 rounded-full"
                              style={{
                                fontSize: 10,
                                fontWeight: 500,
                                color: contact.tagStyles[i]?.color ?? "#6B6B67",
                                background:
                                  contact.tagStyles[i]?.bg ?? "#F1EFE8",
                              }}
                            >
                              {tag}
                            </span>
                          ))} */}
                    </div>
                  </TableCell>

                  {/* ── Deals ── */}
                  <TableCell
                    className="px-4 py-3 text-foreground"
                    style={{ fontSize: 12, fontWeight: 500 }}
                  >
                    {contact.deals.length} deal
                    {contact.deals.length > 1 ? "s" : ""}
                  </TableCell>

                  {/* ── Value ── */}
                  <TableCell
                    className="px-4 py-3 text-foreground"
                    style={{ fontSize: 12, fontWeight: 600 }}
                  >
                    {contact.deals
                      .reduce((total, deal) => total + deal.value, 0)
                      .toLocaleString()}
                    đ
                  </TableCell>

                  {/* ── Created date ── */}
                  <TableCell
                    className="px-4 py-3 text-muted-foreground whitespace-nowrap"
                    style={{ fontSize: 11 }}
                  >
                    {relativeTime(contact.createdAt)}
                  </TableCell>

                  {/* ── Last activity ── */}
                  <TableCell
                    className="px-4 py-3 text-muted-foreground whitespace-nowrap"
                    style={{ fontSize: 11 }}
                  >
                    {/* {relativeTime(contact.activities?.[index]?.date)} */}
                    {relativeTime(contact.updatedAt)}
                  </TableCell>

                  {/* ── Actions (show on row hover) ── */}
                  <TableCell className="px-3 py-3 w-[80px]">
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-muted/60"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDirect(contact.id);
                        }}
                        title="Xem chi tiết"
                      >
                        <Eye size={14} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-muted/60"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEdit(contact);
                        }}
                        title="Chỉnh sửa"
                      >
                        <Pencil size={13} />
                      </Button>
                    </div>
                  </TableCell>
                </ScrollFadeRow>
              ))}
            </TableBody>
            </Table>

            {/* ── Infinite Scroll Observer & Indicator ── */}
            <div ref={observerTarget} className="flex justify-center py-4 border-t border-border/40">
              {isFetchingNextPage ? (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent animate-[spin_0.6s_linear_infinite]" />
                  Đang tải thêm liên hệ...
                </div>
              ) : hasNextPage ? (
                <span className="text-xs text-muted-foreground opacity-60">
                  Cuộn xuống để tải thêm
                </span>
              ) : (
                <span className="text-xs text-muted-foreground opacity-40">
                  Đã tải hết danh sách liên hệ ({contacts.length})
                </span>
              )}
            </div>

            {/* ── Footer count ── */}
            <div
              className="px-4 py-0.5 border-t border-border/40 flex items-center gap-1.5 text-muted-foreground"
              style={{ fontSize: 12 }}
            >
            <div className="flex items-center gap-1.5 min-w-20">
              <Users size={12} className="shrink-0" />
              {contacts.length} liên hệ
            </div>
            {/*             
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious href="#" />
                </PaginationItem>
                <PaginationItem>
                  <PaginationLink href="#">1</PaginationLink>
                </PaginationItem>
                <PaginationItem>
                  <PaginationLink href="#" isActive>
                    2
                  </PaginationLink>
                </PaginationItem>
                <PaginationItem>
                  <PaginationLink href="#">3</PaginationLink>
                </PaginationItem>
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
                <PaginationItem>
                  <PaginationNext href="#" />
                </PaginationItem>
              </PaginationContent>
            </Pagination>  */}
          </div>
        </>
      ) : (
        /* ── Empty state ──────────────────────────────────────────────── */
        <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
          <div className="mb-5">
            <EmptyIllustration />
          </div>
          <p
            className="text-foreground mb-1.5"
            style={{ fontSize: 15, fontWeight: 600 }}
          >
            Chưa có liên hệ nào
          </p>
          <p
            className="text-muted-foreground mb-6 max-w-xs"
            style={{ fontSize: 13 }}
          >
            Thêm liên hệ đầu tiên để bắt đầu quản lý khách hàng
          </p>
          <Button
            size="sm"
            className="h-8 gap-1.5 text-xs"
            onClick={() => onAdd?.()}
          >
            <Plus size={13} />
            Thêm liên hệ
          </Button>
        </div>
      )}
    </>
  );
}

export default ContactTable;
