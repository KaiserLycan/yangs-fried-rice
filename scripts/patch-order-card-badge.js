const fs = require('fs');

let orderCard = fs.readFileSync('components/manage/orders/order-card.tsx', 'utf8');

if (!orderCard.includes('Fulfillment Badge')) {
  orderCard = orderCard.replace(
    `{/* Items List */}`,
    `{/* Fulfillment Badge */}
      {order.fulfillment_method && order.fulfillment_method !== "unspecified" && (
        <div className="px-4 pb-2">
          <span className={\`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold \${
            order.fulfillment_method === "self_pickup" || order.fulfillment_method === "take_out"
              ? "bg-teal-100 text-teal-800"
              : "bg-indigo-100 text-indigo-800"
          }\`}>
            {order.fulfillment_method === "self_pickup" || order.fulfillment_method === "take_out" ? "SELF PICKUP" : "3RD PARTY COURIER"}
          </span>
        </div>
      )}

      {/* Items List */}`
  );
  fs.writeFileSync('components/manage/orders/order-card.tsx', orderCard);
}
