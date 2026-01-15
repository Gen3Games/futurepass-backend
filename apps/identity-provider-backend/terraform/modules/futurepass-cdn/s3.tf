

resource "aws_s3_bucket" "asset-manager_bucket" {
  bucket = local.bucket_name
}

resource "aws_s3_bucket_public_access_block" "access" {
  bucket = aws_s3_bucket.asset-manager_bucket.id

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

resource "aws_s3_bucket_ownership_controls" "ownership" {
  bucket = aws_s3_bucket.asset-manager_bucket.id

  rule {
    object_ownership = "BucketOwnerEnforced"
  }
}

data "aws_iam_policy_document" "s3_policy" {
  statement {
    actions   = ["s3:GetObject"]
    resources = ["${aws_s3_bucket.asset-manager_bucket.arn}/*"]

    principals {
      type        = "AWS"
      identifiers = ["*"]
    }
  }
}

resource "aws_s3_bucket_policy" "bucket_policy" {
  bucket = aws_s3_bucket.asset-manager_bucket.id
  policy = data.aws_iam_policy_document.s3_policy.json

  depends_on = [aws_s3_bucket_public_access_block.access]
}

// used for custodial auth option icons
resource "aws_s3_bucket" "custodial-auth-option-icons_bucket" {
  bucket = local.custodial_auth_option_icons_bucket_name
}

resource "aws_s3_bucket_public_access_block" "custodial-auth-option-icons_access" {
  bucket = aws_s3_bucket.custodial-auth-option-icons_bucket.id

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

resource "aws_s3_bucket_ownership_controls" "custodial-auth-option-icons_ownership" {
  bucket = aws_s3_bucket.custodial-auth-option-icons_bucket.id

  rule {
    object_ownership = "BucketOwnerEnforced"
  }
}

data "aws_iam_policy_document" "custodial-auth-option-icons_s3_policy" {
  statement {
    actions   = ["s3:GetObject"]
    resources = ["${aws_s3_bucket.custodial-auth-option-icons_bucket.arn}/*"]

    principals {
      type        = "AWS"
      identifiers = ["*"]
    }
  }
}

resource "aws_s3_bucket_policy" "custodial-auth-option-icons_bucket_policy" {
  bucket = aws_s3_bucket.custodial-auth-option-icons_bucket.id
  policy = data.aws_iam_policy_document.custodial-auth-option-icons_s3_policy.json

  depends_on = [aws_s3_bucket_public_access_block.custodial-auth-option-icons_access]
}
