import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Deal, STAGE_CONFIG, STAGES } from "./types";
import { useUpdateDeal } from "@/hooks/useDeals";

const formSchema = z.object({
  title:     z.string().min(1, "Tên deal không được để trống"),
  stage:     z.enum(STAGES, "Vui lòng chọn giai đoạn"),
  contactId: z.string(),
  ownerId:   z.string(),
  value:     z.number().nonnegative("Giá trị không được âm"),
  closeDate: z.string(),
  note:      z.string(),
});

type FormValues = z.infer<typeof formSchema>;

interface Props {
  deal: Deal;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditDealSheet({ deal, open, onOpenChange }: Props) {
  const updateDeal = useUpdateDeal(deal.id);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title:     deal?.title ?? "",
      stage:     "PROSPECT",
      contactId: "",
      ownerId:   "",
      value:     deal?.value ?? 0,
      closeDate: deal?.closeDate ? new Date(deal.closeDate).toISOString().split("T")[0] : "",
      note:      deal?.note ?? "",
    },
  });

  // Populate form when deal changes / sheet opens
  // useEffect(() => {
  //   if (deal && open) {
  //     form.reset({
  //       title:     deal.title,
  //       stage:     deal.stage,
  //       contactId: "",
  //       ownerId:   ownerIdFromDeal(deal),
  //       value:     deal.value === "—" ? 0 : deal.value,
  //       closeDate: "",
  //       note:      "",
  //     });
  //   }
  // }, [deal, open]);

  const onSubmit = (values: FormValues) => {
    if (!deal) return;

    // const contact = MOCK_CONTACTS.find((c) => c.id === values.contactId);

    updateDeal.mutate({
      title:   values.title,
      value:   values.value,
      closeDate: values.closeDate ? new Date(values.closeDate) : undefined,
      note:    values.note,
    });

    toast.success("Deal đã được cập nhật");
    onOpenChange(false);
  };


  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[400px] sm:w-[480px] overflow-y-auto">
        <SheetHeader className="pb-4 border-b mb-5">
          <SheetTitle style={{ fontSize: 15, fontWeight: 600 }}>Chỉnh sửa deal</SheetTitle>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

            {/* Title */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel style={{ fontSize: 12 }}>
                    Tên deal <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="Tên deal" {...field} style={{ fontSize: 13 }} />
                  </FormControl>
                  <FormMessage style={{ fontSize: 11 }} />
                </FormItem>
              )}
            />

            {/* Stage + Value */}
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="stage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel style={{ fontSize: 12 }}>Giai đoạn</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger size="sm" style={{ fontSize: 13 }}>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {STAGES.map((s) => (
                          <SelectItem key={s} value={s} style={{ fontSize: 13 }}>
                            {STAGE_CONFIG[s].label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage style={{ fontSize: 11 }} />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel style={{ fontSize: 12 }}>Giá trị</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="VD: 320000000"
                        {...field}
                        onChange={(e) => field.onChange(e.target.valueAsNumber)}
                        style={{ fontSize: 13 }}
                      />
                    </FormControl>
                    <FormMessage style={{ fontSize: 11 }} />
                  </FormItem>
                )}
              />
            </div>

            {/* Contact */}
            {/* <FormField
              control={form.control}
              name="contactId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel style={{ fontSize: 12 }}>Liên hệ</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger size="sm" style={{ fontSize: 13 }}>
                        <SelectValue placeholder={deal.company || "Chọn liên hệ"} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {MOCK_CONTACTS.map((c) => (
                        <SelectItem key={c.id} value={c.id} style={{ fontSize: 13 }}>
                          {c.name} — {c.company}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage style={{ fontSize: 11 }} />
                </FormItem>
              )}
            /> */}

            {/* Owner + Close Date */}
            <div className="grid grid-cols-2 gap-3">
              {/* <FormField
                control={form.control}
                name="ownerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel style={{ fontSize: 12 }}>Người phụ trách</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger size="sm" style={{ fontSize: 13 }}>
                          <SelectValue placeholder="Chọn nhân viên" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {MOCK_OWNERS.map((o) => (
                          <SelectItem key={o.id} value={o.id} style={{ fontSize: 13 }}>
                            {o.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage style={{ fontSize: 11 }} />
                  </FormItem>
                )}
              /> */}

              <FormField
                control={form.control}
                name="closeDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel style={{ fontSize: 12 }}>Ngày đóng dự kiến</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} style={{ fontSize: 13 }} />
                    </FormControl>
                    <FormMessage style={{ fontSize: 11 }} />
                  </FormItem>
                )}
              />
            </div>

            {/* Note */}
            <FormField
              control={form.control}
              name="note"
              render={({ field }) => (
                <FormItem>
                  <FormLabel style={{ fontSize: 12 }}>Ghi chú</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Ghi chú về deal này..."
                      rows={4}
                      {...field}
                      style={{ fontSize: 13, resize: "none" }}
                    />
                  </FormControl>
                  <FormMessage style={{ fontSize: 11 }} />
                </FormItem>
              )}
            />

            <div className="flex gap-2 pt-3">
              <Button
                type="button" 
                variant="outline"
                size="sm"
                className="flex-1 text-xs"
                onClick={() => onOpenChange(false)}
              >
                Hủy
              </Button>
              <Button type="submit" size="sm" className="flex-1 text-xs">
                Lưu thay đổi
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
