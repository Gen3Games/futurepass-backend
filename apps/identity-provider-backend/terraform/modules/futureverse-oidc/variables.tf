variable "image_tag" {
  type        = string
  description = "tag of the image to deploy"
}

variable "repository_id" {
  type        = string
  description = "id of the repository to deploy"
}

variable "zone_name" {
  type        = string
  description = "Route53 zone name to use for the oidc server"
}

variable "domain_name" {
  type        = string
  description = "Route53 domain name to use for the oidc server"
}

variable "generic_oidc_domain" {
  type        = string
  description = "Route53 generic domain name to use for the oidc server"
}

variable "extra_oidc_subdomains" {
  type        = list(string)
  description = "Route53 extra subdomains list to use for the oidc server"
}

variable "pass_online_domain" {
  type        = string
  description = "Route53 pass online second level domain to use for the oidc server"
}

variable "captcha_domain_name" {
  type        = string
  description = "Route53 domain name with subdomain removed, it is used for captcha checking"
}

variable "sendgrid_from_email" {
  type        = string
  description = "value to use for the sendgrid from email"
}

variable "sendgrid_template_id" {
  type = string
}

variable "foundation_api_base_url" {
  type = string
}

variable "eth_chain_name" {
  type = string
}

variable "eth_chain_url" {
  type = string
}

variable "eth_chain_id" {
  type = string
}

variable "identity_contract" {
  type = string
}

variable "google_client_id" {
  type = string
}


variable "facebook_client_id" {
  type = string
}

variable "twitter_client_id" {
  type = string
}

variable "tiktok_client_id" {
  type = string
}

variable "oidc_hostname" {
  type = string
}

variable "cdn_hostname" {
  type = string
}

variable "signer_hostname" {
  type = string
}

variable "signer_client_id" {
  type = string
}

variable "signer_redirect_uri" {
  type = string
}

// we need to remove this when futureverse domain is no longer required
variable "signer_legacy_redirect_uri" {
  type = string
}

variable "demo_client_id" {
  type = string
}

variable "demo_redirect_uri" {
  type = string
}

variable "dashboard_hostname" {
  type = string
}

variable "dashboard_client_id" {
  type = string
}

variable "dashboard_redirect_uri" {
  type = string
}

variable "sacrifice_seekers_contract" {
  type = string
}

variable "assets_api_endpoint" {
  type = string
}

variable "eth_json_rpc_url" {
  type = string
}

variable "allow_wildcards" {
  type    = bool
  default = false
}

variable "tnl_character_contract" {
  type = string
}

variable "graphql_endpoint" {
  type = string
}

variable "active_challenge" {
  type = string
}

variable "futurescore_api_gateway_base_url" {
  type = string
}

variable "futurescore_offchain_challenge_id" {
  type = string
}

variable "delegated_account_indexer_api_base_url" {
  type = string
}

variable "evm_chain_id" {
  type = string
}

variable "captcha_ip_rate_limit_threshold" {
  type = string
}

variable "captcha_ip_rate_limit_duration" {
  type = string
}

variable "twilio_sms_verification_service_id" {
  type = string
}

variable "trn_rpc_url_websocket" {
  type = string
}

variable "account_linker_api" {
  type = string
}

variable "asset_registry_quest_event_endpoint" {
  type = string
}

variable "logger_level" {
  type = string
}

variable "xrpl_json_prc_url" {
  type = string
}

variable "fp_creation_batch_size" {
  type = number
}

variable "total_replicas" {
  type = number
}

variable "backend_denied_hosts" {
  type = list(string)
}

variable "oidc_cdn_record_weight" {
  type    = number
  default = 0
}
