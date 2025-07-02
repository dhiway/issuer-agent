#!/usr/bin/python3

import os
import psycopg2
from datetime import datetime, timedelta
from dotenv import load_dotenv

# Load .env file
load_dotenv()

# DB config
db_config = {
    "database": os.environ.get("STUDIO_TYPEORM_DATABASE", "issuer_agent"),
    "user": os.environ.get("STUDIO_TYPEORM_USERNAME", "postgres"),
    "password": os.environ.get("STUDIO_TYPEORM_PASSWORD", "secret"),
    "host": os.environ.get("DB_HOST", "localhost"),
    "port": int(os.environ.get("STUDIO_TYPEORM_PORT", 5574)),
}

# Connect to the database
try:
    conn = psycopg2.connect(**db_config)
except Exception as e:
    print("❌ Database connection failed:", e)
    exit(1)

cur = conn.cursor()

# Fetch all distinct non-null tokens
cur.execute('SELECT DISTINCT token FROM cred WHERE token IS NOT NULL')
tokens = [row[0] for row in cur.fetchall()]

last_month_start = "date_trunc('month', CURRENT_DATE - INTERVAL '1 month')"
this_month_start = "date_trunc('month', CURRENT_DATE)"
last_month_name = (datetime.now().replace(day=1) - timedelta(days=1)).strftime('%B %Y')

print(f"📄 Credential Summary Report for {last_month_name}\n")

for token in tokens:
    # Count issued last month
    cur.execute(f"""
        SELECT COUNT(*) FROM cred
        WHERE token = %s
        AND created_at >= {last_month_start}
        AND created_at < {this_month_start}
    """, (token,))
    last_month_count = cur.fetchone()[0]

    # Count all-time
    cur.execute('SELECT COUNT(*) FROM cred WHERE token = %s', (token,))
    total_count = cur.fetchone()[0]



cur.close()
conn.close()
