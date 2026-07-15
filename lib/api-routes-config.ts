/**
 * API Routes Configuration - Central Role-Based Access Control
 * 
 * This file defines the required role for each API endpoint.
 * Use this as a reference when applying protection to routes.
 * 
 * Role Levels:
 * - PUBLIC: No authentication required
 * - USER: Any authenticated user
 * - STAFF: Staff or higher
 * - ADMIN: Admin only
 * 
 * Usage:
 * Import this config to check what role an endpoint requires,
 * or use it for documentation/reference purposes.
 */

import { UserRole } from '@/lib/auth/roles-client';

export type RouteRole = 'PUBLIC' | 'USER' | 'STAFF' | 'ADMIN';

export interface RouteConfig {
  path: string;
  methods: ('GET' | 'POST' | 'PUT' | 'DELETE')[];
  role: RouteRole;
  description: string;
}

/**
 * Central configuration of API route protection requirements
 */
export const API_ROUTES_CONFIG: RouteConfig[] = [
  // ===== AUTH ENDPOINTS =====
  {
    path: '/api/auth/[...all]',
    methods: ['GET', 'POST'],
    role: 'PUBLIC',
    description: 'Better Auth handler (public OAuth flow)',
  },
  // ===== PRODUCTS (CRITICAL - NEEDS PROTECTION) =====
  {
    path: '/api/products',
    methods: ['GET'],
    role: 'ADMIN',
    description: 'List products',
  },
  {
    path: '/api/products',
    methods: ['POST'],
    role: 'ADMIN',
    description: 'Create product',
  },
  {
    path: '/api/products/[id]',
    methods: ['GET'],
    role: 'ADMIN',
    description: 'Get product by ID',
  },
  {
    path: '/api/products/[id]',
    methods: ['PUT'],
    role: 'ADMIN',
    description: 'Update product',
  },
  {
    path: '/api/products/[id]',
    methods: ['DELETE'],
    role: 'ADMIN',
    description: 'Deactivate product (soft delete)',
  },
  {
    path: '/api/products/[id]/image',
    methods: ['POST'],
    role: 'ADMIN',
    description: 'Upload product image',
  },
  {
    path: '/api/products/[id]/movements',
    methods: ['GET'],
    role: 'ADMIN',
    description: 'Get product stock movements',
  },

  // ===== CATEGORIES (CRITICAL - NEEDS PROTECTION) =====
  {
    path: '/api/categories',
    methods: ['GET'],
    role: 'ADMIN',
    description: 'List categories',
  },
  {
    path: '/api/categories',
    methods: ['POST'],
    role: 'ADMIN',
    description: 'Create category',
  },
  {
    path: '/api/categories/[id]',
    methods: ['GET', 'PUT', 'DELETE'],
    role: 'ADMIN',
    description: 'Manage category',
  },

  // ===== CUSTOMERS (CRITICAL - NEEDS PROTECTION) =====
  {
    path: '/api/customers',
    methods: ['GET'],
    role: 'ADMIN',
    description: 'List customers',
  },
  {
    path: '/api/customers',
    methods: ['POST'],
    role: 'ADMIN',
    description: 'Create customer',
  },
  {
    path: '/api/customers/[id]',
    methods: ['GET', 'PUT', 'DELETE'],
    role: 'ADMIN',
    description: 'Manage customer',
  },
  {
    path: '/api/customers/[id]/payments',
    methods: ['GET', 'POST'],
    role: 'ADMIN',
    description: 'Customer payments',
  },

  // ===== SERVICES (CRITICAL - NEEDS PROTECTION) =====
  {
    path: '/api/services',
    methods: ['GET'],
    role: 'ADMIN',
    description: 'List services',
  },
  {
    path: '/api/services',
    methods: ['POST'],
    role: 'ADMIN',
    description: 'Create service',
  },
  {
    path: '/api/services/[id]',
    methods: ['GET', 'PUT', 'DELETE'],
    role: 'ADMIN',
    description: 'Manage service',
  },

  // ===== CASH OPERATIONS (PROTECTED) =====
  {
    path: '/api/cash/open',
    methods: ['POST'],
    role: 'ADMIN',
    description: 'Open cash register',
  },
  {
    path: '/api/cash/close',
    methods: ['POST'],
    role: 'ADMIN',
    description: 'Close cash register',
  },
  {
    path: '/api/cash/expense',
    methods: ['POST'],
    role: 'ADMIN',
    description: 'Register cash expense',
  },
  {
    path: '/api/cash/income',
    methods: ['POST'],
    role: 'ADMIN',
    description: 'Register cash income',
  },
  {
    path: '/api/cash/status',
    methods: ['GET'],
    role: 'ADMIN',
    description: 'Get cash register status',
  },
  {
    path: '/api/cash/history',
    methods: ['GET'],
    role: 'ADMIN',
    description: 'Get cash history',
  },

  // ===== CASH MOVEMENTS (PROTECTED) =====
  {
    path: '/api/cash-movements',
    methods: ['GET'],
    role: 'ADMIN',
    description: 'List cash movements',
  },
  {
    path: '/api/cash-movements',
    methods: ['POST'],
    role: 'ADMIN',
    description: 'Create manual cash movement',
  },
  {
    path: '/api/cash-movements/summary',
    methods: ['GET'],
    role: 'ADMIN',
    description: 'Cash movements summary',
  },

  // ===== INVOICES (PROTECTED) =====
  {
    path: '/api/invoices',
    methods: ['GET'],
    role: 'ADMIN',
    description: 'List invoices',
  },
  {
    path: '/api/invoices',
    methods: ['POST'],
    role: 'ADMIN',
    description: 'Create invoice',
  },
  {
    path: '/api/invoices/[id]',
    methods: ['GET', 'PUT', 'DELETE'],
    role: 'ADMIN',
    description: 'Manage invoice',
  },

  // ===== COST UPDATES (PARTIALLY PROTECTED - NEEDS ROLE) =====
  {
    path: '/api/cost-updates/preview',
    methods: ['POST'],
    role: 'ADMIN',
    description: 'Preview cost update changes',
  },
  {
    path: '/api/cost-updates/apply',
    methods: ['POST'],
    role: 'ADMIN',
    description: 'Apply cost update to products',
  },
  {
    path: '/api/cost-updates/history',
    methods: ['GET'],
    role: 'ADMIN',
    description: 'Get cost update history',
  },

  // ===== DIRECT SALES (PARTIALLY PROTECTED - NEEDS ROLE) =====
  {
    path: '/api/direct-sales',
    methods: ['POST'],
    role: 'ADMIN',
    description: 'Create direct sale',
  },

  // ===== PRICE LISTS (CRITICAL - NEEDS PROTECTION) =====
  {
    path: '/api/price-lists',
    methods: ['GET'],
    role: 'ADMIN',
    description: 'List price lists',
  },
  {
    path: '/api/price-lists',
    methods: ['POST'],
    role: 'ADMIN',
    description: 'Create price list',
  },
  {
    path: '/api/price-lists/[id]',
    methods: ['GET', 'PUT', 'DELETE'],
    role: 'ADMIN',
    description: 'Manage price list',
  },
  {
    path: '/api/price-lists/[id]/items',
    methods: ['GET', 'POST'],
    role: 'ADMIN',
    description: 'Manage price list items',
  },
  {
    path: '/api/price-lists/[id]/calculate-price',
    methods: ['POST'],
    role: 'ADMIN',
    description: 'Calculate price for product',
  },

  // ===== PAYMENT METHODS (PROTECTED) =====
  {
    path: '/api/payment-methods',
    methods: ['GET'],
    role: 'ADMIN',
    description: 'List payment methods',
  },
  {
    path: '/api/payment-methods',
    methods: ['POST'],
    role: 'ADMIN',
    description: 'Create payment method',
  },
  {
    path: '/api/payment-methods/[id]',
    methods: ['GET', 'PUT', 'DELETE'],
    role: 'ADMIN',
    description: 'Manage payment method',
  },

  // ===== SETTINGS (CRITICAL - NEEDS PROTECTION) =====
  {
    path: '/api/settings',
    methods: ['GET'],
    role: 'ADMIN',
    description: 'Get global settings',
  },
  {
    path: '/api/settings',
    methods: ['PUT'],
    role: 'ADMIN',
    description: 'Update global settings',
  },

  // ===== IMPORT (CRITICAL - NEEDS PROTECTION) =====
  {
    path: '/api/import/products/analyze',
    methods: ['POST'],
    role: 'ADMIN',
    description: 'Analyze product import file',
  },
  {
    path: '/api/import/products/validate',
    methods: ['POST'],
    role: 'ADMIN',
    description: 'Validate product import data',
  },
  {
    path: '/api/import/products/preview',
    methods: ['POST'],
    role: 'ADMIN',
    description: 'Preview product import',
  },
  {
    path: '/api/import/products/execute',
    methods: ['POST'],
    role: 'ADMIN',
    description: 'Execute product import',
  },

  // ===== FILES (CRITICAL - NEEDS PROTECTION) =====
  {
    path: '/api/files/upload',
    methods: ['POST'],
    role: 'ADMIN',
    description: 'Upload file to CDN',
  },
  {
    path: '/api/files/upload',
    methods: ['GET'],
    role: 'ADMIN',
    description: 'Get CDN URL',
  },

  // ===== REPORTS (PROTECTED) =====
  {
    path: '/api/reports/debtors',
    methods: ['GET'],
    role: 'ADMIN',
    description: 'Get debtors report',
  },

  // ===== ADMIN (PROTECTED) =====
  {
    path: '/api/admin/recalculate-balances',
    methods: ['POST'],
    role: 'ADMIN',
    description: 'Recalculate customer balances',
  },

  // ===== DASHBOARD (PROTECTED) =====
  {
    path: '/api/dashboard/summary',
    methods: ['GET'],
    role: 'ADMIN',
    description: 'Get dashboard summary',
  },

  // ===== PUBLIC ENDPOINTS =====
  {
    path: '/api/health',
    methods: ['GET'],
    role: 'PUBLIC',
    description: 'Health check endpoint',
  },
  {
    path: '/api/health/db',
    methods: ['GET'],
    role: 'PUBLIC',
    description: 'Database health check',
  },
  {
    path: '/api/debug/env',
    methods: ['GET'],
    role: 'PUBLIC',
    description: 'Debug environment variables (dev only)',
  },
  {
    path: '/api/roles',
    methods: ['GET'],
    role: 'PUBLIC',
    description: 'Get available roles',
  },
  {
    path: '/api/products-services/search',
    methods: ['GET'],
    role: 'ADMIN',
    description: 'Search products and services',
  },
];

/**
 * Helper function to get required role for a route
 */
export function getRouteRole(path: string, method: 'GET' | 'POST' | 'PUT' | 'DELETE'): RouteRole {
  const route = API_ROUTES_CONFIG.find(
    (r) => r.path === path && r.methods.includes(method)
  );
  return route?.role || 'STAFF'; // Default to STAFF for safety
}

/**
 * Helper function to map RouteRole to UserRole
 */
export function routeRoleToUserRole(role: RouteRole): UserRole | null {
  switch (role) {
    case 'PUBLIC':
      return null;
    case 'USER':
      return UserRole.USER;
    case 'STAFF':
      return UserRole.STAFF;
    case 'ADMIN':
      return UserRole.ADMIN;
  }
}
