import { customerTools } from "@/lib/services/customer";
import { productTools } from "@/lib/services/product";
import { workOrderTools } from "./work-orders/tools";
import { financeTools } from "./finance/tools";
import { sharedTools } from "./shared";
import {
  registerCustomerWithVehicle,
  closeCashRegister,
} from "./orchestrator/composite";
import { searchProductsWithPricesTool } from "./tools/search-products-with-prices";

export const unifiedTools = {
  // Customer
  ...customerTools,
  // Product
  ...productTools,
  // Work Orders
  ...workOrderTools,
  // Finance
  ...financeTools,
  // Shared (search)
  ...sharedTools,
  // Composite
  registerCustomerWithVehicle,
  closeCashRegister,
  // Override searchProducts with enhanced version (must be after all spreads)
  searchProducts: searchProductsWithPricesTool,
};
