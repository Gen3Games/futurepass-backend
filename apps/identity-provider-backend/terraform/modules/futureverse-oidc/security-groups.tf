resource "aws_security_group_rule" "alb_ingress_443" {
  security_group_id = module.alb.security_group_id
  type              = "ingress"
  protocol          = "tcp"
  from_port         = 443
  to_port           = 443
  cidr_blocks       = ["0.0.0.0/0"]
  ipv6_cidr_blocks  = ["::/0"]
}

resource "aws_security_group_rule" "task_ingress_80" {
  security_group_id        = module.fargate.service_sg_id
  type                     = "ingress"
  protocol                 = "tcp"
  from_port                = 80
  to_port                  = 3000
  source_security_group_id = module.alb.security_group_id
}

resource "aws_security_group_rule" "allow-ecr-vpc-endpoint" {
  for_each = data.aws_vpc_endpoint.ecr.security_group_ids

  security_group_id        = each.value
  type                     = "ingress"
  protocol                 = "tcp"
  from_port                = 443
  to_port                  = 443
  source_security_group_id = module.fargate.service_sg_id
}
