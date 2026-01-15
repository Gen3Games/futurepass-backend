resource "aws_acm_certificate" "cert" {
  domain_name       = var.domain_name
  validation_method = "DNS"

  subject_alternative_names = [
    "*.${local.second_level_domain_name}",
  ]

  lifecycle { create_before_destroy = "true" }

  tags = {
    Name = "oidc-cert"
  }
}

resource "aws_route53_record" "cert_validation" {
  for_each = {
    for dvo in aws_acm_certificate.cert.domain_validation_options : dvo.domain_name => {
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
  zone_id         = data.aws_route53_zone.domain.zone_id
}

resource "aws_acm_certificate_validation" "cert" {
  certificate_arn         = aws_acm_certificate.cert.arn
  validation_record_fqdns = [for record in aws_route53_record.cert_validation : record.fqdn]
}


module "acm_generic_domain" {
  source  = "terraform-aws-modules/acm/aws"
  version = "~> 5.0"

  domain_name = "login.${var.pass_online_domain}"
  zone_id     = data.aws_route53_zone.generic_oidc_domain.zone_id

  validation_method = "DNS"

  subject_alternative_names = ["*.${var.pass_online_domain}"]

  wait_for_validation = true

  tags = {
    Name = "oidc-cert"
  }
}

resource "aws_lb_listener_certificate" "generic_oidc_domain" {
  listener_arn    = aws_lb_listener.alb_80.arn
  certificate_arn = module.acm_generic_domain.acm_certificate_arn
}
