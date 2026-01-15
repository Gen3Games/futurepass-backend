variable "domain_config" {
  type = object({
    root_domain_name = string
    subdomain_name   = string
  })
}

variable "account_name" {
  type = string
}
