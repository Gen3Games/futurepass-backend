### Basic WAF that counts traffic
resource "aws_wafv2_web_acl" "waf" {
  name        = "oidc-waf"
  description = "WAF for the oidc-server ALB"
  scope       = "REGIONAL"

  default_action {
    allow {}
  }

  rule {
    name     = "ip_count"
    priority = 1

    action {
      count {}
    }

    statement {
      rate_based_statement {
        limit              = 100
        aggregate_key_type = "IP"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "oidc-waf-metrics-rule1"
      sampled_requests_enabled   = true
    }
  }

  rule {
    name     = "AWS-AWSManagedRulesCommonRuleSet"
    priority = 2

    override_action {
      count {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesCommonRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "oidc-waf-metrics-AWSCommon"
      sampled_requests_enabled   = true
    }
  }

  rule {
    name     = "AWSManagedRulesAmazonIpReputationList"
    priority = 3

    override_action {
      count {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesAmazonIpReputationList"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "oidc-waf-metrics-AWSIPRep"
      sampled_requests_enabled   = true
    }
  }

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "oidc-waf-metrics"
    sampled_requests_enabled   = true
  }
}

resource "aws_wafv2_web_acl_logging_configuration" "waf" {
  log_destination_configs = [aws_cloudwatch_log_group.wafv2-log-group.arn]
  resource_arn            = aws_wafv2_web_acl.waf.arn
}

resource "aws_cloudwatch_log_group" "wafv2-log-group" {
  name              = "aws-waf-logs-waf/oidc-waf"
  retention_in_days = 90
}

resource "aws_wafv2_web_acl_association" "waf" {
  resource_arn = module.alb.arn
  web_acl_arn  = aws_wafv2_web_acl.waf.arn
}
