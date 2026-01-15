

resource "aws_ecs_cluster" "cluster" {
  name = "oidc"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }
}

resource "aws_cloudwatch_log_group" "oidc-xray-daemon" {
  name              = "oidc-xray-daemon"
  retention_in_days = 7
}

module "oidc_container_definition" {
  source  = "cloudposse/ecs-container-definition/aws"
  version = "0.58.2"

  container_name  = "oidc-server"
  container_image = "${var.repository_id}.dkr.ecr.us-west-2.amazonaws.com/futureverse-oidc:${var.image_tag}"

  port_mappings = [
    {
      containerPort = 3000
      hostPort      = 3000
      protocol      = "tcp"
    }
  ]

  container_cpu    = 1024
  container_memory = 2048
  secrets = [
    {
      name      = "KEYSTORE"
      valueFrom = "${data.aws_secretsmanager_secret.futureverse-oidc.arn}:KEYSTORE::"
    },
    {
      name      = "SESSION_SECRET"
      valueFrom = "${data.aws_secretsmanager_secret.futureverse-oidc.arn}:SESSION_SECRET::"
    },
    {
      name      = "CSRF_SECRET"
      valueFrom = "${data.aws_secretsmanager_secret.futureverse-oidc.arn}:CSRF_SECRET::"
    },
    {
      name      = "SEND_GRID_API_KEY"
      valueFrom = "${data.aws_secretsmanager_secret.futureverse-oidc.arn}:SEND_GRID_API_KEY::"
    },
    {
      # TODO: maybe move this to a separate secret to add more security.
      name      = "ETH_WALLET_KEY"
      valueFrom = "${data.aws_secretsmanager_secret.futureverse-oidc.arn}:ETH_WALLET_KEY::"
    },
    {
      name      = "SIGNER_CLIENT_SECRET"
      valueFrom = "${data.aws_secretsmanager_secret.futureverse-oidc.arn}:SIGNER_CLIENT_SECRET::"
    },
    {
      name      = "DEMO_CLIENT_SECRET"
      valueFrom = "${data.aws_secretsmanager_secret.futureverse-oidc.arn}:DEMO_CLIENT_SECRET::"
    },
    {
      name      = "GOOGLE_CLIENT_SECRET"
      valueFrom = "${data.aws_secretsmanager_secret.futureverse-oidc.arn}:GOOGLE_CLIENT_SECRET::"
    },
    {
      name      = "HCAPTCHA_SECRET_KEY"
      valueFrom = "${data.aws_secretsmanager_secret.futureverse-oidc.arn}:HCAPTCHA_SECRET_KEY::"
    },
    {
      name      = "HCAPTCHA_SITE_KEY"
      valueFrom = "${data.aws_secretsmanager_secret.futureverse-oidc.arn}:HCAPTCHA_SITE_KEY::"
    },
    {
      name      = "FACEBOOK_CLIENT_SECRET"
      valueFrom = "${data.aws_secretsmanager_secret.futureverse-oidc.arn}:FACEBOOK_CLIENT_SECRET::"
    },
    {
      name      = "TWITTER_CLIENT_SECRET"
      valueFrom = "${data.aws_secretsmanager_secret.futureverse-oidc.arn}:TWITTER_CLIENT_SECRET::"

    },
    {
      name      = "TIKTOK_CLIENT_SECRET"
      valueFrom = "${data.aws_secretsmanager_secret.futureverse-oidc.arn}:TIKTOK_CLIENT_SECRET::"

    },
    {
      name      = "GOOGLE_RECAPTCHA_SECRET_KEY"
      valueFrom = "${data.aws_secretsmanager_secret.futureverse-oidc.arn}:GOOGLE_RECAPTCHA_SECRET_KEY::"
    },
    {
      name      = "IDENTITY_DASHBOARD_CLIENT_SECRET"
      valueFrom = "${data.aws_secretsmanager_secret.futureverse-oidc.arn}:IDENTITY_DASHBOARD_CLIENT_SECRET::"
    },
    {
      name      = "TWILIO_ACCCOUNT_SID"
      valueFrom = "${data.aws_secretsmanager_secret.futureverse-oidc.arn}:TWILIO_ACCCOUNT_SID::"
    },
    {
      name      = "TWILIO_AUTH_TOKEN"
      valueFrom = "${data.aws_secretsmanager_secret.futureverse-oidc.arn}:TWILIO_AUTH_TOKEN::"
    },
    {
      name      = "ALCHEMY_JSON_PRC_PROVIDER_URL"
      valueFrom = "${data.aws_secretsmanager_secret.futureverse-oidc.arn}:ALCHEMY_JSON_PRC_PROVIDER_URL::"
    },
    {
      name      = "ASSET_REGISTRY_QUEST_EVENT_APIKEY"
      valueFrom = "${data.aws_secretsmanager_secret.futureverse-oidc.arn}:ASSET_REGISTRY_QUEST_EVENT_APIKEY::"
    },
    {
      name      = "LAUNCHDARKLY_SDK_KEY"
      valueFrom = "${data.aws_secretsmanager_secret.futureverse-oidc.arn}:LAUNCHDARKLY_SDK_KEY::"
    },

    {
      name      = "LAUNCHDARKLY_FRONTEND_SDK_KEY"
      valueFrom = "${data.aws_secretsmanager_secret.futureverse-oidc.arn}:LAUNCHDARKLY_FRONTEND_SDK_KEY::"
    },

    {
      name      = "APPLE_CLIENT_ID"
      valueFrom = "${data.aws_secretsmanager_secret.futureverse-oidc.arn}:APPLE_CLIENT_ID::"
    },
    {
      name      = "APPLE_TEAM_ID"
      valueFrom = "${data.aws_secretsmanager_secret.futureverse-oidc.arn}:APPLE_TEAM_ID::"
    },
    {
      name      = "APPLE_KEY_ID"
      valueFrom = "${data.aws_secretsmanager_secret.futureverse-oidc.arn}:APPLE_KEY_ID::"
    },
    {
      name      = "APPLE_PRIVATE_KEY"
      valueFrom = "${data.aws_secretsmanager_secret.futureverse-oidc.arn}:APPLE_PRIVATE_KEY::"
    },

  ]
  environment = [
    { name = "NODE_OPTIONS", value = "--enable-source-maps" },
    { name = "NODE_ENV", value = "production" },
    { name = "LOGGER_LEVEL", value = var.logger_level },
    { name = "SEND_GRID_FROM_EMAIL", value = var.sendgrid_from_email },
    { name = "SEND_GRID_TEMPLATE_ID", value = var.sendgrid_template_id },
    { name = "FOUNDATION_API_BASE_URL", value = var.foundation_api_base_url },
    { name = "ETH_CHAIN_NAME", value = var.eth_chain_name },
    { name = "ETH_CHAIN_URL", value = var.eth_chain_url },
    { name = "ETH_CHAIN_ID", value = var.eth_chain_id },
    { name = "IDENTITY_CONTRACT", value = var.identity_contract },
    { name = "GOOGLE_CLIENT_ID", value = var.google_client_id },
    { name = "FACEBOOK_CLIENT_ID", value = var.facebook_client_id },
    { name = "TWITTER_CLIENT_ID", value = var.twitter_client_id },
    { name = "TIKTOK_CLIENT_ID", value = var.tiktok_client_id },
    { name = "OIDC_HOSTNAME", value = var.oidc_hostname },
    { name = "CDN_HOSTNAME", value = var.cdn_hostname },
    { name = "SIGNER_HOSTNAME", value = var.signer_hostname },
    { name = "ALLOWED_IDP_DOMAINS", value = join(", ", ["https://${var.generic_oidc_domain},https://${var.domain_name}", join(", ", formatlist("https://%s.${var.pass_online_domain}", var.extra_oidc_subdomains))]) },
    { name = "SIGNER_CLIENT_ID", value = var.signer_client_id },
    { name = "SIGNER_REDIRECT_URI", value = var.signer_redirect_uri },
    { name = "SIGNER_LEGACY_REDIRECT_URI", value = var.signer_legacy_redirect_uri },
    { name = "DEMO_CLIENT_ID", value = var.demo_client_id },
    { name = "DEMO_REDIRECT_URI", value = var.demo_redirect_uri },
    { name = "IDENTITY_DASHBOARD_HOSTNAME", value = var.dashboard_hostname },
    { name = "IDENTITY_DASHBOARD_CLIENT_ID", value = var.dashboard_client_id },
    { name = "IDENTITY_DASHBOARD_REDIRECT_URI", value = var.dashboard_redirect_uri },
    { name = "REDIS_URL", value = "${module.redis.endpoint}:${module.redis.port}" },
    { name = "SACRIFICE_SEEKERS_CONTRACT", value = var.sacrifice_seekers_contract },
    { name = "ASSETS_API_ENDPOINT", value = var.assets_api_endpoint },
    { name = "ETH_JSON_RPC_URL", value = var.eth_json_rpc_url },
    { name = "ALLOW_WILDCARDS", value = var.allow_wildcards },
    { name = "TNL_CHARACTER_CONTRACT", value = var.tnl_character_contract },
    { name = "GRAPHQL_ENDPOINT", value = var.graphql_endpoint },
    { name = "ACTIVE_CHALLENGE", value = var.active_challenge },
    { name = "FUTURESCORE_API_GATEWAY_BASE_URL", value = var.futurescore_api_gateway_base_url },
    { name = "FUTURESCORE_OFFCHAIN_CHALLENGE_ID", value = var.futurescore_offchain_challenge_id },
    { name = "DELEGATED_ACCOUNT_INDEXER_API_BASE_URL", value = var.delegated_account_indexer_api_base_url },
    { name = "EVM_CHAIN_ID", value = var.evm_chain_id },
    { name = "CAPTCHA_IP_RATE_LIMIT_THRESHOLD", value = var.captcha_ip_rate_limit_threshold },
    { name = "CATPCHA_IP_RATE_LIMIT_DURATION", value = var.captcha_ip_rate_limit_duration },
    { name = "CAPTCHA_DOMAIN_NAME", value = var.captcha_domain_name },
    { name = "TWILIO_SMS_VERIFICATION_SERVICE_ID", value = var.twilio_sms_verification_service_id },
    { name = "TRN_RPCURL_WEBSOCKET", value = var.trn_rpc_url_websocket },
    { name = "ACCOUNT_LINKER_API", value = var.account_linker_api },
    { name = "ASSET_REGISTRY_QUEST_EVENT_ENDPOINT", value = var.asset_registry_quest_event_endpoint },
    { name = "XRPL_JSON_PRC_URL", value = var.xrpl_json_prc_url },
    { name = "FP_CREATION_BATCH_SIZE", value = var.fp_creation_batch_size },
    { name = "AWS_XRAY_CONTEXT_MISSING", value = "IGNORE_ERROR" },
    { name = "DEBUG", value = 6 }
  ]
  log_configuration = {
    logDriver = "awslogs"
    options = {
      "awslogs-group"         = "oidc-server"
      "awslogs-stream-prefix" = "container"
      "awslogs-region"        = "us-west-2"
    }
  }
}

module "fargate" {
  source  = "umotif-public/ecs-fargate/aws"
  version = "~> 8.0.0"

  name_prefix = "oidc-server"

  vpc_id             = data.aws_vpc.default.id
  private_subnet_ids = data.aws_vpc_endpoint.ecr.subnet_ids
  cluster_id         = aws_ecs_cluster.cluster.id

  wait_for_steady_state = false

  task_container_assign_public_ip = true

  desired_count          = var.total_replicas
  task_definition_memory = 4096
  task_definition_cpu    = 2048

  container_definitions = jsonencode([
    module.oidc_container_definition.json_map_object,
    {
      name              = "xray-daemon"
      image             = "amazon/aws-xray-daemon:latest"
      essential         = true
      cpu               = 32
      memoryReservation = 256
      portMappings = [
        {
          containerPort = 2000
          hostPort      = 2000
          protocol      = "udp"
        }
      ]
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = "oidc-xray-daemon"
          "awslogs-stream-prefix" = "container"
          "awslogs-region"        = "us-west-2"
        }
      }
    }
  ])

  target_groups = [
    {
      target_group_name = "tg-oidc-server"
      container_port    = 3000
      container_name    = "oidc-server"
    }
  ]

  health_check = {
    port = "traffic-port"
    path = "/health"
  }

  task_stop_timeout = 90

  depends_on = [
    module.alb
  ]
}

data "aws_iam_policy_document" "secrets_manager_read_access" {
  statement {
    effect = "Allow"

    actions = [
      "secretsmanager:GetSecretValue",
      "secretsmanager:DescribeSecret",
      "secretsmanager:ListSecretVersionIds"
    ]

    resources = [
      "${data.aws_secretsmanager_secret.futureverse-oidc.arn}",
      "${data.aws_secretsmanager_secret.futureverse-oidc.arn}:*"
    ]
  }
}

resource "aws_iam_role_policy" "ecs_task_execution_role" {
  role   = module.fargate.execution_role_name
  policy = data.aws_iam_policy_document.secrets_manager_read_access.json
}

resource "aws_iam_policy" "ecs_task_dynamodb_access" {
  name = "ecs-task-dynamodb-access"
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "dynamodb:*"
        ]
        Effect = "Allow"
        Resource = [
          "${resource.aws_dynamodb_table.futureverse-oauth.arn}",
          "${resource.aws_dynamodb_table.futureverse-oauth.arn}/*",
          "${resource.aws_dynamodb_table.futureverse-user.arn}",
          "${resource.aws_dynamodb_table.futureverse-user.arn}/*",
          "${resource.aws_dynamodb_table.futureverse-quest-completion.arn}",
          "${resource.aws_dynamodb_table.futureverse-quest-completion.arn}/*"
        ]
      },
      {
        Effect = "Allow",
        Action = [
          "xray:PutTraceSegments",
          "xray:PutTelemetryRecords",
          "xray:GetSamplingRules",
          "xray:GetSamplingTargets",
          "xray:GetSamplingStatisticSummaries"
        ],
        Resource = "*"
      },
      {
        Effect = "Allow",
        Action = [
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:CreateLogGroup",
          "logs:DescribeLogStreams"
        ],
        Resource = "*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "ecs_task_dynamodb_access" {
  policy_arn = aws_iam_policy.ecs_task_dynamodb_access.arn
  role       = module.fargate.task_role_name
}
