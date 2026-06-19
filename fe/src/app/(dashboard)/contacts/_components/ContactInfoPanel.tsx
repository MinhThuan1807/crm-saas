import { useState } from "react";
import { useRouter } from "next/navigation";
import { useDeleteContact } from "@/hooks/useContacts";
import {
  Mail,
  Phone,
  Building2,
  Briefcase,
  Calendar,
  ChevronRight,
  Edit2,
  Trash2,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { StageBadge, type DealStage } from "@/components/StageBage";
import { GetContactResType } from "@/lib/validations/contacts.scheme";
import { formatCurrency, getInitials, relativeTime } from "@/lib/helper";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
import ContactDialog from "./ContactDialog";

interface ContactInfoPanelProps {
  contact: GetContactResType;
}

export function ContactInfoPanel({ contact }: ContactInfoPanelProps) {
  const router = useRouter();
  const deleteContact = useDeleteContact();

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const handleDelete = async () => {
    try {
      await deleteContact.mutateAsync(contact.id);
      router.push("/contacts");
    } catch (error) {
      console.error("Failed to delete contact:", error);
    }
  };
  const infoRows = [
    { key: "email", icon: Mail, label: "Email", value: contact.email || "" },
    { key: "phone", icon: Phone, label: "Phone", value: contact.phone || "" },
    {
      key: "company",
      icon: Building2,
      label: "Công ty",
      value: contact.company || "",
    },
    {
      key: "position",
      icon: Briefcase,
      label: "Chức vụ",
      value: contact.position || "",
    },
    {
      key: "createdAt",
      icon: Calendar,
      label: "Ngày tạo",
      value: relativeTime(contact.createdAt) || "",
    },
  ];
  const states = [
    { key: "deals", label: "Deals", value: contact.deals.length },
    {
      key: "activities",
      label: "Activities",
      value: contact.activities.length,
    },
    {
      key: "value",
      label: "Giá trị",
      value: formatCurrency(
        contact.deals.reduce((sum, deal) => sum + deal.value, 0),
      ),
    },
  ];

  return (
    <div className="w-[35%] min-w-[300px] bg-background border-r border-border flex flex-col overflow-y-auto shrink-0">
      {/* Header / Avatar area */}
      <div className="px-5 pt-6 pb-5 border-b border-border">
        {/* Edit button */}
        <div className="flex justify-end mb-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-7 gap-1 border-border text-muted-foreground hover:text-foreground cursor-pointer"
                style={{ fontSize: 12 }}
              >
                <Edit2 size={11} />
                Chỉnh sửa
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setIsEditDialogOpen(true)} className="cursor-pointer" style={{ fontSize: 12 }}>
                <Edit2 size={13} className="mr-1.5" />
                Chỉnh sửa thông tin
              </DropdownMenuItem>
              <DropdownMenuItem
                variant="destructive"
                onClick={() => setIsDeleteDialogOpen(true)}
                className="cursor-pointer"
                style={{ fontSize: 12 }}
              >
                <Trash2 size={13} className="mr-1.5" />
                Xóa liên hệ
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Avatar + name */}
        <div className="flex flex-col items-center gap-3">
          <Avatar className="size-14">
            <AvatarFallback
              className="border-0"
              style={{
                background: "#EEEDFE",
                color: "#534AB7",
                fontSize: 18,
                fontWeight: 600,
                letterSpacing: "0.02em",
              }}
            >
              {getInitials(contact.name)}
              {/* {contact.name} */}
            </AvatarFallback>
          </Avatar>

          <div className="text-center">
            <p
              className="text-foreground"
              style={{
                fontSize: 15,
                fontWeight: 600,
                letterSpacing: "-0.01em",
                marginBottom: 3,
              }}
            >
              {contact.name}
            </p>
            <p className="text-muted-foreground" style={{ fontSize: 12 }}>
              {contact.position} tại {contact.company}
            </p>
          </div>

          {/* Tags */}
          <div className="flex gap-1.5">
            <span
              className="px-2.5 py-0.5 rounded-full"
              style={{
                fontSize: 11,
                fontWeight: 500,
                color: "#3B6D11",
                background: "#E8F5E0",
              }}
            >
              VIP
            </span>
            <span
              className="px-2.5 py-0.5 rounded-full"
              style={{
                fontSize: 11,
                fontWeight: 500,
                color: "#534AB7",
                background: "#EEEDFE",
              }}
            >
              Enterprise
            </span>
          </div>
        </div>

        {/* Stats row */}
        <div className="flex mt-5 bg-[#F8F8F7] rounded-[10px] border border-border overflow-hidden">
          {states.map((stat, i) => (
            <div
              key={stat.key}
              className="flex-1 py-2.5 text-center"
              style={{
                borderRight:
                  i < states.length - 1 ? "0.5px solid #E8E7E2" : undefined,
              }}
            >
              <p
                className="text-foreground"
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  letterSpacing: "-0.01em",
                }}
              >
                {stat.value}
              </p>
              <p
                className="text-muted-foreground mt-0.5"
                style={{ fontSize: 10 }}
              >
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Info rows */}
      <div className="px-5 py-4 border-b border-border">
        <p
          className="text-muted-foreground uppercase mb-3"
          style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.06em" }}
        >
          Thông tin liên hệ
        </p>
        <div className="space-y-2.5">
          {infoRows.map((row) => {
            const Icon = row.icon;
            return (
              <div key={row.key} className="flex items-center gap-2.5">
                <div className="size-7 rounded-[7px] bg-[#F8F8F7] border border-border flex items-center justify-center shrink-0">
                  <Icon
                    size={13}
                    className="text-muted-foreground"
                    strokeWidth={1.7}
                  />
                </div>
                <div className="min-w-0">
                  <p
                    className="text-muted-foreground"
                    style={{ fontSize: 10, marginBottom: 1 }}
                  >
                    {row.label}
                  </p>
                  <p
                    className="text-foreground truncate"
                    style={{ fontSize: 12 }}
                  >
                    {row.value}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Related deals */}
      <div className="px-5 py-4 flex-1">
        <div className="flex items-center justify-between mb-3">
          <p
            className="text-muted-foreground uppercase"
            style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.06em" }}
          >
            Deals liên quan
          </p>
          <button
            className="flex items-center gap-0.5 text-primary bg-transparent border-0 cursor-pointer p-0"
            style={{ fontSize: 11 }}
          >
            Xem tất cả
            <ChevronRight size={11} />
          </button>
        </div>

        <div className="space-y-2">
          {contact.deals.map((deal) => (
            <div
              key={deal.id}
              className="flex items-center gap-2 px-2.5 py-2 rounded-lg border border-border bg-background cursor-pointer hover:bg-[#F8F8F7] transition-colors"
            >
              <div className="flex-1 min-w-0">
                <p
                  className="text-foreground truncate"
                  style={{ fontSize: 12, fontWeight: 500 }}
                >
                  {deal.title}
                </p>
              </div>
              <StageBadge
                stage={deal.stage}
                className="shrink-0 text-[11px] px-2 py-0.5"
              />
              <span
                className="text-foreground shrink-0"
                style={{ fontSize: 11, fontWeight: 600 }}
              >
                {formatCurrency(deal.value)}
              </span>
            </div>
          ))}
        </div>
      </div>
      <ContactDialog
        contact={contact}
        isOpen={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
      />
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa liên hệ</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa liên hệ <strong>{contact.name}</strong>? Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">Hủy</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleDelete} className="cursor-pointer">
              Xóa liên hệ
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
