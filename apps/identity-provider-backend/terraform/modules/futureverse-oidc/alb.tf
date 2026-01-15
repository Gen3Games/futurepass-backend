module "alb" {
  source  = "umotif-public/alb/aws"
  version = "~> 2.1.0"

  name_prefix        = "oidc-server"
  load_balancer_type = "application"
  idle_timeout       = 120
  internal           = false
  vpc_id             = data.aws_vpc.default.id
  subnets            = data.aws_subnet_ids.public.ids
}

resource "aws_lb_listener" "alb_80" {
  load_balancer_arn = module.alb.arn
  port              = "443"
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-2016-08"
  certificate_arn   = aws_acm_certificate.cert.arn

  default_action {
    type             = "forward"
    target_group_arn = module.fargate.target_group_arn[0]
  }
}

resource "aws_lb_listener_rule" "allow_reg_from_maintenance_service" {
  listener_arn = aws_lb_listener.alb_80.arn
  priority     = 100

  action {
    type             = "forward"
    target_group_arn = module.fargate.target_group_arn[0]
  }

  condition {
    path_pattern {
      values = ["/reg*"]
    }
  }

  condition {
    http_request_method {
      values = ["GET"]
    }
  }

  condition {
    http_header {
      http_header_name = "Origin"
      values           = ["https://maintenance.${var.pass_online_domain}", "https://maintenance.${var.zone_name}"]
    }
  }
}

resource "aws_lb_listener_rule" "allow_reg_from_managecilents" {
  listener_arn = aws_lb_listener.alb_80.arn
  priority     = 101

  action {
    type             = "forward"
    target_group_arn = module.fargate.target_group_arn[0]
  }

  condition {
    path_pattern {
      values = ["/reg*"]
    }
  }

  condition {
    http_header {
      http_header_name = "Referer"
      values           = ["https://${var.generic_oidc_domain}/manageclients", "https://${var.domain_name}/manageclients"]
    }
  }
  condition {
    host_header {
      values = [var.generic_oidc_domain, var.domain_name]
    }
  }
}

resource "aws_lb_listener_rule" "block_direct_reg_on_main_domains" {
  listener_arn = aws_lb_listener.alb_80.arn
  priority     = 102

  action {
    type = "fixed-response"
    fixed_response {
      content_type = "text/plain"
      message_body = "403: forbidden"
      status_code  = "403"
    }
  }

  condition {
    path_pattern {
      values = ["/reg*"]
    }
  }

  condition {
    host_header {
      values = [var.generic_oidc_domain, var.domain_name]
    }
  }
}

resource "aws_lb_listener_rule" "allow_manageclients_on_main_domains" {
  listener_arn = aws_lb_listener.alb_80.arn
  priority     = 103

  action {
    type             = "forward"
    target_group_arn = module.fargate.target_group_arn[0]
  }

  condition {
    path_pattern {
      values = ["/manageclients*"]
    }
  }
  condition {
    host_header {
      values = [var.generic_oidc_domain, var.domain_name]
    }
  }
}

resource "aws_lb_listener_rule" "block_from_tenants" {
  listener_arn = aws_lb_listener.alb_80.arn
  priority     = 104

  action {
    type = "fixed-response"
    fixed_response {
      content_type = "text/plain"
      message_body = "404: not found"
      status_code  = "404"
    }
  }

  condition {
    path_pattern {
      # Note: This can include only 5 paths as per aws limitation.
      values = ["/manageclients*", "/reg*"]
    }
  }
  condition {
    host_header {
      values = ["*.${var.pass_online_domain}"]
    }
  }
}

resource "aws_lb_listener_rule" "block_reg_from_rest" {
  listener_arn = aws_lb_listener.alb_80.arn
  priority     = 105

  action {
    type = "fixed-response"
    fixed_response {
      content_type = "text/plain"
      message_body = "403: forbidden"
      status_code  = "403"
    }
  }

  condition {
    path_pattern {
      values = ["/reg*"]
    }
  }
}

output "alb_dns_name" {
  value = module.alb.dns_name
}

output "alb_zone_id" {
  value = module.alb.zone_id
}

output "alb_listener_arn" {
  value = aws_lb_listener.alb_80.arn
}
