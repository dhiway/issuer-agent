#!/usr/bin/python3
from dotenv import load_dotenv
import os
import psycopg2
from datetime import date, timedelta

load_dotenv()

db_config = {
    "database": os.environ.get("STUDIO_TYPEORM_DATABASE", "issuer_agent"),
    "user": os.environ.get("STUDIO_TYPEORM_USERNAME", "postgres"),
    "password": os.environ.get("STUDIO_TYPEORM_PASSWORD", "secret"),
    "host": os.environ.get("DB_HOST", "localhost"),
    "port": int(os.environ.get("STUDIO_TYPEORM_PORT", 5574))
}


conn = psycopg2.connect(**db_config)

cur = conn.cursor()

# Date range: last 30 days
today = date.today()
hundred_days_ago = today - timedelta(days=30)

# Query to fetch Creds created in the last 30 days
query = """
SELECT "id", "identifier", "active", "schemaId", "fromDid", "credHash", "created_at"
FROM "cred"
WHERE "created_at" >= %s
ORDER BY "created_at" DESC
"""


args = (hundred_days_ago,)
cur.execute(query, args)
rows = cur.fetchall()

# Print formatted results
print("{:<40}, {:<20}, {:<7}, {:<10}, {:<20}, {:<64}, {}".format(
    "ID", "Identifier", "Active", "SchemaID", "FromDID", "CredHash", "CreatedAt"
))
print("-" * 180)

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

print(f"\nTotal credentials issued in last 30 days: {len(rows)}\n")

cur.close()
conn.close()
