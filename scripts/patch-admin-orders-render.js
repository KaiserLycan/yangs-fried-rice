const fs = require('fs');
let c = fs.readFileSync('app/manage/orders/page.tsx', 'utf8');

c = c.replace(
  `                    <div key={order.id} className="h-[280px]">
                      <OrderCard 
                        order={order} 
                        onClick={() => setSelectedOrder(order)} 
                        onAction={(type, order) => setConfirmAction({ type, order })}
                      />
                    </div>`,
  `                    <div key={order.id} className="h-[280px]">
                      {(() => {
                        const issue = paymentIssues.find(i => i.order.order_id === order.id);
                        const isPaymentFailed = issue?.type === "payment_failed";
                        const isFailedPickup = issue?.type === "pickup_overdue";
                        const isCash = ["pay_in_store", "pay-in-store", "cash"].includes(order.paymentMethod || "");

                        return (
                          <OrderCard 
                            order={order} 
                            onClick={() => setSelectedOrder(order)} 
                            onAction={(type, order) => setConfirmAction({ type, order })}
                            timerTimestamp={isFailedPickup ? order.rawReadyAt : order.rawCreatedAt}
                            amberMins={isFailedPickup ? 999 : 15}
                            redMins={isFailedPickup ? 90 : 25}
                            hideTimer={isPaymentFailed}
                            fixedBadge={
                              isPaymentFailed
                                ? { text: "Payment Issue", bgClass: "bg-red-200", textClass: "text-red-900" }
                                : isFailedPickup && isCash
                                ? { text: "Pay In-store", bgClass: "bg-blue-100", textClass: "text-blue-700" }
                                : undefined
                            }
                          />
                        );
                      })()}
                    </div>`
);

fs.writeFileSync('app/manage/orders/page.tsx', c);
