variable "account_id" {
  description = "Cloudflare account ID."
  type        = string
}

variable "project_name" {
  description = "Pages project name. Must match `name` in ../wrangler.toml."
  type        = string
  default     = "mm-website"
}

variable "production_branch" {
  description = "Branch whose deployments go to production."
  type        = string
  default     = "master"
}

variable "custom_domain" {
  description = "Optional custom domain for the site (e.g. \"www.example.com\"). Leave null to use only the *.pages.dev address."
  type        = string
  default     = null
}

variable "zone_id" {
  description = "ID of the Cloudflare zone that contains custom_domain. Required only when custom_domain is set."
  type        = string
  default     = null

  validation {
    condition     = var.custom_domain == null || var.zone_id != null
    error_message = "zone_id must be set when custom_domain is set."
  }
}
