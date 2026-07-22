import { relations } from "drizzle-orm/relations";
import { creditNote, creditNoteItem, product, service, customer, directSale, directSaleItem, directSalePayment, paymentMethod, inventoryCountOperative, inventoryCountItem, user, account, workOrder, photo, payment, invoice, category, supplier, purchaseVoucher, stockMovement, vehicle, vehicleMake, vehicleModel, purchaseVoucherItem, session, workOrderItem, workOrderAuditLog, priceList, priceListItem, balanceAudit } from "./schema";

export const creditNoteItemRelations = relations(creditNoteItem, ({one}) => ({
	creditNote: one(creditNote, {
		fields: [creditNoteItem.creditNoteId],
		references: [creditNote.id]
	}),
	product: one(product, {
		fields: [creditNoteItem.productId],
		references: [product.id]
	}),
	service: one(service, {
		fields: [creditNoteItem.serviceId],
		references: [service.id]
	}),
}));

export const creditNoteRelations = relations(creditNote, ({one, many}) => ({
	creditNoteItems: many(creditNoteItem),
	customer: one(customer, {
		fields: [creditNote.customerId],
		references: [customer.id]
	}),
	invoice: one(invoice, {
		fields: [creditNote.invoiceId],
		references: [invoice.id]
	}),
}));

export const productRelations = relations(product, ({one, many}) => ({
	creditNoteItems: many(creditNoteItem),
	directSaleItems: many(directSaleItem),
	inventoryCountItems: many(inventoryCountItem),
	category: one(category, {
		fields: [product.categoryId],
		references: [category.id]
	}),
	supplier: one(supplier, {
		fields: [product.supplierId],
		references: [supplier.id]
	}),
	stockMovements: many(stockMovement),
	purchaseVoucherItems: many(purchaseVoucherItem),
	workOrderItems: many(workOrderItem),
	priceListItems: many(priceListItem),
}));

export const serviceRelations = relations(service, ({many}) => ({
	creditNoteItems: many(creditNoteItem),
	directSaleItems: many(directSaleItem),
	workOrderItems: many(workOrderItem),
}));

export const directSaleRelations = relations(directSale, ({one, many}) => ({
	customer: one(customer, {
		fields: [directSale.customerId],
		references: [customer.id]
	}),
	directSaleItems: many(directSaleItem),
	directSalePayments: many(directSalePayment),
}));

export const customerRelations = relations(customer, ({many}) => ({
	directSales: many(directSale),
	invoices: many(invoice),
	vehicles: many(vehicle),
	creditNotes: many(creditNote),
	workOrders: many(workOrder),
	balanceAudits: many(balanceAudit),
}));

export const directSaleItemRelations = relations(directSaleItem, ({one}) => ({
	directSale: one(directSale, {
		fields: [directSaleItem.directSaleId],
		references: [directSale.id]
	}),
	product: one(product, {
		fields: [directSaleItem.productId],
		references: [product.id]
	}),
	service: one(service, {
		fields: [directSaleItem.serviceId],
		references: [service.id]
	}),
}));

export const directSalePaymentRelations = relations(directSalePayment, ({one}) => ({
	directSale: one(directSale, {
		fields: [directSalePayment.directSaleId],
		references: [directSale.id]
	}),
	paymentMethod: one(paymentMethod, {
		fields: [directSalePayment.paymentMethodId],
		references: [paymentMethod.id]
	}),
}));

export const paymentMethodRelations = relations(paymentMethod, ({many}) => ({
	directSalePayments: many(directSalePayment),
	payments: many(payment),
	purchaseVouchers: many(purchaseVoucher),
}));

export const inventoryCountItemRelations = relations(inventoryCountItem, ({one}) => ({
	inventoryCountOperative: one(inventoryCountOperative, {
		fields: [inventoryCountItem.operativeId],
		references: [inventoryCountOperative.id]
	}),
	product: one(product, {
		fields: [inventoryCountItem.productId],
		references: [product.id]
	}),
}));

export const inventoryCountOperativeRelations = relations(inventoryCountOperative, ({many}) => ({
	inventoryCountItems: many(inventoryCountItem),
}));

export const accountRelations = relations(account, ({one}) => ({
	user: one(user, {
		fields: [account.userId],
		references: [user.id]
	}),
}));

export const userRelations = relations(user, ({many}) => ({
	accounts: many(account),
	sessions: many(session),
}));

export const photoRelations = relations(photo, ({one}) => ({
	workOrder: one(workOrder, {
		fields: [photo.workOrderId],
		references: [workOrder.id]
	}),
}));

export const workOrderRelations = relations(workOrder, ({one, many}) => ({
	photos: many(photo),
	payments: many(payment),
	workOrderItems: many(workOrderItem),
	workOrderAuditLogs: many(workOrderAuditLog),
	customer: one(customer, {
		fields: [workOrder.customerId],
		references: [customer.id]
	}),
	vehicle: one(vehicle, {
		fields: [workOrder.vehicleId],
		references: [vehicle.id]
	}),
}));

export const paymentRelations = relations(payment, ({one}) => ({
	paymentMethod: one(paymentMethod, {
		fields: [payment.paymentMethodId],
		references: [paymentMethod.id]
	}),
	workOrder: one(workOrder, {
		fields: [payment.workOrderId],
		references: [workOrder.id]
	}),
}));

export const invoiceRelations = relations(invoice, ({one, many}) => ({
	customer: one(customer, {
		fields: [invoice.customerId],
		references: [customer.id]
	}),
	creditNotes: many(creditNote),
}));

export const categoryRelations = relations(category, ({many}) => ({
	products: many(product),
}));

export const supplierRelations = relations(supplier, ({many}) => ({
	products: many(product),
	purchaseVouchers: many(purchaseVoucher),
}));

export const purchaseVoucherRelations = relations(purchaseVoucher, ({one, many}) => ({
	paymentMethod: one(paymentMethod, {
		fields: [purchaseVoucher.paymentMethodId],
		references: [paymentMethod.id]
	}),
	supplier: one(supplier, {
		fields: [purchaseVoucher.supplierId],
		references: [supplier.id]
	}),
	purchaseVoucherItems: many(purchaseVoucherItem),
}));

export const stockMovementRelations = relations(stockMovement, ({one}) => ({
	product: one(product, {
		fields: [stockMovement.productId],
		references: [product.id]
	}),
}));

export const vehicleRelations = relations(vehicle, ({one, many}) => ({
	customer: one(customer, {
		fields: [vehicle.customerId],
		references: [customer.id]
	}),
	vehicleMake: one(vehicleMake, {
		fields: [vehicle.makeId],
		references: [vehicleMake.id]
	}),
	vehicleModel: one(vehicleModel, {
		fields: [vehicle.modelId],
		references: [vehicleModel.id]
	}),
	workOrders: many(workOrder),
}));

export const vehicleMakeRelations = relations(vehicleMake, ({many}) => ({
	vehicles: many(vehicle),
	vehicleModels: many(vehicleModel),
}));

export const vehicleModelRelations = relations(vehicleModel, ({one, many}) => ({
	vehicles: many(vehicle),
	vehicleMake: one(vehicleMake, {
		fields: [vehicleModel.makeId],
		references: [vehicleMake.id]
	}),
}));

export const purchaseVoucherItemRelations = relations(purchaseVoucherItem, ({one}) => ({
	product: one(product, {
		fields: [purchaseVoucherItem.productId],
		references: [product.id]
	}),
	purchaseVoucher: one(purchaseVoucher, {
		fields: [purchaseVoucherItem.voucherId],
		references: [purchaseVoucher.id]
	}),
}));

export const sessionRelations = relations(session, ({one}) => ({
	user: one(user, {
		fields: [session.userId],
		references: [user.id]
	}),
}));

export const workOrderItemRelations = relations(workOrderItem, ({one}) => ({
	product: one(product, {
		fields: [workOrderItem.productId],
		references: [product.id]
	}),
	service: one(service, {
		fields: [workOrderItem.serviceId],
		references: [service.id]
	}),
	workOrder: one(workOrder, {
		fields: [workOrderItem.workOrderId],
		references: [workOrder.id]
	}),
}));

export const workOrderAuditLogRelations = relations(workOrderAuditLog, ({one}) => ({
	workOrder: one(workOrder, {
		fields: [workOrderAuditLog.workOrderId],
		references: [workOrder.id]
	}),
}));

export const priceListItemRelations = relations(priceListItem, ({one}) => ({
	priceList: one(priceList, {
		fields: [priceListItem.priceListId],
		references: [priceList.id]
	}),
	product: one(product, {
		fields: [priceListItem.productId],
		references: [product.id]
	}),
}));

export const priceListRelations = relations(priceList, ({many}) => ({
	priceListItems: many(priceListItem),
}));

export const balanceAuditRelations = relations(balanceAudit, ({one}) => ({
	customer: one(customer, {
		fields: [balanceAudit.customerId],
		references: [customer.id]
	}),
}));