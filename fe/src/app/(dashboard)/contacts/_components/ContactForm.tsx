import { Controller, useForm } from "react-hook-form";
import {
  Contact,
  CreateContactBodySchema,
  CreateContactBodyType,
  ContactTagConst,
  ContactTagType,
} from "@/lib/validations/contacts.scheme";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, Tag } from "lucide-react";

interface ContactFormProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateContactBodyType) => void;
  isPending?: boolean;
  defaultValues?: Partial<Contact>;
}

const CONTACT_TAG_COLOR: Record<ContactTagType, string> = {
  [ContactTagConst.Enterprise]: "bg-blue-100 text-blue-800 border border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800",
  [ContactTagConst.Vip]: "bg-purple-100 text-purple-800 border border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800",
  [ContactTagConst.Potential]: "bg-orange-100 text-orange-800 border border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800",
};

function ContactForm({ onSubmit, isPending, defaultValues }: ContactFormProps) {
  const form = useForm<CreateContactBodyType>({
    resolver: zodResolver(CreateContactBodySchema),
    defaultValues: {
      name: defaultValues?.name ?? "",
      email: defaultValues?.email ?? "",
      phone: defaultValues?.phone ?? "",
      company: defaultValues?.company ?? "",
      position: defaultValues?.position ?? "",
      tags: defaultValues?.tags ?? [],
    },
  });

  useEffect(() => {
    form.reset({
      name: defaultValues?.name ?? "",
      email: defaultValues?.email ?? "",
      phone: defaultValues?.phone ?? "",
      company: defaultValues?.company ?? "",
      position: defaultValues?.position ?? "",
      tags: defaultValues?.tags ?? [],
    });
  }, [defaultValues]);

  return (
    <form id="form-rhf-contact" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <FieldGroup className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Name - Full width */}
        <div className="md:col-span-2">
          <Controller
            name="name"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="form-rhf-contact-name">
                  Tên liên hệ <span className="text-destructive">*</span>
                </FieldLabel>
                <Input
                  {...field}
                  value={field.value ?? ""}
                  id="form-rhf-contact-name"
                  aria-invalid={fieldState.invalid}
                  placeholder="Nhập tên liên hệ"
                  autoComplete="off"
                  className="w-full"
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
        </div>

        {/* Email */}
        <Controller
          name="email"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="form-rhf-contact-email">Email</FieldLabel>
              <Input
                {...field}
                value={field.value ?? ""}
                id="form-rhf-contact-email"
                aria-invalid={fieldState.invalid}
                placeholder="Nhập email"
                autoComplete="off"
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        {/* Phone */}
        <Controller
          name="phone"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="form-rhf-contact-phone">
                Số điện thoại
              </FieldLabel>
              <Input
                {...field}
                value={field.value ?? ""}
                id="form-rhf-contact-phone"
                aria-invalid={fieldState.invalid}
                placeholder="Nhập số điện thoại"
                autoComplete="off"
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        {/* Company */}
        <Controller
          name="company"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="form-rhf-contact-company">
                Công ty
              </FieldLabel>
              <Input
                {...field}
                value={field.value ?? ""}
                id="form-rhf-contact-company"
                aria-invalid={fieldState.invalid}
                placeholder="Nhập tên công ty"
                autoComplete="off"
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        {/* Position */}
        <Controller
          name="position"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="form-rhf-contact-position">
                Vị trí
              </FieldLabel>
              <Input
                {...field}
                value={field.value ?? ""}
                id="form-rhf-contact-position"
                aria-invalid={fieldState.invalid}
                placeholder="Nhập vị trí công việc"
                autoComplete="off"
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        {/* Tags (Dropmenu Multi-select) - Full width */}
        <div className="md:col-span-2">
          <Controller
            name="tags"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="form-rhf-contact-tags">Tags (Nhãn)</FieldLabel>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      id="form-rhf-contact-tags"
                      className="flex min-h-9 w-full items-center justify-between rounded-lg border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-colors hover:bg-accent/10 focus:outline-hidden disabled:cursor-not-allowed disabled:opacity-50 text-left cursor-pointer"
                    >
                      {field.value && field.value.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {field.value.map((tag) => (
                            <span
                              key={tag}
                              className={`inline-block px-2 py-0.5 rounded-full ${CONTACT_TAG_COLOR[tag as ContactTagType]}`}
                              style={{
                                fontSize: 10,
                                fontWeight: 500,
                              }}
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-muted-foreground flex items-center gap-1.5">
                          <Tag className="size-4 opacity-50" />
                          Chọn nhãn liên hệ
                        </span>
                      )}
                      <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground opacity-50" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="start">
                    {Object.values(ContactTagConst).map((tagOption) => {
                      const isChecked = field.value?.includes(tagOption) || false;
                      return (
                        <DropdownMenuCheckboxItem
                          key={tagOption}
                          checked={isChecked}
                          onCheckedChange={(checked) => {
                            const currentValues = field.value || [];
                            const nextValues = checked
                              ? [...currentValues, tagOption]
                              : currentValues.filter((v) => v !== tagOption);
                            field.onChange(nextValues);
                          }}
                        >
                          {tagOption}
                        </DropdownMenuCheckboxItem>
                      );
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
        </div>
      </FieldGroup>
      <div className="flex items-center justify-end gap-2 pt-4 border-t border-border mt-6">
        <Button
          type="button"
          variant="outline"
          onClick={() => form.reset()}
          className="cursor-pointer"
        >
          Reset
        </Button>
        <Button
          type="submit"
          form="form-rhf-contact"
          disabled={isPending}
          className="cursor-pointer"
        >
          {isPending ? "Đang xử lý..." : "Lưu"}
        </Button>
      </div>
    </form>
  );
}

export default ContactForm;
