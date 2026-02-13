output "endpoint" {
  value = azurerm_cognitive_account.ocr_account.endpoint
}

output "primary_key" {
  value     = azurerm_cognitive_account.ocr_account.primary_access_key
  sensitive = true
}
