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

resource "cloudflare_d1_database" "comments_db" {
  account_id = var.account_id
  name = "comments_db"
  jurisdiction = "eu"
  read_replication = {
    mode = "disabled"
  }
}

resource "cloudflare_r2_bucket" "comments_bucket" {
    account_id   = var.account_id
    name         = "comments"
    jurisdiction = "eu"
  }

resource "cloudflare_queue" "comments_queue" {
  account_id = var.account_id
  queue_name = "comments"
}

resource "cloudflare_worker" "comments_api" {
  account_id = var.account_id
  name = "comments-api"
  tags = ["comments-api"]
  depends_on = [cloudflare_d1_database.comments_db, cloudflare_r2_bucket.comments_bucket, cloudflare_queue.comments_queue]
}
