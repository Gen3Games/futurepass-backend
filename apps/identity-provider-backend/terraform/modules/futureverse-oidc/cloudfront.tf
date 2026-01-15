locals {
  origin_key                     = replace(var.domain_name, ".", "-")
  second_level_domain_name       = regex("[a-z]*.[a-z]*.[a-z]$", var.domain_name)
  second_level_extra_domain_name = regex("[a-z]*.[a-z]*.[a-z]$", var.generic_oidc_domain)
}

module "acm" {
  source  = "terraform-aws-modules/acm/aws"
  version = "~> 5.0"

  providers = {
    aws = aws.us-east-1
  }

  domain_name = var.domain_name
  zone_id     = data.aws_route53_zone.domain.zone_id

  validation_method = "DNS"

  subject_alternative_names = [
    "*.${local.second_level_domain_name}",
    "*.${local.second_level_extra_domain_name}",
  ]

  wait_for_validation = false # disabled for multiple domains in different zones for a transitional period

  tags = {
    Name = "oidc-cert"
  }
}

module "cloudfront" {
  source  = "terraform-aws-modules/cloudfront/aws"
  version = "3.2.2"

  aliases = concat([var.domain_name, var.generic_oidc_domain], formatlist("%s.${var.pass_online_domain}", var.extra_oidc_subdomains))

  comment             = var.domain_name
  enabled             = true
  http_version        = "http2and3"
  is_ipv6_enabled     = true
  price_class         = "PriceClass_All"
  retain_on_delete    = false
  wait_for_deployment = false

  web_acl_id = aws_wafv2_web_acl.waf_cf.arn

  logging_config = {
    bucket = module.log_bucket.s3_bucket_bucket_domain_name
    prefix = "cloudfront"
  }

  origin = {
    "${local.origin_key}" = {
      domain_name = module.alb.dns_name
      custom_origin_config = {
        http_port              = 80
        https_port             = 443
        origin_protocol_policy = "https-only"
        origin_ssl_protocols   = ["TLSv1", "TLSv1.1", "TLSv1.2"]
      }
    }
  }

  default_cache_behavior = {
    target_origin_id       = local.origin_key
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD", "OPTIONS", "OPTIONS", "PUT", "POST", "PATCH", "DELETE"]
    cached_methods         = ["GET", "HEAD"]
    compress               = true
    query_string           = true

    use_forwarded_values = false

    # CachingDisabled
    cache_policy_id = "4135ea2d-6df8-44a3-9df3-4b5a84be39ad"
    # AllViewerAndCloudFrontHeaders-2022-06 <- CF policy for ALB
    origin_request_policy_id = "33f36d7e-f396-46d9-90e0-52428a34d9dc"
    # This is id for SecurityHeadersPolicy copied from https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/using-managed-response-headers-policies.html
    response_headers_policy_id = "67f7725c-6f97-4210-82d7-5512b31e9d03"
  }

  viewer_certificate = {
    acm_certificate_arn = module.acm.acm_certificate_arn
    ssl_support_method  = "sni-only"
  }
}

#######################
# S3 bucket for logging
#######################

data "aws_cloudfront_log_delivery_canonical_user_id" "cloudfront" {}

module "log_bucket" {
  source  = "terraform-aws-modules/s3-bucket/aws"
  version = "~> 3.0"

  bucket = "logs-${local.origin_key}"

  control_object_ownership = true
  object_ownership         = "ObjectWriter"

  grant = [{
    type       = "CanonicalUser"
    permission = "FULL_CONTROL"
    id         = data.aws_canonical_user_id.current.id
    }, {
    type       = "CanonicalUser"
    permission = "FULL_CONTROL"
    id         = data.aws_cloudfront_log_delivery_canonical_user_id.cloudfront.id
    # Ref. https://github.com/terraform-providers/terraform-provider-aws/issues/12512
    # Ref. https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/AccessLogs.html
  }]
  force_destroy = true
}
