output "pages_subdomain" {
  description = "Default *.pages.dev address of the project."
  value       = cloudflare_pages_project.site.subdomain
}

output "custom_domain" {
  description = "Custom domain attached to the project, if any."
  value       = var.custom_domain
}
