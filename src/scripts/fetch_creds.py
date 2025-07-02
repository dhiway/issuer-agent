#!/usr/bin/python3
from dotenv import load_dotenv
import os
import psycopg2
from datetime import datetime, timedelta

load_dotenv()

# Load DB config from environment
db_config = {
    "database": os.environ.get("STUDIO_TYPEORM_DATABASE", "issuer_agent"),
    "user": os.environ.get("STUDIO_TYPEORM_USERNAME", "postgres"),
    "password": os.environ.get("STUDIO_TYPEORM_PASSWORD", "secret"),
    "host": os.environ.get("DB_HOST", "localhost"),
    "port": int(os.environ.get("STUDIO_TYPEORM_PORT", 5574)),
}

conn = psycopg2.connect(**db_config)
cur = conn.cursor()

# Get last month date range
query = """
SELECT "id", "identifier", "active", "schemaId", "fromDid", "credHash", "created_at"
FROM "cred"
WHERE "created_at" >= date_trunc('month', CURRENT_DATE - INTERVAL '1 month')
  AND "created_at" < date_trunc('month', CURRENT_DATE)
ORDER BY "created_at" DESC
"""

cur.execute(query)
rows = cur.fetchall()

# Print header
print("{:<40}, {:<20}, {:<7}, {:<10}, {:<20}, {:<64}, {}".format(
    "ID", "Identifier", "Active", "SchemaID", "FromDID", "CredHash", "CreatedAt"
))
print("-" * 180)

# Print row data
for row in rows:
    id, identifier, active, schemaId, fromDid, credHash, created_at = row
    print("{:<40}, {:<20}, {:<7}, {:<10}, {:<20}, {:<64}, {}".format(
        id or '',
        identifier or '',
        str(active),
        schemaId or '',
        fromDid or '',
        credHash or '',
        created_at.strftime("%Y-%m-%d %H:%M:%S")
    ))

# Add reporting summary
last_month_str = (datetime.now().replace(day=1) - timedelta(days=1)).strftime("%B %Y")
print(f"\nTotal credentials issued in {last_month_str}: {len(rows)}\n")

# Cleanup
cur.close()
conn.close()
