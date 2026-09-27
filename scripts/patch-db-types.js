const fs = require('fs');
let c = fs.readFileSync('types/database.types.ts', 'utf8');

c = c.replace(
  `            pending_at: string | null`,
  `            pending_at: string | null
            ready_at: string | null`
);

c = c.replace(
  `            pending_at?: string | null`,
  `            pending_at?: string | null
            ready_at?: string | null`
);

c = c.replace(
  `            pending_at?: string | null`,
  `            pending_at?: string | null
            ready_at?: string | null`
);

fs.writeFileSync('types/database.types.ts', c);
