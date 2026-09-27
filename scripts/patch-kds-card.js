const fs = require('fs');
let c = fs.readFileSync('components/manage/kds/kds-order-card.tsx', 'utf8');

c = c.replace(
  `  return (
    <div className="bg-[#fbf6ec] border border-field-border flex flex-col overflow-hidden rounded-[14px] w-full h-full min-h-[320px] shadow-sm">`,
  `  const isRed = timerColor === "red" && !hideTimer && order.status !== "CANCELED" && order.status !== "COMPLETED";
  const isAmber = timerColor === "amber" && !hideTimer && order.status !== "CANCELED" && order.status !== "COMPLETED";

  return (
    <div className="bg-[#fbf6ec] border border-field-border flex flex-col overflow-hidden rounded-[14px] w-full h-full min-h-[320px] shadow-sm">`
);

c = c.replace(
  `      <div className={\`flex flex-col p-[12px] shrink-0 w-full \${
          order.status === "CANCELED"
            ? "bg-[#797167]"
            : (order.status === "QUEUE" || order.status === "PREP") && timerColor === "red"
            ? "bg-red-700 animate-pulse"
            : order.status === "PREP" && timerColor === "amber"
            ? "bg-amber-600"
            : isConfirmed
            ? "bg-[#ca762d]"
            : "bg-[#c0392b]"
        }\`}>`,
  `      <div className={\`flex flex-col p-[12px] shrink-0 w-full \${
          order.status === "CANCELED"
            ? "bg-[#797167]"
            : isRed
            ? "bg-red-700 animate-pulse"
            : isAmber
            ? "bg-amber-600"
            : isConfirmed
            ? "bg-[#ca762d]"
            : "bg-[#c0392b]"
        }\`}>`
);

c = c.replace(
  `            <span className="font-display text-[#fbf6ec] text-[22px] leading-none">
              {order.status === "CANCELED" ? "-" : timerString}
            </span>`,
  `            {fixedBadge ? (
              <span className={\`inline-block px-2 py-0.5 mt-1 rounded text-[10px] font-bold uppercase tracking-wider \${fixedBadge.bgClass} \${fixedBadge.textClass}\`}>
                {fixedBadge.text}
              </span>
            ) : hideTimer ? null : (
              <span className="font-display text-[#fbf6ec] text-[22px] leading-none">
                {order.status === "CANCELED" ? "-" : timerString}
              </span>
            )}`
);

fs.writeFileSync('components/manage/kds/kds-order-card.tsx', c);
