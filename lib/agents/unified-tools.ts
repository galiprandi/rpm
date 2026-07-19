import {
  createCustomerTool,
  searchCustomersTool,
} from "@/lib/services/customer";
import {
  createProductTool,
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
  searchWorkOrders: workOrderTools.searchWorkOrders,
  // Create
  createCustomer: createCustomerTool,
  createProduct: createProductTool,
  registerVehicle: registerVehicleTool,
  registerCustomerWithVehicle: registerCustomerWithVehicleTool,
  createWorkOrder: workOrderTools.createWorkOrder,
  createDirectSale: financeTools.createDirectSale,
  // Update
  updateWorkOrderStatus: workOrderTools.updateWorkOrderStatus,
  // Query
  getWorkOrderDetail: workOrderTools.getWorkOrderDetail,
  getCashStatus: financeTools.getCashStatus,
  getTodaySummary: financeTools.getTodaySummary,
  // Communication
  composeWhatsAppMessage: composeWhatsAppMessageTool,
  // Purchases
  processPurchaseInvoice: processPurchaseInvoiceTool,
};
