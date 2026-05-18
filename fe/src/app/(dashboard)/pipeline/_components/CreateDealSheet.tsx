"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import ContactDialog from "@/app/(dashboard)/contacts/_components/ContactDialog";
import { useGetContacts } from "@/hooks/useContacts";
import { useCreateDeal } from "@/hooks/useDeals";
import { useGetUsers } from "@/hooks/useUsers";
import { Contact } from "@/lib/validations/contacts.scheme";

const createDealFormSchema = z.object({
  title: z
    .string()
    .min(1, "Tên deal không được để trống")
    .max(200, "Tên deal không được vượt quá 200 ký tự"),
  contactId: z.string().min(1, "Vui lòng chọn liên hệ"),
  ownerId: z.string().min(1, "Vui lòng chọn người phụ trách"),
  value: z.number().nonnegative("Giá trị không được âm"),
  closeDate: z.string().optional(),
  note: z.string().optional(),
});

type CreateDealFormValues = z.infer<typeof createDealFormSchema>;

interface CreateDealSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateDealSheet({ open, onOpenChange }: CreateDealSheetProps) {
  const createDeal = useCreateDeal();
  const contactsQuery = useGetContacts({ limit: 100 });
  const usersQuery = useGetUsers();
  const [contactDialogOpen, setContactDialogOpen] = useState(false);
  const [createdContacts, setCreatedContacts] = useState<Contact[]>([]);

  const fetchedContacts = useMemo(
    () => contactsQuery.data?.pages.flatMap((page) => page.data) ?? [],
    [contactsQuery.data],
  );
  const contacts = useMemo(() => {
    const contactMap = new Map<string, Contact>();

    for (const contact of fetchedContacts) {
      contactMap.set(contact.id, contact);
    }

    for (const contact of createdContacts) {
      contactMap.set(contact.id, contact);
    }

    return Array.from(contactMap.values());
  }, [createdContacts, fetchedContacts]);
  const users = usersQuery.data ?? [];

  const form = useForm<CreateDealFormValues>({
    resolver: zodResolver(createDealFormSchema),
    defaultValues: {
      title: "",
      contactId: "",
      ownerId: "",
      value: 0,
      closeDate: "",
      note: "",
    },
  });

  useEffect(() => {
    if (!open) {
      form.reset({
        title: "",
        contactId: "",
        ownerId: "",
        value: 0,
        closeDate: "",
        note: "",
      });
    }
  }, [form, open]);

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setCreatedContacts([]);
      setContactDialogOpen(false);
    }

    onOpenChange(nextOpen);
  };

  const handleContactCreated = (contact: Contact) => {
    setCreatedContacts((current) => {
      const withoutDuplicate = current.filter((item) => item.id !== contact.id);
      return [contact, ...withoutDuplicate];
    });
    form.setValue("contactId", contact.id, {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  const onSubmit = async (values: CreateDealFormValues) => {
    await createDeal.mutateAsync({
      title: values.title,
      contactId: values.contactId,
      ownerId: values.ownerId,
      value: values.value,
      closeDate: values.closeDate ? new Date(values.closeDate) : undefined,
      note: values.note?.trim() ? values.note.trim() : undefined,
    });

    handleOpenChange(false);
  };

  const isPending = createDeal.isPending;
  const contactsLoading = contactsQuery.isLoading;
  const usersLoading = usersQuery.isLoading;

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent className="w-[400px] sm:w-[480px] overflow-y-auto p-4">
        <SheetHeader className="pb-4 border-b mb-5">
          <SheetTitle style={{ fontSize: 15, fontWeight: 600 }}>
            Thêm deal
          </SheetTitle>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel style={{ fontSize: 12 }}>
                    Tên deal <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Tên deal"
                      {...field}
                      style={{ fontSize: 13 }}
                      className="shadow-inner bg-gray-50"
                    />
                  </FormControl>
                  <FormMessage style={{ fontSize: 11 }} />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="contactId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel style={{ fontSize: 12 }}>
                    Liên hệ <span className="text-destructive">*</span>
                  </FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={contactsLoading || isPending}
                  >
                    <FormControl>
                      <SelectTrigger size="sm" style={{ fontSize: 13 }} className="shadown-inner bg-gray-50 ">
                        <SelectValue
                          placeholder={
                            contactsLoading ? "Đang tải..." : "Chọn liên hệ"
                          }
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {contacts.map((contact) => (
                        <SelectItem
                          key={contact.id}
                          value={contact.id}
                          style={{ fontSize: 13 }}
                        >
                          {contact.name}
                          {contact.company ? ` - ${contact.company}` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="shadow-inner bg-gray-50 h-7 px-0 text-xs text-primary hover:bg-transparent"
                    disabled={isPending}
                    onClick={() => setContactDialogOpen(true)}
                  >
                    + Tạo liên hệ mới
                  </Button>
                  <FormMessage style={{ fontSize: 11 }} />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="ownerId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel style={{ fontSize: 12 }}>
                    Người phụ trách <span className="text-destructive">*</span>
                  </FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={usersLoading || isPending}
                  >
                    <FormControl>
                      <SelectTrigger size="sm" style={{ fontSize: 13 }}>
                        <SelectValue
                          placeholder={
                            usersLoading
                              ? "Đang tải..."
                              : "Chọn người phụ trách"
                          }
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {users.map((user) => (
                        <SelectItem
                          key={user.id}
                          value={user.id}
                          style={{ fontSize: 13 }}
                        >
                          {user.name} - {user.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage style={{ fontSize: 11 }} />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-3">
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
                        onChange={(event) =>
                          field.onChange(event.target.valueAsNumber)
                        }
                        style={{ fontSize: 13 }}
                      />
                    </FormControl>
                    <FormMessage style={{ fontSize: 11 }} />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="closeDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel style={{ fontSize: 12 }}>
                      Ngày đóng dự kiến
                    </FormLabel>
                    <FormControl>
                      <Input type="date" {...field} style={{ fontSize: 13 }} />
                    </FormControl>
                    <FormMessage style={{ fontSize: 11 }} />
                  </FormItem>
                )}
              />
            </div>

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
                    className="shadow-inner bg-gray-50"
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
                disabled={isPending}
                onClick={() => handleOpenChange(false)}
              >
                Hủy
              </Button>
              <Button
                type="submit"
                size="sm"
                className="flex-1 text-xs"
                disabled={isPending}
              >
                {isPending ? "Đang tạo..." : "Tạo deal"}
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>

      <ContactDialog
        isOpen={contactDialogOpen}
        onOpenChange={setContactDialogOpen}
        onCreated={handleContactCreated}
      />
    </Sheet>
  );
}
