
data "aws_vpc" "default" {
  tags = {
    # Neptune was created using the new infrastructure and the VPC is different, but we can't change fully
    # because the old environments still use the same default name.
    Name = var.repository_id == "471112584012" ? "identity-neptune-identitydevneptune-us-west-2-vpc" : "aws-controltower-VPC"
  }
}

data "aws_vpc_endpoint" "ecr" {
  vpc_id       = data.aws_vpc.default.id
  service_name = "com.amazonaws.us-west-2.ecr.api"
}

data "aws_subnet_ids" "public" {
  vpc_id = data.aws_vpc.default.id

  # Neptune was created using the new infrastructure and the VPC is different, but we can't change fully
  # because the old environments still use the same default name.
  tags = var.repository_id == "471112584012" ? {
    "fv:tech:zone" = "public"
  } : {
    "Network" = "Public"
  }
}

data "aws_canonical_user_id" "current" {}

data "aws_ecr_repository" "repository" {
  name        = "futureverse-oidc"
  registry_id = var.repository_id
}

data "aws_ecr_image" "image" {
  registry_id     = var.repository_id
  repository_name = data.aws_ecr_repository.repository.name
  image_tag       = var.image_tag
}
