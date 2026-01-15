#!/bin/bash

# log into ECR, and push images to ECR
# The following script need to run with AWS credentials in context

set -eo pipefail

aws_account=$(aws sts get-caller-identity --query Account --output text)
tag=sha-$(git rev-parse --short=7 HEAD)

aws ecr get-login-password | docker login --username AWS --password-stdin "${aws_account}.dkr.ecr.us-west-2.amazonaws.com/futureverse-oidc"

docker tag "futureverse-oidc:${tag}" "${aws_account}.dkr.ecr.us-west-2.amazonaws.com/futureverse-oidc:${tag}"
docker push "${aws_account}.dkr.ecr.us-west-2.amazonaws.com/futureverse-oidc:${tag}"
