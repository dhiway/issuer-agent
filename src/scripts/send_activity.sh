#!/bin/bash
source $(dirname "$0")/../.env
today=$(date +%Y-%m-%d)
output=activity_file.${today}.txt
python3 $(dirname $0)/scripts/fetch_creds.py > $output

ATTACHMENT0=$(base64 -w 0 $output);


# echo $ACTIVE
# cat output_active.txt
# echo "-------"
# echo $NON_ACTIVE
# cat output_non_active.txt
# echo "-------"


curl --request POST \
   --url https://api.sendgrid.com/v3/mail/send \
   --header "Authorization: Bearer ${SENDGRID_API_KEY}" \
   --header 'Content-Type: application/json' \
   --data "{\"personalizations\": [{\"to\": [{\"email\": \"sales@dhiway.com\"}, {\"email\": \"satish@dhiway.com\"}, {\"email\": \"amar@dhiway.com\"}]}],\"from\": {\"email\": \"hello@dhiway.com\", \"name\": \"Issuer agentMessageBot\"},\"subject\":\"Activity Report\",\"content\": [{\"type\": \"text/html\",\"value\": \"Hi Team,<br>Please find the attachments. It contains details of activity done on issuer-agent on last 30 days.\"}], \"attachments\": [{\"content\": \"${ATTACHMENT0}\", \"type\": \"text/plain\", \"filename\": \"activity.csv\"}]}"


#rm $output
