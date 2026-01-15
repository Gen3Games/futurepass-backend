resource "aws_dynamodb_table" "futureverse-oauth" {
  deletion_protection_enabled = true
  name         = "futureverse-oauth"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "modelId"
  attribute {
    name = "modelId"
    type = "S"
  }
  attribute {
    name = "grantId"
    type = "S"
  }

  attribute {
    name = "uid"
    type = "S"
  }

  attribute {
    name = "userCode"
    type = "S"
  }
  ttl {
    attribute_name = "expiresAt"
    enabled        = true
  }

  global_secondary_index {
    name            = "grantIdIndex"
    hash_key        = "grantId"
    projection_type = "ALL"
  }

  global_secondary_index {
    name            = "uidIndex"
    hash_key        = "uid"
    projection_type = "ALL"
  }

  global_secondary_index {
    name            = "userCodeIndex"
    hash_key        = "userCode"
    projection_type = "ALL"
  }
}

resource "aws_dynamodb_table" "futureverse-user" {
  deletion_protection_enabled = true
  name         = "futureverse-user"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "id"
  attribute {
    name = "id"
    type = "S"
  }
  attribute {
    name = "eoa"
    type = "S"
  }
  global_secondary_index {
    name            = "eoa-index"
    hash_key        = "eoa"
    projection_type = "ALL"
  }
}


resource "aws_dynamodb_table" "futureverse-quest-completion" {
  deletion_protection_enabled = true
  name         = "futureverse-quest-completion"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "questId"
  range_key    = "futurepass"
  attribute {
    name = "questId"
    type = "S"
  }
  attribute {
    name = "futurepass"
    type = "S"
  }
}
