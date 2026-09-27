const fs = require('fs');
let c = fs.readFileSync('lib/actions/orders.ts', 'utf8');

c = c.replace(/add_on \( add_on_name, price \)/g, `add_on ( name, price )`);

fs.writeFileSync('lib/actions/orders.ts', c);
