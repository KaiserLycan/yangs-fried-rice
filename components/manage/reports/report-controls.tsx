"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronDown, Download, Loader2 } from "lucide-react";
import { generateSalesPDF, generatePerformancePDF } from "@/lib/actions/reports";
import { REPORT_TYPES, SALES_REPORT, normalizeReportType } from "@/lib/reports/report-types";

interface DateInputProps {
  label: string;
  max: string;
  value: string;
  onChange: (value: string) => void;
}

function DateInput({ label, max, value, onChange }: DateInputProps) {
  return (
    <div className="flex w-full md:w-auto md:min-w-[160px] flex-col gap-[6px]">
      <label className="text-[11px] font-bold uppercase tracking-[1.32px] text-[#7a6a60]">
        {label}
      </label>
      <div className="flex rounded-[12px] border border-[#ddcdb8] bg-white p-3 md:p-[14px]">
        <input
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

  const selected = normalizeReportType(searchParams.get("type"));
  const options = REPORT_TYPES;

  return (
    // Fixed width, sized for the longest option ("Menu & Customer Satisfaction"),
    // so the box is the same size whichever report is selected.
    <div className="relative w-full md:w-[320px]">
      <div className="flex flex-col gap-[6px]">
        <label className="text-[11px] font-bold uppercase tracking-[1.32px] text-[#7a6a60]">
          Report Type
        </label>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex h-[50px] w-full items-center justify-between gap-[10px] rounded-[12px] border border-[#ddcdb8] bg-white px-[14px] outline-none"
        >
          <span className="truncate text-[15px] text-[#1a1210]">{selected}</span>
          <ChevronDown className="h-5 w-5 shrink-0 text-[#1a1210]" />
        </button>
      </div>

      {isOpen && (
        <div className="absolute top-full z-10 mt-2 w-full min-w-[200px] overflow-hidden rounded-[12px] border border-[#ddcdb8] bg-white shadow-lg">
          {options.map((option) => (
            <button
              key={option}
              onClick={() => {
                const params = new URLSearchParams(searchParams.toString());
                params.set("type", option);
                router.push(`?${params.toString()}`);
                setIsOpen(false);
              }}
              className="w-full px-[14px] py-[10px] text-left text-[15px] text-[#1a1210] hover:bg-[#fbf6ec]"
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

  // Get current date in YYYY-MM-DD format for the max attribute
  const today = new Date().toISOString().split("T")[0];

  const handleExport = async () => {
    setIsExporting(true);

    try {
      let result;

      if (normalizeReportType(reportType) !== SALES_REPORT) {
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
        alert(`Export failed: ${result.error}`);
        return;
      }

      if (result.data) {
        // The server returns a base64 data URI — open it in a new tab so the user can download
        const link = document.createElement("a");
        link.href = result.data;
        link.download = `yangs-report-${startDate}-to-${endDate}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (err) {
      alert("Export failed. Please try again.");
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
        disabled={isExporting}
        className="flex h-[50px] w-full md:w-auto items-center justify-center md:justify-start gap-[10px] rounded-[12px] bg-[#b8352a] px-[20px] text-[15px] font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
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