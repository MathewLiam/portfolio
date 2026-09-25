# Direct-upload Pages project: there's no Git source or build config,
# because Azure Pipelines builds the site and pushes ./out with `wrangler pages deploy`.
resource "cloudflare_pages_project" "site" {
  account_id        = var.account_id
  name              = var.project_name
  production_branch = var.production_branch
}

resource "cloudflare_pages_domain" "custom" {
  count = var.custom_domain == null ? 0 : 1

  account_id   = var.account_id
  project_name = cloudflare_pages_project.site.name
  name         = var.custom_domain
}

resource "cloudflare_dns_record" "custom" {
  count = var.custom_domain == null ? 0 : 1

  zone_id = var.zone_id
  name    = var.custom_domain
  type    = "CNAME"
  content = cloudflare_pages_project.site.subdomain
  proxied = true
  ttl     = 1 # automatic

  depends_on = [cloudflare_pages_domain.custom]
}
