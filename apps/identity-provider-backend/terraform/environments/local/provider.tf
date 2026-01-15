terraform {
  required_version = "~> 1.4.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 4.0"
    }
  }
}

provider "aws" {
  access_key = "local"
  secret_key = "local"

  region = "us-west-2"

  s3_use_path_style           = true
  skip_credentials_validation = true
  skip_metadata_api_check     = true
  skip_requesting_account_id  = true

  endpoints {
    apigatewayv2   = "http://localstack-main:4566"
    cloudwatch     = "http://localstack-main:4566"
    dynamodb       = "http://localstack-main:4566"
    events         = "http://localstack-main:4566"
    iam            = "http://localstack-main:4566"
    kinesis        = "http://localstack-main:4566"
    lambda         = "http://localstack-main:4566"
    logs           = "http://localstack-main:4566"
    s3             = "http://localstack-main:4566"
    secretsmanager = "http://localstack-main:4566"
    ses            = "http://localstack-main:4566"
    sns            = "http://localstack-main:4566"
    sqs            = "http://localstack-main:4566"
    ssm            = "http://localstack-main:4566"
    sts            = "http://localstack-main:4566"
  }
}
