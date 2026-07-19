import {
  createCustomerTool,
  searchCustomersTool,
} from "@/lib/services/customer";
import {
  createProductTool,
  draftUpdateProductTool,
  updateProductTool,
} from "@/lib/services/product";
import { registerVehicleTool } from "@/lib/services/vehicle";
import { workOrderTools } from "./work-orders/tools";
import { financeTools } from "./finance/tools";
import { registerCustomerWithVehicleTool } from "./tools/register-customer-with-vehicle";
import { searchProductsWithPricesTool } from "./tools/search-products-with-prices";
import { composeWhatsAppMessageTool } from "./tools/compose-message";
import { processPurchaseInvoiceTool } from "./tools/process-purchase-invoice";

export const unifiedTools = {
  // Search
  searchProducts: searchProductsWithPricesTool,
  searchCustomers: searchCustomersTool,
  // Create
  createCustomer: createCustomerTool,
  createProduct: createProductTool,
  registerVehicle: registerVehicleTool,
  registerCustomerWithVehicle: registerCustomerWithVehicleTool,
  // Update (organizational only — no stock/cost changes)
  draftUpdateProduct: draftUpdateProductTool,
  updateProduct: updateProductTool,
  // Work Orders
  ...workOrderTools,
  // Finance
  ...financeTools,
  // Communication
  composeWhatsAppMessage: composeWhatsAppMessageTool,
  // Purchase Vouchers
  processPurchaseInvoice: processPurchaseInvoiceTool,
};
