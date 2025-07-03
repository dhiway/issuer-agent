#!/bin/bash

SCRIPT_PATH="/home/ubuntu/wallet-backend-workspace/issuer-agent/scripts/send_activity.sh"
CRON_JOB="0 9 1 * * $SCRIPT_PATH >> /home/ubuntu/wallet-backend-workspace/issuer-agent/scripts/send.log 2>&1"

# Ensure script is executable
if [ ! -x "$SCRIPT_PATH" ]; then
  chmod +x "$SCRIPT_PATH"
  echo "Made $SCRIPT_PATH executable."
fi

# Remove old instance if exists
crontab -l 2>/dev/null | grep -v "$SCRIPT_PATH" > /tmp/current_cron

# Add new cron job
echo "$CRON_JOB" >> /tmp/current_cron
crontab /tmp/current_cron
rm /tmp/current_cron

echo "✅ Cron job installed"
