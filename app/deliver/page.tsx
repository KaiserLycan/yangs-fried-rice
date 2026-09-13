import { Bike } from "lucide-react";

export default function DeliverHomePage() {
  return (
    <div className="flex flex-col items-center justify-center h-full w-full bg-[#FAF5EB]/50 p-8 text-center">
      <div className="bg-white p-6 rounded-full shadow-sm mb-6 border border-[#DDCDB8]">
        <Bike className="w-12 h-12 text-[#E8541F]" />
      </div>
      <h2 className="font-display text-[24px] text-[#1A1210] mb-2">
        Ready to ride?
      </h2>
      <p className="text-[15px] text-[#7A6A60] max-w-[300px]">
        Select a delivery from the queue to see the map, route instructions, and complete the drop-off.
      </p>
    </div>
  );
}
