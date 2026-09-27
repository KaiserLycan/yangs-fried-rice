const fs = require('fs');
let c = fs.readFileSync('components/manage/kds/kds-order-card.tsx', 'utf8');

c = c.replace(
  /import type \{ OrderData \} from "@\/types\/staff-order";/,
  `import type { OrderData } from "@/types/staff-order";\nimport { useKdsTimer } from "@/hooks/use-kds-timer";`
);

c = c.replace(
  /export function KdsOrderCard\(\{ order, onAction \}: KdsOrderCardProps\) \{/,
  `export function KdsOrderCard({ order, onAction }: KdsOrderCardProps) {\n  const { timerString, color: timerColor } = useKdsTimer(order.rawCreatedAt);`
);

c = c.replace(
  /className=\{\`flex flex-col p-\[12px\] shrink-0 w-full \$\{isConfirmed \? "bg-\[#ca762d\]" : "bg-\[#c0392b\]"\}\`\}/,
  `className={\`flex flex-col p-[12px] shrink-0 w-full \${
          timerColor === "red"
            ? "bg-red-700 animate-pulse"
            : timerColor === "amber"
            ? "bg-amber-600"
            : isConfirmed
            ? "bg-[#ca762d]"
            : "bg-[#c0392b]"
        }\`}`
);

c = c.replace(
  /\{order\.timer || "0:00"\}/,
  `{timerString}`
);

if (!c.includes("order.orderInfo.specialInstructions")) {
  c = c.replace(
    /<\/div>\r?\n\s+<\/div>\r?\n\r?\n\s+\{\/\* Footer Buttons \*\/\}/,
    `      </div>
      </div>
      {order.orderInfo.specialInstructions && (
        <div className="p-3 bg-yellow-100 border-t border-yellow-200 shrink-0">
          <span className="font-bold text-[11px] text-yellow-800 uppercase tracking-widest block mb-1">Order Note:</span>
          <p className="text-[13px] text-yellow-900 font-bold leading-tight">{order.orderInfo.specialInstructions}</p>
        </div>
      )}

      {/* Footer Buttons */}`
  );
}

fs.writeFileSync('components/manage/kds/kds-order-card.tsx', c);
