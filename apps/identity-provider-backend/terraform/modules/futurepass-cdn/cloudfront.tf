data "aws_cloudfront_origin_request_policy" "allow_origin_s3" {
  name = "Managed-CORS-S3Origin"
}

resource "aws_cloudfront_cache_policy" "cors_compatible_cache_policy" {
  name        = "CorsCompatibleCachePolicy"
  max_ttl     = 31536000
  min_ttl     = 1
  default_ttl = 86400

  parameters_in_cache_key_and_forwarded_to_origin {
    headers_config {
      header_behavior = "whitelist"
      headers {
        items = ["origin"]
      }
    }

    cookies_config {
      cookie_behavior = "none"
    }

    query_strings_config {
      query_string_behavior = "none"
    }

    enable_accept_encoding_brotli = true
    enable_accept_encoding_gzip   = true
  }
}


resource "aws_cloudfront_distribution" "s3_distribution" {
  aliases = [local.domain_name]

  // used for tenant assets
  origin {
    domain_name = aws_s3_bucket.asset-manager_bucket.bucket_regional_domain_name
    origin_id   = "s3-cloudfront-asset"

    s3_origin_config {
      origin_access_identity = aws_cloudfront_origin_access_identity.origin_access_identity_asset.cloudfront_access_identity_path
    }
  }

  // used for custodial auth option icons
  origin {
    domain_name = aws_s3_bucket.custodial-auth-option-icons_bucket.bucket_regional_domain_name
    origin_id   = "s3-cloudfront-custodial-auth-option-icons"
  }

  comment         = "cdn"
  enabled         = true
  is_ipv6_enabled = true

  default_cache_behavior {
    allowed_methods = [
      "GET",
      "HEAD",
      "OPTIONS"
    ]

    cached_methods = [
      "GET",
      "HEAD",
    ]

    target_origin_id         = "s3-cloudfront-asset"
    viewer_protocol_policy   = "redirect-to-https"
    cache_policy_id          = aws_cloudfront_cache_policy.cors_compatible_cache_policy.id
    origin_request_policy_id = data.aws_cloudfront_origin_request_policy.allow_origin_s3.id
  }

  ordered_cache_behavior {
    path_pattern = "/custodial-auth-option-icons/*.svg"
    allowed_methods = [
      "GET",
      "HEAD",
      "OPTIONS"
    ]

    cached_methods = [
      "GET",
      "HEAD",
    ]

    target_origin_id         = "s3-cloudfront-custodial-auth-option-icons"
    viewer_protocol_policy   = "redirect-to-https"
    cache_policy_id          = aws_cloudfront_cache_policy.cors_compatible_cache_policy.id
    origin_request_policy_id = data.aws_cloudfront_origin_request_policy.allow_origin_s3.id
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    acm_certificate_arn            = aws_acm_certificate.acm_cert.arn
    ssl_support_method             = "sni-only"
    minimum_protocol_version       = "TLSv1.2_2021"
    cloudfront_default_certificate = false
  }

  custom_error_response {
    error_code         = 403
    response_code      = 200
    response_page_path = "/"
  }

  wait_for_deployment = false
}

resource "aws_cloudfront_origin_access_identity" "origin_access_identity_asset" {
  comment = "access-identity-${local.bucket_name}.s3.amazonaws.com"
}
