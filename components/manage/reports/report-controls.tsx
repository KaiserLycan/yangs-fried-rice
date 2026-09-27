"use client";

import { useId, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronDown, Download, Loader2 } from "lucide-react";
import { generateSalesPDF, generatePerformancePDF, exportReportCSV } from "@/lib/actions/reports";
import {
  REPORT_TYPES,
  SALES_REPORT,
  normalizeReportType,
  reportPdfFileName,
} from "@/lib/reports/report-types";
import { useToast } from "@/components/ui/toast";
import { DROPDOWN_FOCUS_RING, useDropdown } from "@/lib/hooks/use-dropdown";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface DateInputProps {
  label: string;
  max: string;
  value: string;
  onChange: (value: string) => void;
}

export function DateInput({ label, max, value, onChange }: DateInputProps) {
  const id = useId();
  return (
    <div className="flex w-full md:w-auto md:min-w-[160px] flex-col gap-[6px]">
      <label htmlFor={id} className="text-xs font-bold uppercase tracking-[1.32px] text-muted-foreground">
        {label}
      </label>
      {/* The input drops its own outline to sit flush in this box, so the box
          shows the focus ring instead. */}
      {/* A fixed height, not just padding: a date input's intrinsic height
          differs by browser, and the boxes beside it (the reports Export
          button, the audit log's filters) are sized to match exactly. */}
      <div className="flex h-[46px] md:h-[50px] items-center rounded-md border border-field-border bg-white px-3 md:px-[14px] focus-within:ring-2 focus-within:ring-accent">
        <input
          id={id}
          type="date"
          max={max}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-transparent text-sm md:text-base text-foreground outline-none"
        />
      </div>
    </div>
  );
}

export function ReportTypeSelect() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);
  const menu = useDropdown({ open: isOpen, onOpenChange: setIsOpen });

  const selected = normalizeReportType(searchParams.get("type"));
  const options = REPORT_TYPES;

  return (
    // Fixed width, sized for the longest option ("Menu & Customer Satisfaction"),
    // so the box is the same size whichever report is selected.
    <div className="relative w-full md:w-[320px]">
      <div className="flex flex-col gap-[6px]">
        <label {...menu.labelProps} className="text-xs font-bold uppercase tracking-[1.32px] text-muted-foreground">
          Report Type
        </label>
        <Button variant="unstyled"
          {...menu.triggerProps}
          className={cn(
            "flex h-[50px] w-full items-center justify-between gap-[10px] rounded-md border border-field-border bg-white px-[14px]",
            DROPDOWN_FOCUS_RING,
          )}
        >
          <span className="truncate text-base text-foreground">{selected}</span>
          <ChevronDown aria-hidden="true" className="h-5 w-5 shrink-0 text-foreground" />
        </Button>
      </div>

      {isOpen && (
        <div {...menu.listProps} className="absolute top-full z-10 mt-2 w-full min-w-[200px] overflow-hidden rounded-md border border-field-border bg-white p-1 shadow-lg">
          {options.map((option) => (
            <Button variant="unstyled"
              key={option}
              {...menu.optionProps(option === selected)}
              onClick={() => {
                const params = new URLSearchParams(searchParams.toString());
                params.set("type", option);
                router.push(`?${params.toString()}`);
                menu.close();
              }}
              className={cn(
                "w-full rounded-sm px-[14px] py-[10px] text-left text-base text-foreground hover:bg-background",
                DROPDOWN_FOCUS_RING,
                option === selected && "bg-highlight font-bold text-primary",
              )}
            >
              {option}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}

interface ReportDateFiltersProps {
  isManager?: boolean;
  startDate: string;
  endDate: string;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  reportType: string;
}

export function ReportDateFilters({
  isManager,
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  reportType,
}: ReportDateFiltersProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [isExportingCSV, setIsExportingCSV] = useState(false);
  const showToast = useToast();

  // Get current date in YYYY-MM-DD format for the max attribute
  const today = new Date().toISOString().split("T")[0];

  const handleExportCSV = async () => {
    setIsExportingCSV(true);
    try {
      const type = normalizeReportType(reportType);
      const result = await exportReportCSV({ start_date: startDate, end_date: endDate }, type);
      if (result.error) {
        showToast(`Couldn't export CSV: ${result.error}`, "error");
      } else if (result.data) {
        const blob = new Blob([result.data], { type: "text/csv;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        // Same name as the PDF of the same report, so the two sort together.
        link.download = reportPdfFileName(type, startDate, endDate).replace(/\.pdf$/, ".csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
    } catch {
      showToast("Couldn't export CSV. Please try again.", "error");
    } finally {
      setIsExportingCSV(false);
    }
  };

  const handleExport = async () => {
    setIsExporting(true);

    const type = normalizeReportType(reportType);
    try {
      let result;

      if (type !== SALES_REPORT) {
        // The merged menu + customer-satisfaction view exports the performance report
        result = await generatePerformancePDF({
          start_date: startDate,
          end_date: endDate,
          top_products: 10,
        });
      } else {
        // Default: Sales report
        result = await generateSalesPDF({
          start_date: startDate,
          end_date: endDate,
          frequency: "daily",
        });
      }

      if (result.error) {
        // Used to go to the console only, so a failed export looked like a
        // button that did nothing.
        showToast(`Couldn't export the report: ${result.error}`, "error");
        return;
      }

      if (result.data) {
        // The server returns a base64 data URI — open it in a new tab so the user can download
        const link = document.createElement("a");
        link.href = result.data;
        link.download = reportPdfFileName(type, startDate, endDate);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch {
      showToast("Couldn't export the report. Please try again.", "error");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex flex-col md:flex-row items-stretch md:items-end md:justify-end gap-4 md:gap-[20px]">
      <div className="grid grid-cols-2 md:flex gap-3 md:gap-[10px]">
        <DateInput
          label="Start Date"
          max={today}
          value={startDate}
          onChange={onStartDateChange}
        />
        <DateInput
          label="End Date"
          max={today}
          value={endDate}
          onChange={onEndDateChange}
        />
      </div>

      <Button variant="unstyled"
        onClick={handleExport}
        disabled={isExporting || !startDate || !endDate || endDate < startDate}
        className="flex h-[50px] w-full md:w-auto items-center justify-center md:justify-start gap-[10px] rounded-md bg-backoffice px-[20px] text-base font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isExporting ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <Download className="h-5 w-5" />
        )}
        <span>{isExporting ? "Generating..." : "Export to PDF"}</span>
      </Button>

      {/* Both report views export; the server checks for a manager too. */}
      {isManager && (
        <Button variant="unstyled"
          onClick={handleExportCSV}
          disabled={isExportingCSV || isExporting || !startDate || !endDate || endDate < startDate}
          className="flex h-[50px] w-full md:w-auto items-center justify-center md:justify-start gap-[10px] rounded-md bg-status-preparing px-[20px] text-base font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isExportingCSV ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Download className="h-5 w-5" />
          )}
          <span>{isExportingCSV ? "Generating..." : "Export CSV"}</span>
        </Button>
      )}
    </div>
  );
}