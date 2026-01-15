data "aws_route53_zone" "base" {
  name     = var.domain_config.root_domain_name
}

resource "aws_route53_zone" "domain" {
  name = local.domain_name
}

resource "aws_route53_record" "ns-records" {
  name    = var.domain_config.subdomain_name
  type    = "NS"
  ttl     = "30"
  zone_id = data.aws_route53_zone.base.zone_id

  records = aws_route53_zone.domain.name_servers

  lifecycle {
    ignore_changes = [
      zone_id
    ]
  }
}

resource "aws_route53_record" "route53_record" {
  zone_id = aws_route53_zone.domain.zone_id
  name    = local.domain_name
  type    = "A"

  alias {
    name    = aws_cloudfront_distribution.s3_distribution.domain_name
    zone_id = aws_cloudfront_distribution.s3_distribution.hosted_zone_id

    //HardCoded value for CloudFront
    evaluate_target_health = false
  }
}

resource "aws_acm_certificate" "acm_cert" {
  domain_name       = local.domain_name
  validation_method = "DNS"
  provider          = aws.us-east-1

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_route53_record" "cert_validation" {
  for_each = {
    for dvo in aws_acm_certificate.acm_cert.domain_validation_options : dvo.domain_name => {
      name   = dvo.resource_record_name
      record = dvo.resource_record_value
      type   = dvo.resource_record_type
    }
  }

  allow_overwrite = true
  name            = each.value.name
  records         = [each.value.record]
  ttl             = 60
  type            = each.value.type
  zone_id         = aws_route53_zone.domain.zone_id
}

resource "aws_route53_record" "caa-records" {
  allow_overwrite = true
  name    = ""
  type    = "CAA"
  ttl     = "60"
  zone_id = aws_route53_zone.domain.zone_id
  records = [
    "0 issue \"amazon.com\"",
    "0 issue \"amazonaws.com\"",
    "0 issue \"amazontrust.com\"",
    "0 issue \"awstrust.org\"",
    "0 issue \"globalsign.org\"",
    "0 issue \"letsencrypt.org\"",
    "0 issue \"sectigo.org\"",
  ]
}
