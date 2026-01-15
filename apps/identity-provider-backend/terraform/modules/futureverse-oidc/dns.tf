data "aws_route53_zone" "domain" {
  name = var.zone_name
}

resource "aws_route53_record" "oidc" {
  zone_id = data.aws_route53_zone.domain.zone_id
  name    = var.domain_name
  type    = "A"

  weighted_routing_policy {
    weight = 255 - var.oidc_cdn_record_weight
  }

  set_identifier = "login-futureverse-elb"

  alias {
    name                   = module.alb.dns_name
    zone_id                = module.alb.zone_id
    evaluate_target_health = true
  }
}

resource "aws_route53_record" "oidc-cdn" {
  zone_id = data.aws_route53_zone.domain.zone_id
  name    = var.domain_name
  type    = "A"

  weighted_routing_policy {
    weight = var.oidc_cdn_record_weight
  }

  set_identifier = "login-futureverse-cdn"

  alias {
    name                   = module.cloudfront.cloudfront_distribution_domain_name
    zone_id                = "Z2FDTNDATAQYW2" # The hosted zone ID for Cloudfront https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-route53-recordsetgroup-aliastarget.html
    evaluate_target_health = false            # CloudFront does not return health checks
  }
}

resource "aws_route53_record" "generic_oidc_cloudfront" {
  zone_id = data.aws_route53_zone.generic_oidc_domain.zone_id
  name    = var.generic_oidc_domain
  type    = "A"

  weighted_routing_policy {
    weight = var.oidc_cdn_record_weight
  }

  set_identifier = "login-passonline-cdn"

  alias {
    name                   = module.cloudfront.cloudfront_distribution_domain_name
    zone_id                = "Z2FDTNDATAQYW2" # The hosted zone ID for Cloudfront https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-route53-recordsetgroup-aliastarget.html
    evaluate_target_health = false            # CloudFront does not return health checks
  }
}

resource "aws_route53_record" "subdomains_oidc_cloudfront" {
  for_each = toset(var.extra_oidc_subdomains)
  zone_id  = data.aws_route53_zone.generic_oidc_domain.zone_id
  name     = "${each.value}.${var.pass_online_domain}"
  type     = "A"

  alias {
    name                   = module.cloudfront.cloudfront_distribution_domain_name
    zone_id                = "Z2FDTNDATAQYW2" # The hosted zone ID for Cloudfront https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-route53-recordsetgroup-aliastarget.html
    evaluate_target_health = false            # CloudFront does not return health checks
  }
}

data "aws_route53_zone" "generic_oidc_domain" {
  name = var.pass_online_domain
}

resource "aws_route53_record" "generic_oidc_domain" {
  zone_id = data.aws_route53_zone.generic_oidc_domain.zone_id
  name    = "login.${var.pass_online_domain}"
  type    = "A"

  weighted_routing_policy {
    weight = 255 - var.oidc_cdn_record_weight
  }

  set_identifier = "login-passonline-elb"

  alias {
    name                   = module.alb.dns_name
    zone_id                = module.alb.zone_id
    evaluate_target_health = true
  }
}
