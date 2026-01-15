module "this" {
  source    = "cloudposse/label/null"
  version   = "0.25.0"
  namespace = "fv"
  stage     = "live"
  name      = "oidc"
}

module "redis" {
  source                     = "cloudposse/elasticache-redis/aws"
  version                    = "0.49.0"
  vpc_id                     = data.aws_vpc.default.id
  subnets                    = data.aws_vpc_endpoint.ecr.subnet_ids
  context                    = module.this.context
  transit_encryption_enabled = false
  allowed_security_group_ids = [
    module.fargate.service_sg_id
  ]
  instance_type = "cache.t2.medium"
}
