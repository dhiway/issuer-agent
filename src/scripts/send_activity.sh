#!/bin/bash

source "$(dirname "$0")/../.env"

today=$(date +%Y-%m-%d)

SUMMARY=$(python3 "$(dirname "$0")/fetch_creds.py")

SUMMARY_ESCAPED=$(echo "$SUMMARY" | sed ':a;N;$!ba;s/"/\\"/g;s/\n/\\n/g')

# Send email via SendGrid
curl --request POST \
  --url https://api.sendgrid.com/v3/mail/send \
  --header "Authorization: Bearer ${SENDGRID_API_KEY}" \
  --header 'Content-Type: application/json' \
  --data "{
    \"personalizations\": [{
      \"to\": [{\"email\": \"prashant@dhiway.com\"}]
    }],
    \"from\": {
      \"email\": \"prashant@dhiway.com\",
      \"name\": \"Issuer Agent Bot\"
    },
    \"subject\": \"Credential Issuance Summary - ${today}\",
    \"content\": [{
      \"type\": \"text/plain\",
      \"value\": \"${SUMMARY_ESCAPED}\"
    }]
  }"
