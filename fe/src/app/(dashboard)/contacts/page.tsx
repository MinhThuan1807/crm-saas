"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { useDebounceValue } from "usehooks-ts";
import { ChevronDown, Filter, Plus, Search, FileSpreadsheet } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useGetContacts } from "@/hooks/useContacts";
import ContactTable from "@/app/(dashboard)/contacts/_components/ContactTable";
import { Contact, ContactTagConst } from "@/lib/validations/contacts.scheme";
import ContactDialog from "@/app/(dashboard)/contacts/_components/ContactDialog";
import ImportExcelDialog from "@/app/(dashboard)/contacts/_components/ImportExcelDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const ContactsPage = () => {
  const [search, setSearch] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | undefined>(undefined);
  const router = useRouter();
  const [debouncedSearch] = useDebounceValue(search, 300);
  const [dialog, setDialog] = useState<{
    isOpen: boolean;
    contact?: Contact;
  }>({ isOpen: false });
  const [isImportOpen, setIsImportOpen] = useState(false);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useGetContacts({ limit: 10, search: debouncedSearch, tag: selectedTag });

  const contacts = data?.pages.flatMap((page) => page.data) ?? [];

  const handleDirect = (id: string) => {
    router.push(`/contacts/${id}`);
  };
  return (
    <>
      <div className="h-screen flex">
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
          {/* ── Top bar ──────────────────────────────────────────────────────── */}
          <header className="h-14 shrink-0 border-b bg-background flex items-center justify-between px-6 gap-3">
            <h1
              className="text-foreground tracking-tight"
              style={{ fontSize: 15, fontWeight: 600, lineHeight: 1 }}
            >
              Contacts
            </h1>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
                <Input
                  placeholder="Tìm kiếm liên hệ..."
                  className="h-8 pl-8 w-44 text-xs bg-background border-border"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 border-border text-muted-foreground hover:text-foreground text-xs"
              >
                <Filter size={13} />
                Lọc theo
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 gap-1 border-border text-muted-foreground hover:text-foreground text-xs cursor-pointer"
                  >
                    {selectedTag ? `Tag: ${selectedTag}` : "Tất cả tags"}
                    <ChevronDown size={12} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    className="cursor-pointer text-xs"
                    onClick={() => setSelectedTag(undefined)}
                  >
                    Tất cả tags
                  </DropdownMenuItem>
                  {Object.values(ContactTagConst).map((tag) => (
                    <DropdownMenuItem
                      key={tag}
                      className="cursor-pointer text-xs"
                      onClick={() => setSelectedTag(tag)}
                    >
                      {tag}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 border-border text-muted-foreground hover:text-foreground text-xs cursor-pointer"
                onClick={() => setIsImportOpen(true)}
              >
                <FileSpreadsheet size={13} className="text-green-600" />
                Import Excel
              </Button>

              <Button
                size="sm"
                className="h-8 gap-1.5 text-xs cursor-pointer"
                onClick={() => setDialog({ isOpen: true })}
              >
                <Plus size={13} />
                Thêm liên hệ
              </Button>
            </div>
          </header>
          {/* ── Main content ─────────────────────────────────────────────────── */}
          <main className="flex-1 overflow-y-auto bg-[#F8F8F7] dark:bg-background p-5">
            <div className="min-h-full bg-background rounded-xl border border-border/70 overflow-hidden shadow-none">
              <ContactTable
                contacts={contacts}
                onDirect={handleDirect}
                isPending={isLoading}
                onEdit={(contact) => setDialog({ isOpen: true, contact })}
                onAdd={() => setDialog({ isOpen: true })}
                hasNextPage={hasNextPage}
                isFetchingNextPage={isFetchingNextPage}
                fetchNextPage={fetchNextPage}
              />
            </div>
          </main>
        </div>
      </div>
      <ContactDialog
        {...dialog}
        onOpenChange={(open) => setDialog((s) => ({ ...s, isOpen: open }))}
      />
      <ImportExcelDialog
        isOpen={isImportOpen}
        onOpenChange={setIsImportOpen}
      />
    </>
  );
};

export default ContactsPage;
