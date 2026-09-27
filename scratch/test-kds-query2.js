const { getDetailedOrders } = require('./lib/actions/orders');
require('dotenv').config();

async function run() {
  const result = await getDetailedOrders({ status: ["ready"], limit: 100, offset: 0 });
  console.log("Found:", result.data?.data?.length);
  console.log("Error:", result.error);
}
run();
