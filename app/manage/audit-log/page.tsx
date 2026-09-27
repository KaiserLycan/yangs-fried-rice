"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Search, ChevronDown, Filter } from "lucide-react";
import { ManagePagination } from "@/components/manage/manage-pagination";
import { SortableHeader, type SortDirection } from "@/components/manage/sortable-header";
import { Kbd } from "@/components/ui/tooltip";
import { SHORTCUTS, useShortcut } from "@/lib/hooks/use-shortcut";
import { DateInput } from "@/components/manage/reports/report-controls";
import { AuditLogModal, formatAuditTime } from "@/components/manage/audit-log/audit-log-modal";
import { useDebounce } from "@/lib/hooks/use-debounce";
import { DROPDOWN_FOCUS_RING, useDropdown } from "@/lib/hooks/use-dropdown";
import { useToast, ToastProvider } from "@/components/ui/toast";
import { getAuditActors, getAuditLog, type AuditLogEntry } from "@/lib/actions/audit";
import {
  AUDIT_CATEGORIES,
  auditActionLabel,
  type AuditCategoryId,
} from "@/lib/audit/audit-actions";
import type { AuditSortColumn } from "@/lib/validation/audit";
import { roleDisplayLabel } from "@/lib/auth/roles";

/**
 * Audit log (manager only). Every employee action, newest first — who did
 * what, and when — read from `audit_log`. See
 * supabase/migrations/20260927000004_employee_audit_log.sql for how entries
 * are written.
 *
 * Built like the other back-office lists (customers, employees): the same
 * header, search box, filter dropdowns, table and pagination. Unlike the
 * customer list it pages on the server, the way the orders page does,
 * because the log only ever grows.
 */
export default function ManageAuditLogPage() {
  return (
    <ToastProvider>
      <ManageAuditLogInner />
    </ToastProvider>
  );
}

type Option = { id: string; label: string };

const ALL = "all";
const CATEGORY_OPTIONS: Option[] = [
  { id: ALL, label: "All actions" },
  ...AUDIT_CATEGORIES.map((c) => ({ id: c.id, label: c.label })),
];

/**
 * A filter the same shape as the reports' `DateInput` beside it — a visible
 * label over a box of the same fixed height — so the whole filter row lines
 * up along its bottom edge. The list itself is the employee page's role
 * filter (`useDropdown`, same option styling).
 */
function FilterDropdown({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: Option[];
  value: string;
  onChange: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const menu = useDropdown({ open, onOpenChange: setOpen });
  const current = options.find((o) => o.id === value)?.label ?? options[0]?.label ?? "";

  return (
    <div className="relative flex w-full md:w-auto md:min-w-[200px] flex-col gap-[6px]">
      <span {...menu.labelProps} className="text-[11px] font-bold uppercase tracking-[1.32px] text-[#7a6a60]">
        {label}
      </span>
      <button
        {...menu.triggerProps}
        className="flex h-[46px] md:h-[50px] w-full items-center justify-between gap-2 rounded-[12px] border border-[#ddcdb8] bg-white px-3 md:px-[14px] text-[13px] md:text-[15px] hover:bg-[#FAF5EB] transition-colors focus:outline-none focus:ring-2 focus:ring-[#E8541F]"
      >
        <span className="flex min-w-0 items-center gap-2">
          <Filter aria-hidden="true" className="h-[16px] w-[16px] shrink-0 text-[#A2938A]" />
          <span className="truncate text-left text-[#1a1210]">{current}</span>
        </span>
        <ChevronDown aria-hidden="true" className="h-4 w-4 shrink-0 text-[#A2938A]" />
      </button>

      {open && (
        <div
          {...menu.listProps}
          className="absolute left-0 top-[calc(100%+8px)] z-20 w-full md:w-[240px] max-h-[300px] overflow-y-auto bg-white border border-[#DDCDB8] rounded-xl p-1 shadow-[0_8px_20px_rgba(26,18,16,0.08)]"
        >
          {options.map((option) => (
            <button
              key={option.id}
              {...menu.optionProps(value === option.id)}
              onClick={() => {
                onChange(option.id);
                menu.close();
              }}
              className={`w-full text-left px-3 py-2.5 rounded-lg text-[13px] transition-colors ${DROPDOWN_FOCUS_RING} ${
                value === option.id ? "bg-[#F6E9D9] font-bold text-[#8C1C13]" : "text-[#1A1210] hover:bg-[#FAF5EB]"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** Newest first unless a manager asks otherwise — the order the log is read in. */
const DEFAULT_SORT: { column: AuditSortColumn; direction: "asc" | "desc" } = {
  column: "occurred_at",
  direction: "desc",
};

function ManageAuditLogInner() {
  const showToast = useToast();

  const [entries, setEntries] = useState<AuditLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [actorOptions, setActorOptions] = useState<Option[]>([{ id: ALL, label: "All employees" }]);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedEntry, setSelectedEntry] = useState<AuditLogEntry | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 300);
  const searchRef = useRef<HTMLInputElement>(null);
  // "/" jumps to the search box, the same key as the customer menu's search.
  useShortcut(SHORTCUTS.focusSearch.combo, () => {
    searchRef.current?.focus();
    searchRef.current?.select();
  });

  // Sorting is done by the server: the log is paged, so sorting one page in
  // the browser would only reorder the ten rows on screen.
  const [sort, setSort] = useState(DEFAULT_SORT);
  const sortFor = (column: AuditSortColumn): SortDirection =>
    sort.column === column ? sort.direction : "none";
  const changeSort = (column: AuditSortColumn) => (next: SortDirection) => {
    if (next !== "none") {
      setSort({ column, direction: next });
    } else if (column === DEFAULT_SORT.column) {
      // "When" is always sorted one way or the other; its third click goes
      // back to ascending rather than to an unsorted state it can't have.
      setSort({ column, direction: "asc" });
    } else {
      setSort(DEFAULT_SORT);
    }
  };
  const [category, setCategory] = useState<string>(ALL);
  const [actorId, setActorId] = useState<string>(ALL);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Manila" });
  const datesInvalid = Boolean(startDate && endDate && endDate < startDate);
  const hasFilters = Boolean(searchQuery || category !== ALL || actorId !== ALL || startDate || endDate);

  // Any filter or sort change starts again from the first page.
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, category, actorId, startDate, endDate, sort]);

  useEffect(() => {
    getAuditActors().then((result) => {
      if (result.data) {
        setActorOptions([
          { id: ALL, label: "All employees" },
          ...result.data.map((a) => ({ id: a.id, label: a.name })),
        ]);
      }
    });
  }, []);

  const fetchEntries = useCallback(async () => {
    if (datesInvalid) return;
    setIsLoading(true);

    const result = await getAuditLog({
      category: category === ALL ? undefined : (category as AuditCategoryId),
      actor_id: actorId === ALL ? undefined : actorId,
      date_from: startDate || undefined,
      date_to: endDate || undefined,
      search: debouncedSearch.trim() || undefined,
      sort: sort.column,
      direction: sort.direction,
      limit: pageSize,
      offset: (currentPage - 1) * pageSize,
    });

    if (result.error) {
      setLoadError(true);
      showToast(`Failed to load the audit log: ${result.error}`, "error");
    } else if (result.data) {
      setLoadError(false);
      setEntries(result.data.entries);
      setTotalPages(Math.max(1, Math.ceil(result.data.totalCount / pageSize)));
    }
    setIsLoading(false);
  }, [category, actorId, startDate, endDate, debouncedSearch, sort, currentPage, pageSize, datesInvalid, showToast]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const clearFilters = () => {
    setSearchQuery("");
    setSort(DEFAULT_SORT);
    setCategory(ALL);
    setActorId(ALL);
    setStartDate("");
    setEndDate("");
  };

  return (
    <div className="flex flex-col h-full gap-4 md:gap-0">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-[10px] md:mb-8 gap-4 md:gap-0">
        <h1 className="font-display text-[24px] md:text-[30px] leading-normal text-[#1a1210]">
          AUDIT LOG
        </h1>
        <div className="relative w-full md:w-auto">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-[#A2938A]" />
          <input
            ref={searchRef}
            type="search"
            aria-label="Search the audit log"
            aria-keyshortcuts="/"
            title="Search the audit log (press / to jump here)"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            maxLength={80}
            className="w-full md:w-[360px] h-[45px] pl-11 pr-10 rounded-xl border border-[#DDCDB8] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#E8541F] placeholder:text-[#A2938A]"
          />
          {!searchQuery && (
            <Kbd className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 border-[#DDCDB8] bg-transparent text-[#A2938A]">
              /
            </Kbd>
          )}
        </div>
      </div>

      {/* Filters */}
      {/* Every control is a labelled field of the same fixed height (the
          reports' DateInput), so the row shares one bottom edge. */}
      <div className="flex flex-col md:flex-row md:flex-wrap md:items-end gap-3 md:gap-[10px] md:mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:flex gap-3 md:gap-[10px]">
          <FilterDropdown label="Action" options={CATEGORY_OPTIONS} value={category} onChange={setCategory} />
          <FilterDropdown label="Employee" options={actorOptions} value={actorId} onChange={setActorId} />
        </div>
        <div className="grid grid-cols-2 md:flex gap-3 md:gap-[10px]">
          <DateInput label="Start Date" max={today} value={startDate} onChange={setStartDate} />
          <DateInput label="End Date" max={today} value={endDate} onChange={setEndDate} />
        </div>
        {hasFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="flex h-[46px] md:h-[50px] items-center justify-center rounded-[12px] border border-[#ddcdb8] bg-white px-4 text-[13px] md:text-[15px] font-bold text-[#7A6A60] hover:bg-[#FAF5EB] transition-colors focus:outline-none focus:ring-2 focus:ring-[#E8541F]"
          >
            Clear filters
          </button>
        )}
      </div>
      {datesInvalid && (
        <p role="alert" className="text-[13px] text-[#C0392B] -mt-2 md:-mt-4 mb-2">
          The start date must be on or before the end date.
        </p>
      )}

      {/* Table */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="bg-white rounded-[12px] overflow-hidden flex flex-col min-h-0 border border-[#F0E6D8] shadow-[0_2px_10px_rgba(26,18,16,0.02)]">
          <div className="hidden md:grid grid-cols-[1fr_1.1fr_1.1fr_2.4fr] px-8 py-5 border-b border-[#F0E6D8] bg-[#EAE0D5] text-[12px] font-bold text-[#7A6A60] uppercase tracking-[1px]">
            <SortableHeader label="When" currentSort={sortFor("occurred_at")} onSortChange={changeSort("occurred_at")} />
            <SortableHeader label="Employee" currentSort={sortFor("actor_name")} onSortChange={changeSort("actor_name")} />
            <SortableHeader label="Action" currentSort={sortFor("action")} onSortChange={changeSort("action")} />
            <SortableHeader label="Details" currentSort={sortFor("summary")} onSortChange={changeSort("summary")} />
          </div>

          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="flex flex-col">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex flex-col md:grid md:grid-cols-[1fr_1.1fr_1.1fr_2.4fr] px-5 md:px-8 py-4 md:py-5 border-b border-[#F0E6D8] gap-2 md:gap-0 items-start md:items-center">
                    <div className="h-[18px] w-[120px] bg-[#efe6d8] rounded-full animate-pulse" />
                    <div className="h-[18px] w-[130px] bg-[#efe6d8] rounded-full animate-pulse" />
                    <div className="h-[18px] w-[110px] bg-[#efe6d8] rounded-full animate-pulse" />
                    <div className="hidden md:block h-[18px] w-[260px] bg-[#efe6d8] rounded-full animate-pulse" />
                  </div>
                ))}
              </div>
            ) : entries.length === 0 ? (
              <div className="p-8 text-center text-[#7A6A60]">
                {loadError
                  ? "The audit log couldn't be loaded."
                  : hasFilters
                    ? "No actions match these filters."
                    : "No employee actions recorded yet."}
              </div>
            ) : (
              entries.map((entry, index) => (
                <button
                  type="button"
                  key={entry.audit_id}
                  onClick={() => setSelectedEntry(entry)}
                  className={`w-full text-left flex flex-col md:grid md:grid-cols-[1fr_1.1fr_1.1fr_2.4fr] px-5 md:px-8 py-4 md:py-5 cursor-pointer transition-colors hover:bg-[#FAF7F0] focus:outline-none focus-visible:bg-[#FAF7F0] gap-1 md:gap-3 ${
                    index !== entries.length - 1 ? "border-b border-[#F0E6D8]" : ""
                  }`}
                >
                  <div className="text-[#7A6A60] md:text-[#1A1210] md:font-bold flex items-center text-[13px] md:text-[14px]">
                    {formatAuditTime(entry.occurred_at)}
                  </div>
                  <div className="font-bold text-[#1A1210] flex flex-col justify-center text-[15px]">
                    <span>{entry.actor_name ?? "Unknown employee"}</span>
                    {entry.actor_role && (
                      <span className="text-[12px] font-normal text-[#7A6A60]">{roleDisplayLabel(entry.actor_role)}</span>
                    )}
                  </div>
                  <div className="flex items-center">
                    <span className="text-[11px] font-bold tracking-wide uppercase bg-[#f6e9d9] text-[#8c1c13] px-2 py-1 rounded-md">
                      {auditActionLabel(entry.action)}
                    </span>
                  </div>
                  <div className="text-[#1A1210] flex items-center text-[14px] md:text-[15px] break-words">
                    {entry.summary}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="mt-4 md:mt-8 mb-4 flex justify-center md:justify-end">
          <ManagePagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            pageSize={pageSize}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setCurrentPage(1);
            }}
          />
        </div>
      </div>

      <AuditLogModal
        isOpen={selectedEntry !== null}
        onClose={() => setSelectedEntry(null)}
        entry={selectedEntry}
      />
    </div>
  );
}
