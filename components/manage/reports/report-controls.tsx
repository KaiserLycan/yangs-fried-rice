"use client";

import { ChevronDown, Download } from "lucide-react";
import { useState } from "react";

function DateInput({ label, placeholder }: { label: string; placeholder: string }) {
  return (
    <div className="flex w-full md:w-[113px] flex-col gap-[6px]">
      <label className="text-[11px] font-bold uppercase tracking-[1.32px] text-[#7a6a60]">
        {label}
      </label>
      <div className="flex rounded-[12px] border border-[#ddcdb8] bg-white p-3 md:p-[14px]">
        <input
          type="text"
          placeholder={placeholder}
          className="w-full bg-transparent text-[13px] md:text-[15px] text-[#a2938a] outline-none placeholder:text-[#a2938a]"
        />
      </div>
    </div>
  );
}

export function ReportTypeSelect() {
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState("Sales and Order");

  const options = [
    "Sales and Order",
    "Customer Satisfaction",
    "Menu Items reports",
  ];

  return (
    <div className="relative w-full md:w-fit">
      <div className="flex flex-col gap-[6px]">
        <label className="text-[11px] font-bold uppercase tracking-[1.32px] text-[#7a6a60]">
          Report Type
        </label>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex h-[50px] w-full justify-between md:justify-start items-center gap-[10px] rounded-[12px] border border-[#ddcdb8] bg-white px-[14px] outline-none"
        >
          <span className="text-[15px] text-[#1a1210]">{selected}</span>
          <ChevronDown className="h-5 w-5 text-[#1a1210]" />
        </button>
      </div>

      {isOpen && (
        <div className="absolute top-full z-10 mt-2 w-full min-w-[200px] overflow-hidden rounded-[12px] border border-[#ddcdb8] bg-white shadow-lg">
          {options.map((option) => (
            <button
              key={option}
              onClick={() => {
                setSelected(option);
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

export function ReportDateFilters() {
  const handleExport = () => {
    const link = document.createElement("a");
    link.href = "/sample-report.pdf";
    link.download = "yangs-fried-rice-report.pdf";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col md:flex-row items-stretch md:items-end md:justify-end gap-4 md:gap-[20px]">
      <div className="grid grid-cols-2 md:flex gap-3 md:gap-[10px]">
        <DateInput label="Start Date" placeholder="09/15/2005" />
        <DateInput label="End Date" placeholder="09/15/2005" />
      </div>

      <button
        onClick={handleExport}
        className="flex h-[50px] w-full md:w-auto items-center justify-center md:justify-start gap-[10px] rounded-[12px] bg-[#b8352a] px-[20px] text-[15px] font-bold text-white transition-opacity hover:opacity-90"
      >
        <Download className="h-5 w-5" />
        <span>Export to PDF</span>
      </button>
    </div>
  );
}