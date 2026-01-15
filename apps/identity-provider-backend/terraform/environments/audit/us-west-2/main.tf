variable "image_tag" {
  type        = string
  description = "tag of the image to deploy"
}

locals {
  oidc_cdn_record_weight = 255 # between 0 and 255
  pass_online_domain     = "passonline.kiwi"
  extra_oidc_subdomains  = []
}

module "futureverse-oidc" {
  source = "../../../modules/futureverse-oidc"

  repository_id = "422036139670"
  image_tag     = var.image_tag

  # base config
  zone_name             = "futureverse.kiwi"
  domain_name           = "login.futureverse.kiwi"
  captcha_domain_name   = "login.futureverse.kiwi"
  generic_oidc_domain   = "login.${local.pass_online_domain}"
  extra_oidc_subdomains = local.extra_oidc_subdomains
  pass_online_domain    = local.pass_online_domain
  oidc_hostname         = "https://login.futureverse.kiwi"

  cdn_hostname = "https://cdn.passonline.kiwi"

  signer_hostname = "https://signer.passonline.kiwi"

  sendgrid_from_email     = "verify@futureverse.kiwi"
  sendgrid_template_id    = "d-78f913c0d8c7473fa9fe4e158134b745"
  foundation_api_base_url = "https://foundation.futureverse.kiwi"
  logger_level            = "debug"

  # chain config
  eth_chain_name    = "porcini"
  eth_chain_url     = "https://porcini.au.rootnet.app"
  eth_chain_id      = 7672
  identity_contract = "0x3d33e2bf871c699E4fdd760a2a222ed98B3e258e"

  # 3rd-party idps
  google_client_id = "583069252020-qubb15gdi4madvs1r2e0q5t4fhqhg9ca.apps.googleusercontent.com" # same as staging

  facebook_client_id = "773222384748424"

  twitter_client_id = "QVNxWVVHbGlOMDJnOXpBUzl0Q2U6MTpjaQ"

  tiktok_client_id = "sbawrbbvm9tzgly9sx"

  # well-known clients
  signer_client_id       = "signer"
  signer_legacy_redirect_uri  = "https://signer.futureverse.kiwi/api/auth/callback/fv"
  signer_redirect_uri    = "https://signer.passonline.kiwi/api/auth/callback/fv"
  demo_client_id         = "demo"
  demo_redirect_uri      = "https://demo.futureverse.kiwi/api/auth/callback/fv"
  dashboard_hostname     = "https://identity-dashboard.futureverse.kiwi"
  dashboard_client_id    = "dashboard"
  dashboard_redirect_uri = "https://identity-dashboard.futureverse.kiwi/login"

  # allow using wildcards in the redirect url
  allow_wildcards = false

  # ...
  sacrifice_seekers_contract = "0x8CF70100EE87a3105a4Db1b5a941E3e43B004a94"
  assets_api_endpoint        = "https://7rgzpu19d7.execute-api.us-west-2.amazonaws.com"
  eth_json_rpc_url           = "https://mainnet.infura.io/v3/1e16cc5434fe45ae92b96e3e43f17a1b"

  # TNL Contracts
  tnl_character_contract = "0x6bCa6de2dbDc4E0d41f7273011785ea16Ba47182"
  graphql_endpoint       = "https://adx1wewtnh.execute-api.us-west-2.amazonaws.com/api/graphql"

  # Active challenge
  active_challenge                  = "OFF-CHAIN-FUTURESCORE-QUEST"
  futurescore_api_gateway_base_url  = "https://pljs0td9ya.execute-api.us-west-2.amazonaws.com"
  futurescore_offchain_challenge_id = "off-chain:futurepass:futurepass-quest-1d4ffb85-e71a-42f5-85f8-10b6565436ab:FuturescoreOnboarding"

  # Delegated account indexer api base url
  delegated_account_indexer_api_base_url = "https://account-indexer.api.futurepass.futureverse.dev/"
  evm_chain_id                           = 11155111

  # rate limit
  captcha_ip_rate_limit_threshold = 9999
  captcha_ip_rate_limit_duration  = 43200000 // 1000 * 60 * 60 * 12

  # twilio
  twilio_sms_verification_service_id = "VA9f4f58bd82d67f5244da70edbe949137"

  trn_rpc_url_websocket = "wss://porcini.rootnet.app/ws"
  account_linker_api    = "https://account-linker.api.futurepass.futureverse.dev"

  asset_registry_quest_event_endpoint = "https://p4m8w2ju3d.execute-api.us-west-2.amazonaws.com"

  xrpl_json_prc_url = "wss://xrplcluster.com"

  fp_creation_batch_size = 450
  total_replicas         = 3

  backend_denied_hosts = []
}

module "futerepass-cdn" {
  source       = "../../../modules/futurepass-cdn"
  account_name = "neptune"
  domain_config = {
    root_domain_name = "${local.pass_online_domain}"
    subdomain_name   = "cdn"
  }

  providers = {
    aws.us-east-1 = aws.us-east-1
  }
}
