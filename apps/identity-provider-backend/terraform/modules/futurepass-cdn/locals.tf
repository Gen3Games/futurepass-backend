locals {
  bucket_name                            = "${var.account_name}--futurepass-customer-web-assets"
  custodial_auth_option_icons_bucket_name = "${var.account_name}--custodial-auth-option-icons"
  domain_name                            = "${var.domain_config.subdomain_name}.${var.domain_config.root_domain_name}"
}
