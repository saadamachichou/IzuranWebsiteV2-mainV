#!/bin/bash

# Add NODE_ENV as production to ensure we're connecting to the actual database
export NODE_ENV=production

# Execute the migration script
echo "Running product and payment migration..."
npx tsx db/product-payment-migrate.ts
echo "Migration complete!"