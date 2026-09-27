const fs = require('fs');
let c = fs.readFileSync('lib/actions/orders.ts', 'utf8');
c = c.replace(/add_on \( name, price \)/g, `add_on ( add_on_name, price )`);
fs.writeFileSync('lib/actions/orders.ts', c);
