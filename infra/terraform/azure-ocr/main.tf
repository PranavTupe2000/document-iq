resource "azurerm_resource_group" "ocr_rg" {
  name     = var.resource_group_name
  location = var.location
}

resource "azurerm_cognitive_account" "ocr_account" {
  name                = var.cognitive_account_name
  location            = azurerm_resource_group.ocr_rg.location
  resource_group_name = azurerm_resource_group.ocr_rg.name
  kind                = "ComputerVision"
  sku_name            = "F0"  # Free tier

  lifecycle {
    prevent_destroy = false
  }
}
