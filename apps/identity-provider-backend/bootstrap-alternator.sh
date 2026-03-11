#!/bin/sh

set -eu

ENDPOINT="${DYNAMODB_ENDPOINT:-http://scylla-alternator:8000}"
REGION="${AWS_REGION:-us-west-2}"

export AWS_ACCESS_KEY_ID="${AWS_ACCESS_KEY_ID:-alternator}"
export AWS_SECRET_ACCESS_KEY="${AWS_SECRET_ACCESS_KEY:-alternator}"
export AWS_DEFAULT_REGION="$REGION"

wait_for_alternator() {
  attempts=0
  until aws dynamodb list-tables --endpoint-url "$ENDPOINT" >/dev/null 2>&1; do
    attempts=$((attempts + 1))
    if [ "$attempts" -ge 60 ]; then
      echo "Timed out waiting for Alternator at $ENDPOINT" >&2
      exit 1
    fi
    sleep 2
  done
}

ensure_table() {
  table_name="$1"
  create_payload="$2"

  if aws dynamodb describe-table --table-name "$table_name" --endpoint-url "$ENDPOINT" >/dev/null 2>&1; then
    echo "Table $table_name already exists"
    return 0
  fi

  aws dynamodb create-table --cli-input-json "$create_payload" --endpoint-url "$ENDPOINT"
}

enable_ttl() {
  table_name="$1"
  ttl_attribute="$2"

  aws dynamodb update-time-to-live \
    --table-name "$table_name" \
    --time-to-live-specification "Enabled=true,AttributeName=$ttl_attribute" \
    --endpoint-url "$ENDPOINT" >/dev/null 2>&1 || true
}

wait_for_alternator

ensure_table "futureverse-oauth" '{
  "TableName": "futureverse-oauth",
  "BillingMode": "PAY_PER_REQUEST",
  "AttributeDefinitions": [
    {"AttributeName": "modelId", "AttributeType": "S"},
    {"AttributeName": "grantId", "AttributeType": "S"},
    {"AttributeName": "uid", "AttributeType": "S"},
    {"AttributeName": "userCode", "AttributeType": "S"}
  ],
  "KeySchema": [
    {"AttributeName": "modelId", "KeyType": "HASH"}
  ],
  "GlobalSecondaryIndexes": [
    {
      "IndexName": "grantIdIndex",
      "KeySchema": [{"AttributeName": "grantId", "KeyType": "HASH"}],
      "Projection": {"ProjectionType": "ALL"}
    },
    {
      "IndexName": "uidIndex",
      "KeySchema": [{"AttributeName": "uid", "KeyType": "HASH"}],
      "Projection": {"ProjectionType": "ALL"}
    },
    {
      "IndexName": "userCodeIndex",
      "KeySchema": [{"AttributeName": "userCode", "KeyType": "HASH"}],
      "Projection": {"ProjectionType": "ALL"}
    }
  ]
}'

ensure_table "oidc-sessions" '{
  "TableName": "oidc-sessions",
  "BillingMode": "PAY_PER_REQUEST",
  "AttributeDefinitions": [
    {"AttributeName": "modelId", "AttributeType": "S"},
    {"AttributeName": "grantId", "AttributeType": "S"},
    {"AttributeName": "uid", "AttributeType": "S"},
    {"AttributeName": "userCode", "AttributeType": "S"}
  ],
  "KeySchema": [
    {"AttributeName": "modelId", "KeyType": "HASH"}
  ],
  "GlobalSecondaryIndexes": [
    {
      "IndexName": "grantId-index",
      "KeySchema": [{"AttributeName": "grantId", "KeyType": "HASH"}],
      "Projection": {"ProjectionType": "ALL"}
    },
    {
      "IndexName": "uid-index",
      "KeySchema": [{"AttributeName": "uid", "KeyType": "HASH"}],
      "Projection": {"ProjectionType": "ALL"}
    },
    {
      "IndexName": "userCode-index",
      "KeySchema": [{"AttributeName": "userCode", "KeyType": "HASH"}],
      "Projection": {"ProjectionType": "ALL"}
    }
  ]
}'

ensure_table "futureverse-user" '{
  "TableName": "futureverse-user",
  "BillingMode": "PAY_PER_REQUEST",
  "AttributeDefinitions": [
    {"AttributeName": "id", "AttributeType": "S"},
    {"AttributeName": "eoa", "AttributeType": "S"}
  ],
  "KeySchema": [
    {"AttributeName": "id", "KeyType": "HASH"}
  ],
  "GlobalSecondaryIndexes": [
    {
      "IndexName": "eoa-index",
      "KeySchema": [{"AttributeName": "eoa", "KeyType": "HASH"}],
      "Projection": {"ProjectionType": "ALL"}
    }
  ]
}'

ensure_table "futureverse-quest-completion" '{
  "TableName": "futureverse-quest-completion",
  "BillingMode": "PAY_PER_REQUEST",
  "AttributeDefinitions": [
    {"AttributeName": "questId", "AttributeType": "S"},
    {"AttributeName": "futurepass", "AttributeType": "S"}
  ],
  "KeySchema": [
    {"AttributeName": "questId", "KeyType": "HASH"},
    {"AttributeName": "futurepass", "KeyType": "RANGE"}
  ]
}'

enable_ttl "futureverse-oauth" "expiresAt"
enable_ttl "oidc-sessions" "expiresAt"

echo "Scylla Alternator bootstrap complete"
