terraform {
  required_version = "~> 1.3.4"

  backend "s3" {
    bucket         = "futureverse-terraform-identity-prod-prod"
    dynamodb_table = "terraform-locks"
    key            = "identity-monorepo"
    region         = "us-west-2"
    encrypt        = true
    acl            = "bucket-owner-full-control"
  }

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 4.0"
    }
  }
}

provider "aws" {
  region              = "us-west-2"
  allowed_account_ids = ["215540320247"]
  default_tags {
    tags = {
      CostCenter = "futureverse-identity-oidc"
    }
  }
}

provider "aws" {
  alias  = "us-east-1"
  region = "us-east-1"

  default_tags {
    tags = {
      "Cost Center" = "futureverse-identity-oidc",
    }
  }
}
