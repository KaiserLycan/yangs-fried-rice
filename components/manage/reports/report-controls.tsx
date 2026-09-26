"use client";

import { useId, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronDown, Download, Loader2 } from "lucide-react";
import { generateSalesPDF, generatePerformancePDF } from "@/lib/actions/reports";
import {
  REPORT_TYPES,
  SALES_REPORT,
  normalizeReportType,
  reportPdfFileName,
} from "@/lib/reports/report-types";
import { useToast } from "@/components/ui/toast";
import { DROPDOWN_FOCUS_RING, useDropdown } from "@/lib/hooks/use-dropdown";
import { cn } from "@/lib/utils";

interface DateInputProps {
  label: string;
  max: string;
  value: string;
  onChange: (value: string) => void;
}

function DateInput({ label, max, value, onChange }: DateInputProps) {
  const id = useId();
  return (
    <div className="flex w-full md:w-auto md:min-w-[160px] flex-col gap-[6px]">
      <label htmlFor={id} className="text-[11px] font-bold uppercase tracking-[1.32px] text-[#7a6a60]">
        {label}
      </label>
      {/* The input drops its own outline to sit flush in this box, so the box
          shows the focus ring instead. */}
      <div className="flex rounded-[12px] border border-[#ddcdb8] bg-white p-3 md:p-[14px] focus-within:ring-2 focus-within:ring-[#E8541F]">
        <input
          id={id}
          type="date"
          max={max}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-transparent text-[13px] md:text-[15px] text-[#1a1210] outline-none"
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
        <label {...menu.labelProps} className="text-[11px] font-bold uppercase tracking-[1.32px] text-[#7a6a60]">
          Report Type
        </label>
        <button
          {...menu.triggerProps}
          className={cn(
            "flex h-[50px] w-full items-center justify-between gap-[10px] rounded-[12px] border border-[#ddcdb8] bg-white px-[14px]",
            DROPDOWN_FOCUS_RING,
          )}
        >
          <span className="truncate text-[15px] text-[#1a1210]">{selected}</span>
          <ChevronDown aria-hidden="true" className="h-5 w-5 shrink-0 text-[#1a1210]" />
        </button>
      </div>

      {isOpen && (
        <div {...menu.listProps} className="absolute top-full z-10 mt-2 w-full min-w-[200px] overflow-hidden rounded-[12px] border border-[#ddcdb8] bg-white p-1 shadow-lg">
          {options.map((option) => (
            <button
              key={option}
              {...menu.optionProps(option === selected)}
              onClick={() => {
                const params = new URLSearchParams(searchParams.toString());
                params.set("type", option);
                router.push(`?${params.toString()}`);
                menu.close();
              }}
              className={cn(
                "w-full rounded-[8px] px-[14px] py-[10px] text-left text-[15px] text-[#1a1210] hover:bg-[#fbf6ec]",
                DROPDOWN_FOCUS_RING,
                option === selected && "bg-[#f6e9d9] font-bold text-[#8c1c13]",
              )}
            >
              {option}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

interface ReportDateFiltersProps {
  startDate: string;
  endDate: string;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  reportType: string;
}

export function ReportDateFilters({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  reportType,
}: ReportDateFiltersProps) {
  const [isExporting, setIsExporting] = useState(false);
  const showToast = useToast();

  // Get current date in YYYY-MM-DD format for the max attribute
  const today = new Date().toISOString().split("T")[0];

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

      <button
        onClick={handleExport}
        disabled={isExporting || !startDate || !endDate || endDate < startDate}
        className="flex h-[50px] w-full md:w-auto items-center justify-center md:justify-start gap-[10px] rounded-[12px] bg-[#b8352a] px-[20px] text-[15px] font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isExporting ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <Download className="h-5 w-5" />
        )}
        <span>{isExporting ? "Generating..." : "Export to PDF"}</span>
      </button>
    </div>
  );
}