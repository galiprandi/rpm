import {
  createCustomerTool,
  searchCustomersTool,
} from "@/lib/services/customer";
import { createProductTool } from "@/lib/services/product";
import { workOrderTools } from "./work-orders/tools";
import { financeTools } from "./finance/tools";
import {
  registerCustomerWithVehicle,
  closeCashRegister,
} from "./orchestrator/composite";
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
  registerCustomerWithVehicle,
  // Work Orders
  ...workOrderTools,
  // Finance
  ...financeTools,
  // Communication
  composeWhatsAppMessage: composeWhatsAppMessageTool,
  // Operations
  closeCashRegister,
  // Purchase Vouchers
  processPurchaseInvoice: processPurchaseInvoiceTool,
};
