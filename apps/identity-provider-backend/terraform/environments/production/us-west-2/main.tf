variable "image_tag" {
  type        = string
  description = "tag of the image to deploy"
}

locals {
  oidc_cdn_record_weight = 0 # between 0 and 255
  pass_online_domain     = "pass.online"
  extra_oidc_subdomains  = ["jen"]
}

module "futureverse-oidc" {
  source = "../../../modules/futureverse-oidc"

  repository_id = "215540320247"
  image_tag     = var.image_tag

  # base config
  zone_name               = "futureverse.app"
  domain_name             = "login.futureverse.app"
  captcha_domain_name     = "login.futureverse.app"
  generic_oidc_domain     = "login.${local.pass_online_domain}"
  extra_oidc_subdomains   = local.extra_oidc_subdomains
  pass_online_domain      = local.pass_online_domain
  oidc_hostname           = "https://login.futureverse.app"
  sendgrid_from_email     = "verify@futureverse.app"
  sendgrid_template_id    = "d-78f913c0d8c7473fa9fe4e158134b745"
  foundation_api_base_url = "https://foundation.pass.online"
  logger_level            = "info"
  oidc_cdn_record_weight  = local.oidc_cdn_record_weight

  cdn_hostname = "https://cdn.pass.online"

  signer_hostname = "https://signer.pass.online"

  # chain config
  eth_chain_name    = "Rootnet Mainnet"
  eth_chain_url     = "https://root.au.rootnet.live"
  eth_chain_id      = 7668
  identity_contract = "0xce8AAf75c93C8A3Cef1e442868782EEE415B39c0"

  # 3rd-party idps
  google_client_id = "913547680811-i7isaukai79r9u81pns9jm606v6eos67.apps.googleusercontent.com"

  facebook_client_id = "413622871358823"

  twitter_client_id = "VU5Kc0RCRFIxWWtia0tSbHNzMVE6MTpjaQ"

  tiktok_client_id = "awb4s83vn3s20kd3"

  # well-known clients
  signer_client_id           = "signer"
  signer_legacy_redirect_uri = "https://signer.futureverse.app/api/auth/callback/fv"
  signer_redirect_uri        = "https://signer.pass.online/api/auth/callback/fv"
  demo_client_id             = "demo"
  demo_redirect_uri          = "https://identity-demo.futureverse.app/api/auth/callback/fv"
  dashboard_hostname         = "https://futurepass.futureverse.app,https://futurepass-preview.futureverse.cloud"
  dashboard_client_id        = "dashboard"
  dashboard_redirect_uri     = "https://futurepass.futureverse.app/login,https://futurepass-preview.futureverse.cloud/login"

  # ...
  sacrifice_seekers_contract = "0x8CF70100EE87a3105a4Db1b5a941E3e43B004a94"
  assets_api_endpoint        = "https://7rgzpu19d7.execute-api.us-west-2.amazonaws.com"
  eth_json_rpc_url           = "https://mainnet.infura.io/v3/1e16cc5434fe45ae92b96e3e43f17a1b"

  # TNL Contracts
  tnl_character_contract = "0x6bCa6de2dbDc4E0d41f7273011785ea16Ba47182"
  graphql_endpoint       = "https://adx1wewtnh.execute-api.us-west-2.amazonaws.com/api/graphql"

  # Active challenge
  active_challenge                  = "OFF-CHAIN-FUTURESCORE-QUEST"
  futurescore_api_gateway_base_url  = "https://ynw1ud7uyb.execute-api.us-west-2.amazonaws.com"
  futurescore_offchain_challenge_id = "off-chain:futurepass:futurepass-quest-1d4ffb85-e71a-42f5-85f8-10b6565436ab:FuturescoreOnboarding"

  # Delegated account indexer api base url
  delegated_account_indexer_api_base_url = "https://account-indexer.pass.online/"
  evm_chain_id                           = 1

  # rate limit
  captcha_ip_rate_limit_threshold = 100
  captcha_ip_rate_limit_duration  = 43200000 // 1000 * 60 * 60 * 12

  # twilio
  twilio_sms_verification_service_id = "VA6d9740eca9aa507ee03b52d49785109e"

  trn_rpc_url_websocket = "wss://tkk-fullnode.oreg.prod.rootnet.app/ws"
  account_linker_api    = "https://account-linker.pass.online"

  asset_registry_quest_event_endpoint = "https://6invam2j0m.execute-api.us-west-2.amazonaws.com"

  xrpl_json_prc_url = "wss://xrplcluster.com"

  fp_creation_batch_size = 450
  total_replicas         = 5

  backend_denied_hosts = []
}

module "futerepass-cdn" {
  source       = "../../../modules/futurepass-cdn"
  account_name = "production"
  domain_config = {
    root_domain_name = "${local.pass_online_domain}"
    subdomain_name   = "cdn"
  }

  providers = {
    aws.us-east-1 = aws.us-east-1
  }
}
