import { pgTable, varchar, timestamp, text, integer, index, jsonb, numeric, foreignKey, boolean, uniqueIndex, doublePrecision, uuid } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const customer = pgTable("customer", {
	id: text().primaryKey().default(sql`gen_random_uuid()`).notNull(),
	phone: text(),
	phoneAlt: text(),
	email: text(),
	address: text(),
	notes: text(),
	createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ precision: 3, mode: 'string' }).defaultNow().notNull(),
	billingData: jsonb(),
	name: text().notNull(),
	balance: numeric({ precision: 10, scale:  2 }).default('0').notNull(),
}, (table) => [
	index("customer_balance_idx").using("btree", table.balance.asc().nullsLast().op("numeric_ops")),
	index("customer_name_idx").using("btree", table.name.asc().nullsLast().op("text_ops")),
	index("customer_phone_idx").using("btree", table.phone.asc().nullsLast().op("text_ops")),
]);

export const cashMovement = pgTable("cash_movement", {
	id: text().primaryKey().default(sql`gen_random_uuid()`).notNull(),
	type: text().notNull(),
	amount: numeric({ precision: 10, scale:  2 }).notNull(),
	method: text().notNull(),
	referenceId: text(),
	referenceType: text(),
	reason: text(),
	notes: text(),
	createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	createdBy: text().notNull(),
	responsibleId: text(),
}, (table) => [
	index("cash_movement_createdAt_idx").using("btree", table.createdAt.asc().nullsLast().op("timestamp_ops")),
	index("cash_movement_referenceId_idx").using("btree", table.referenceId.asc().nullsLast().op("text_ops")),
	index("cash_movement_responsibleId_idx").using("btree", table.responsibleId.asc().nullsLast().op("text_ops")),
	index("cash_movement_type_idx").using("btree", table.type.asc().nullsLast().op("text_ops")),
]);

export const costUpdateBatch = pgTable("cost_update_batch", {
	id: text().primaryKey().default(sql`gen_random_uuid()`).notNull(),
	userId: text().notNull(),
	userName: text(),
	filtersApplied: jsonb().notNull(),
	adjustmentType: text().notNull(),
	adjustmentValue: numeric({ precision: 10, scale:  2 }).notNull(),
	itemsAffected: integer().notNull(),
	createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
	index("cost_update_batch_createdAt_idx").using("btree", table.createdAt.asc().nullsLast().op("timestamp_ops")),
	index("cost_update_batch_userId_idx").using("btree", table.userId.asc().nullsLast().op("text_ops")),
]);

export const creditNoteItem = pgTable("credit_note_item", {
	id: text().primaryKey().default(sql`gen_random_uuid()`).notNull(),
	creditNoteId: text().notNull(),
	productId: text(),
	serviceId: text(),
	name: text().notNull(),
	quantity: integer().notNull(),
	unitPrice: numeric({ precision: 10, scale:  2 }).notNull(),
	totalPrice: numeric({ precision: 10, scale:  2 }).notNull(),
}, (table) => [
	index("credit_note_item_creditNoteId_idx").using("btree", table.creditNoteId.asc().nullsLast().op("text_ops")),
	index("credit_note_item_productId_idx").using("btree", table.productId.asc().nullsLast().op("text_ops")),
	index("credit_note_item_serviceId_idx").using("btree", table.serviceId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.creditNoteId],
			foreignColumns: [creditNote.id],
			name: "credit_note_item_creditNoteId_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
	foreignKey({
			columns: [table.productId],
			foreignColumns: [product.id],
			name: "credit_note_item_productId_fkey"
		}).onUpdate("cascade").onDelete("set null"),
	foreignKey({
			columns: [table.serviceId],
			foreignColumns: [service.id],
			name: "credit_note_item_serviceId_fkey"
		}).onUpdate("cascade").onDelete("set null"),
]);

export const directSale = pgTable("direct_sale", {
	id: text().primaryKey().default(sql`gen_random_uuid()`).notNull(),
	customerId: text(),
	customerName: text().notNull(),
	total: numeric({ precision: 10, scale:  2 }).notNull(),
	notes: text(),
	createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	createdBy: text().notNull(),
}, (table) => [
	index("direct_sale_createdAt_idx").using("btree", table.createdAt.asc().nullsLast().op("timestamp_ops")),
	index("direct_sale_customerId_idx").using("btree", table.customerId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.customerId],
			foreignColumns: [customer.id],
			name: "direct_sale_customerId_fkey"
		}).onUpdate("cascade").onDelete("set null"),
]);

export const directSaleItem = pgTable("direct_sale_item", {
	id: text().primaryKey().default(sql`gen_random_uuid()`).notNull(),
	directSaleId: text().notNull(),
	productId: text(),
	serviceId: text(),
	name: text().notNull(),
	quantity: integer().notNull(),
	unitPrice: numeric({ precision: 10, scale:  2 }).notNull(),
	totalPrice: numeric({ precision: 10, scale:  2 }).notNull(),
}, (table) => [
	index("direct_sale_item_directSaleId_idx").using("btree", table.directSaleId.asc().nullsLast().op("text_ops")),
	index("direct_sale_item_productId_idx").using("btree", table.productId.asc().nullsLast().op("text_ops")),
	index("direct_sale_item_serviceId_idx").using("btree", table.serviceId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.directSaleId],
			foreignColumns: [directSale.id],
			name: "direct_sale_item_directSaleId_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
	foreignKey({
			columns: [table.productId],
			foreignColumns: [product.id],
			name: "direct_sale_item_productId_fkey"
		}).onUpdate("cascade").onDelete("set null"),
	foreignKey({
			columns: [table.serviceId],
			foreignColumns: [service.id],
			name: "direct_sale_item_serviceId_fkey"
		}).onUpdate("cascade").onDelete("set null"),
]);

export const directSalePayment = pgTable("direct_sale_payment", {
	id: text().primaryKey().default(sql`gen_random_uuid()`).notNull(),
	directSaleId: text().notNull(),
	paymentMethodId: text().notNull(),
	amount: numeric({ precision: 10, scale:  2 }).notNull(),
	notes: text(),
	createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	createdBy: text().notNull(),
}, (table) => [
	index("direct_sale_payment_directSaleId_idx").using("btree", table.directSaleId.asc().nullsLast().op("text_ops")),
	index("direct_sale_payment_paymentMethodId_idx").using("btree", table.paymentMethodId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.directSaleId],
			foreignColumns: [directSale.id],
			name: "direct_sale_payment_directSaleId_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
	foreignKey({
			columns: [table.paymentMethodId],
			foreignColumns: [paymentMethod.id],
			name: "direct_sale_payment_paymentMethodId_fkey"
		}).onUpdate("cascade").onDelete("restrict"),
]);

export const inventoryCountOperative = pgTable("inventory_count_operative", {
	id: text().primaryKey().default(sql`gen_random_uuid()`).notNull(),
	status: text().default('PENDING').notNull(),
	itemCount: integer().notNull(),
	createdBy: text().notNull(),
	createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ precision: 3, mode: 'string' }).defaultNow().notNull(),
	finishedAt: timestamp({ precision: 3, mode: 'string' }),
	approvedAt: timestamp({ precision: 3, mode: 'string' }),
	approvedBy: text(),
}, (table) => [
	index("inventory_count_operative_createdAt_idx").using("btree", table.createdAt.asc().nullsLast().op("timestamp_ops")),
	index("inventory_count_operative_status_idx").using("btree", table.status.asc().nullsLast().op("text_ops")),
]);

export const inventoryCountItem = pgTable("inventory_count_item", {
	id: text().primaryKey().default(sql`gen_random_uuid()`).notNull(),
	operativeId: text().notNull(),
	productId: text().notNull(),
	theoreticalStock: integer().notNull(),
	countedStock: integer(),
	previousLocation: text(),
	newLocation: text(),
	isFound: boolean().default(false).notNull(),
	reportedAt: timestamp({ precision: 3, mode: 'string' }),
	reportedBy: text(),
}, (table) => [
	index("inventory_count_item_operativeId_idx").using("btree", table.operativeId.asc().nullsLast().op("text_ops")),
	index("inventory_count_item_productId_idx").using("btree", table.productId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.operativeId],
			foreignColumns: [inventoryCountOperative.id],
			name: "inventory_count_item_operativeId_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
	foreignKey({
			columns: [table.productId],
			foreignColumns: [product.id],
			name: "inventory_count_item_productId_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
]);

export const category = pgTable("category", {
	id: text().primaryKey().default(sql`gen_random_uuid()`).notNull(),
	name: text().notNull(),
	description: text(),
	defaultMarginPercent: doublePrecision().default(40).notNull(),
	color: text(),
	sortOrder: integer().default(0).notNull(),
	isActive: boolean().default(true).notNull(),
	createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ precision: 3, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	uniqueIndex("category_name_key").using("btree", table.name.asc().nullsLast().op("text_ops")),
	index("category_sortOrder_idx").using("btree", table.sortOrder.asc().nullsLast().op("int4_ops")),
]);

export const account = pgTable("account", {
	id: text().primaryKey().default(sql`gen_random_uuid()`).notNull(),
	accountId: text().notNull(),
	providerId: text().notNull(),
	userId: text().notNull(),
	accessToken: text(),
	refreshToken: text(),
	idToken: text(),
	accessTokenExpiresAt: timestamp({ precision: 3, mode: 'string' }),
	refreshTokenExpiresAt: timestamp({ precision: 3, mode: 'string' }),
	scope: text(),
	password: text(),
	createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ precision: 3, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("account_userId_idx").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "account_userId_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
]);

export const photo = pgTable("photo", {
	id: text().primaryKey().default(sql`gen_random_uuid()`).notNull(),
	workOrderId: text().notNull(),
	type: text().notNull(),
	url: text().notNull(),
	description: text(),
	createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
	index("photo_type_idx").using("btree", table.type.asc().nullsLast().op("text_ops")),
	index("photo_workOrderId_idx").using("btree", table.workOrderId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.workOrderId],
			foreignColumns: [workOrder.id],
			name: "photo_workOrderId_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
]);

export const payment = pgTable("payment", {
	id: text().primaryKey().default(sql`gen_random_uuid()`).notNull(),
	workOrderId: text().notNull(),
	paymentMethodId: text().notNull(),
	amount: numeric({ precision: 10, scale:  2 }).notNull(),
	notes: text(),
	createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	createdBy: text().notNull(),
}, (table) => [
	index("payment_paymentMethodId_idx").using("btree", table.paymentMethodId.asc().nullsLast().op("text_ops")),
	index("payment_workOrderId_idx").using("btree", table.workOrderId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.paymentMethodId],
			foreignColumns: [paymentMethod.id],
			name: "payment_paymentMethodId_fkey"
		}).onUpdate("cascade").onDelete("restrict"),
	foreignKey({
			columns: [table.workOrderId],
			foreignColumns: [workOrder.id],
			name: "payment_workOrderId_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
]);

export const priceList = pgTable("price_list", {
	id: text().primaryKey().default(sql`gen_random_uuid()`).notNull(),
	name: text().notNull(),
	isPublic: boolean().default(false).notNull(),
	isActive: boolean().default(true).notNull(),
	startDate: timestamp({ precision: 3, mode: 'string' }),
	endDate: timestamp({ precision: 3, mode: 'string' }),
	baseMarginPercentage: numeric({ precision: 5, scale:  2 }).notNull(),
	roundingRule: text().default('SMART_HUNDREDS').notNull(),
	createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ precision: 3, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("price_list_isActive_idx").using("btree", table.isActive.asc().nullsLast().op("bool_ops")),
	index("price_list_isPublic_idx").using("btree", table.isPublic.asc().nullsLast().op("bool_ops")),
]);

export const invoice = pgTable("invoice", {
	id: text().primaryKey().default(sql`gen_random_uuid()`).notNull(),
	number: text().notNull(),
	type: text().notNull(),
	referenceId: text().notNull(),
	referenceType: text().notNull(),
	customerId: text(),
	customerName: text().notNull(),
	subtotal: numeric({ precision: 10, scale:  2 }).notNull(),
	tax: numeric({ precision: 10, scale:  2 }),
	total: numeric({ precision: 10, scale:  2 }).notNull(),
	afipData: jsonb(),
	status: text().notNull(),
	issuedAt: timestamp({ precision: 3, mode: 'string' }),
	createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	createdBy: text().notNull(),
	customerDoc: text(),
	customerDocType: text(),
	iva21: numeric({ precision: 10, scale:  2 }),
	iva105: numeric({ precision: 10, scale:  2 }),
	exemptions: jsonb(),
	perceptions: jsonb(),
}, (table) => [
	index("invoice_issuedAt_idx").using("btree", table.issuedAt.asc().nullsLast().op("timestamp_ops")),
	index("invoice_number_idx").using("btree", table.number.asc().nullsLast().op("text_ops")),
	uniqueIndex("invoice_number_key").using("btree", table.number.asc().nullsLast().op("text_ops")),
	index("invoice_referenceId_idx").using("btree", table.referenceId.asc().nullsLast().op("text_ops")),
	index("invoice_status_idx").using("btree", table.status.asc().nullsLast().op("text_ops")),
	index("invoice_type_idx").using("btree", table.type.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.customerId],
			foreignColumns: [customer.id],
			name: "invoice_customerId_fkey"
		}).onUpdate("cascade").onDelete("set null"),
]);

export const paymentMethod = pgTable("payment_method", {
	id: text().primaryKey().default(sql`gen_random_uuid()`).notNull(),
	name: text().notNull(),
	code: text().notNull(),
	description: text(),
	isActive: boolean().default(true).notNull(),
	sortOrder: integer().default(0).notNull(),
	createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ precision: 3, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	uniqueIndex("payment_method_code_key").using("btree", table.code.asc().nullsLast().op("text_ops")),
	index("payment_method_isActive_idx").using("btree", table.isActive.asc().nullsLast().op("bool_ops")),
	uniqueIndex("payment_method_name_key").using("btree", table.name.asc().nullsLast().op("text_ops")),
	index("payment_method_sortOrder_idx").using("btree", table.sortOrder.asc().nullsLast().op("int4_ops")),
]);

export const product = pgTable("product", {
	id: text().primaryKey().default(sql`gen_random_uuid()`).notNull(),
	sku: text(),
	name: text().notNull(),
	description: text(),
	costPrice: numeric({ precision: 10, scale:  2 }).notNull(),
	stock: integer().default(0).notNull(),
	minStock: integer().default(0).notNull(),
	barcode: text(),
	location: text(),
	isActive: boolean().default(true).notNull(),
	createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ precision: 3, mode: 'string' }).defaultNow().notNull(),
	categoryId: text().notNull(),
	supplierId: text(),
	lastMovementAt: timestamp({ precision: 3, mode: 'string' }),
	replacementCost: numeric({ precision: 10, scale:  2 }).notNull(),
	imageBranch: text().default('main'),
	imageCommit: text(),
	imageUrl: text(),
	lastCountedAt: timestamp({ precision: 3, mode: 'string' }),
}, (table) => [
	index("product_categoryId_idx").using("btree", table.categoryId.asc().nullsLast().op("text_ops")),
	index("product_imageUrl_idx").using("btree", table.imageUrl.asc().nullsLast().op("text_ops")),
	index("product_isActive_idx").using("btree", table.isActive.asc().nullsLast().op("bool_ops")),
	index("product_lastMovementAt_idx").using("btree", table.lastMovementAt.asc().nullsLast().op("timestamp_ops")),
	index("product_name_idx").using("btree", table.name.asc().nullsLast().op("text_ops")),
	index("product_sku_idx").using("btree", table.sku.asc().nullsLast().op("text_ops")),
	uniqueIndex("product_sku_key").using("btree", table.sku.asc().nullsLast().op("text_ops")),
	index("product_stock_minStock_idx").using("btree", table.stock.asc().nullsLast().op("int4_ops"), table.minStock.asc().nullsLast().op("int4_ops")),
	index("product_supplierId_idx").using("btree", table.supplierId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.categoryId],
			foreignColumns: [category.id],
			name: "product_categoryId_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
	foreignKey({
			columns: [table.supplierId],
			foreignColumns: [supplier.id],
			name: "product_supplierId_fkey"
		}).onUpdate("cascade").onDelete("set null"),
]);

export const purchaseVoucher = pgTable("purchase_voucher", {
	id: text().primaryKey().default(sql`gen_random_uuid()`).notNull(),
	supplierId: text().notNull(),
	letter: text().notNull(),
	number: text().notNull(),
	date: timestamp({ precision: 3, mode: 'string' }).notNull(),
	totalAmount: numeric({ precision: 10, scale:  2 }).notNull(),
	paymentMethodId: text(),
	notes: text(),
	status: text().default('DRAFT').notNull(),
	createdBy: text().notNull(),
	createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ precision: 3, mode: 'string' }).defaultNow().notNull(),
	finalizedAt: timestamp({ precision: 3, mode: 'string' }),
}, (table) => [
	index("purchase_voucher_createdAt_idx").using("btree", table.createdAt.asc().nullsLast().op("timestamp_ops")),
	index("purchase_voucher_status_idx").using("btree", table.status.asc().nullsLast().op("text_ops")),
	index("purchase_voucher_supplierId_idx").using("btree", table.supplierId.asc().nullsLast().op("text_ops")),
	uniqueIndex("purchase_voucher_supplierId_letter_number_key").using("btree", table.supplierId.asc().nullsLast().op("text_ops"), table.letter.asc().nullsLast().op("text_ops"), table.number.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.paymentMethodId],
			foreignColumns: [paymentMethod.id],
			name: "purchase_voucher_paymentMethodId_fkey"
		}).onUpdate("cascade").onDelete("set null"),
	foreignKey({
			columns: [table.supplierId],
			foreignColumns: [supplier.id],
			name: "purchase_voucher_supplierId_fkey"
		}).onUpdate("cascade").onDelete("restrict"),
]);

export const supplier = pgTable("supplier", {
	id: text().primaryKey().default(sql`gen_random_uuid()`).notNull(),
	name: text().notNull(),
	contactName: text(),
	phone: text(),
	email: text(),
	address: text(),
	notes: text(),
	isActive: boolean().default(true).notNull(),
	createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ precision: 3, mode: 'string' }).defaultNow().notNull(),
	cuit: text(),
}, (table) => [
	index("supplier_isActive_idx").using("btree", table.isActive.asc().nullsLast().op("bool_ops")),
	index("supplier_name_idx").using("btree", table.name.asc().nullsLast().op("text_ops")),
	uniqueIndex("supplier_name_key").using("btree", table.name.asc().nullsLast().op("text_ops")),
]);

export const stockMovement = pgTable("stock_movement", {
	id: text().primaryKey().default(sql`gen_random_uuid()`).notNull(),
	productId: text().notNull(),
	userId: text(),
	userName: text(),
	type: text().notNull(),
	quantity: integer().notNull(),
	previousStock: integer().notNull(),
	newStock: integer().notNull(),
	reason: text().notNull(),
	reasonDetails: text(),
	salePrice: numeric({ precision: 10, scale:  2 }),
	createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
	index("stock_movement_createdAt_idx").using("btree", table.createdAt.asc().nullsLast().op("timestamp_ops")),
	index("stock_movement_productId_idx").using("btree", table.productId.asc().nullsLast().op("text_ops")),
	index("stock_movement_type_idx").using("btree", table.type.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.productId],
			foreignColumns: [product.id],
			name: "stock_movement_productId_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
]);

export const setting = pgTable("setting", {
	id: text().primaryKey().default(sql`gen_random_uuid()`).notNull(),
	key: text().notNull(),
	value: text().notNull(),
	updatedAt: timestamp({ precision: 3, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	uniqueIndex("setting_key_key").using("btree", table.key.asc().nullsLast().op("text_ops")),
]);

export const vehicle = pgTable("vehicle", {
	id: text().primaryKey().default(sql`gen_random_uuid()`).notNull(),
	identifier: text().notNull(),
	category: text().notNull(),
	makeId: text(),
	modelId: text(),
	year: integer(),
	color: text(),
	equipmentName: text(),
	equipmentType: text(),
	description: text(),
	notes: text(),
	customerId: text().notNull(),
	createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ precision: 3, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("vehicle_category_idx").using("btree", table.category.asc().nullsLast().op("text_ops")),
	index("vehicle_customerId_idx").using("btree", table.customerId.asc().nullsLast().op("text_ops")),
	uniqueIndex("vehicle_identifier_customerId_key").using("btree", table.identifier.asc().nullsLast().op("text_ops"), table.customerId.asc().nullsLast().op("text_ops")),
	index("vehicle_identifier_idx").using("btree", table.identifier.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.customerId],
			foreignColumns: [customer.id],
			name: "vehicle_customerId_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
	foreignKey({
			columns: [table.makeId],
			foreignColumns: [vehicleMake.id],
			name: "vehicle_makeId_fkey"
		}).onUpdate("cascade").onDelete("set null"),
	foreignKey({
			columns: [table.modelId],
			foreignColumns: [vehicleModel.id],
			name: "vehicle_modelId_fkey"
		}).onUpdate("cascade").onDelete("set null"),
]);

export const purchaseVoucherItem = pgTable("purchase_voucher_item", {
	id: text().primaryKey().default(sql`gen_random_uuid()`).notNull(),
	voucherId: text().notNull(),
	productId: text().notNull(),
	productName: text().notNull(),
	quantity: integer().notNull(),
	unitCost: numeric({ precision: 10, scale:  2 }).notNull(),
	subtotal: numeric({ precision: 10, scale:  2 }).notNull(),
	createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ precision: 3, mode: 'string' }).defaultNow().notNull(),
	priceListData: jsonb(),
}, (table) => [
	index("purchase_voucher_item_productId_idx").using("btree", table.productId.asc().nullsLast().op("text_ops")),
	index("purchase_voucher_item_voucherId_idx").using("btree", table.voucherId.asc().nullsLast().op("text_ops")),
	uniqueIndex("purchase_voucher_item_voucherId_productId_key").using("btree", table.voucherId.asc().nullsLast().op("text_ops"), table.productId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.productId],
			foreignColumns: [product.id],
			name: "purchase_voucher_item_productId_fkey"
		}).onUpdate("cascade").onDelete("restrict"),
	foreignKey({
			columns: [table.voucherId],
			foreignColumns: [purchaseVoucher.id],
			name: "purchase_voucher_item_voucherId_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
]);

export const service = pgTable("service", {
	id: text().primaryKey().default(sql`gen_random_uuid()`).notNull(),
	name: text().notNull(),
	description: text(),
	baseCost: numeric({ precision: 10, scale:  2 }).notNull(),
	timeMinutes: integer().default(60).notNull(),
	vehicleFactor: numeric({ precision: 3, scale:  2 }).default('1.0').notNull(),
	isActive: boolean().default(true).notNull(),
	createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ precision: 3, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("service_isActive_idx").using("btree", table.isActive.asc().nullsLast().op("bool_ops")),
	uniqueIndex("service_name_key").using("btree", table.name.asc().nullsLast().op("text_ops")),
]);

export const userRole = pgTable("user_role", {
	id: text().primaryKey().default(sql`gen_random_uuid()`).notNull(),
	email: text().notNull(),
	role: text().notNull(),
	name: text(),
	notes: text(),
	isActive: boolean().default(true).notNull(),
	createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ precision: 3, mode: 'string' }).defaultNow().notNull(),
	lastLogin: timestamp({ precision: 3, mode: 'string' }),
	image: text(),
}, (table) => [
	index("user_role_email_idx").using("btree", table.email.asc().nullsLast().op("text_ops")),
	uniqueIndex("user_role_email_key").using("btree", table.email.asc().nullsLast().op("text_ops")),
	index("user_role_role_idx").using("btree", table.role.asc().nullsLast().op("text_ops")),
]);

export const vehicleMake = pgTable("vehicle_make", {
	id: text().primaryKey().default(sql`gen_random_uuid()`).notNull(),
	name: text().notNull(),
	normalizedName: text().notNull(),
	category: text().array(),
	isActive: boolean().default(true).notNull(),
	createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
	index("vehicle_make_normalizedName_idx").using("btree", table.normalizedName.asc().nullsLast().op("text_ops")),
	uniqueIndex("vehicle_make_normalizedName_key").using("btree", table.normalizedName.asc().nullsLast().op("text_ops")),
]);

export const vehicleModel = pgTable("vehicle_model", {
	id: text().primaryKey().default(sql`gen_random_uuid()`).notNull(),
	makeId: text().notNull(),
	name: text().notNull(),
	normalizedName: text().notNull(),
	years: integer().array(),
	isActive: boolean().default(true).notNull(),
	createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
	index("vehicle_model_makeId_idx").using("btree", table.makeId.asc().nullsLast().op("text_ops")),
	uniqueIndex("vehicle_model_makeId_normalizedName_key").using("btree", table.makeId.asc().nullsLast().op("text_ops"), table.normalizedName.asc().nullsLast().op("text_ops")),
	index("vehicle_model_normalizedName_idx").using("btree", table.normalizedName.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.makeId],
			foreignColumns: [vehicleMake.id],
			name: "vehicle_model_makeId_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
]);

export const user = pgTable("user", {
	id: text().primaryKey().default(sql`gen_random_uuid()`).notNull(),
	name: text().notNull(),
	email: text().notNull(),
	emailVerified: boolean().default(false).notNull(),
	image: text(),
	createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ precision: 3, mode: 'string' }).defaultNow().notNull(),
	role: text().default('USER').notNull(),
}, (table) => [
	uniqueIndex("user_email_key").using("btree", table.email.asc().nullsLast().op("text_ops")),
]);

export const session = pgTable("session", {
	id: text().primaryKey().default(sql`gen_random_uuid()`).notNull(),
	expiresAt: timestamp({ precision: 3, mode: 'string' }).notNull(),
	token: text().notNull(),
	createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ precision: 3, mode: 'string' }).defaultNow().notNull(),
	ipAddress: text(),
	userAgent: text(),
	userId: text().notNull(),
}, (table) => [
	uniqueIndex("session_token_key").using("btree", table.token.asc().nullsLast().op("text_ops")),
	index("session_userId_idx").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "session_userId_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
]);

export const verification = pgTable("verification", {
	id: text().primaryKey().default(sql`gen_random_uuid()`).notNull(),
	identifier: text().notNull(),
	value: text().notNull(),
	expiresAt: timestamp({ precision: 3, mode: 'string' }).notNull(),
	createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ precision: 3, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("verification_identifier_idx").using("btree", table.identifier.asc().nullsLast().op("text_ops")),
]);

export const workOrderItem = pgTable("work_order_item", {
	id: text().primaryKey().default(sql`gen_random_uuid()`).notNull(),
	workOrderId: text().notNull(),
	type: text().notNull(),
	productId: text(),
	serviceId: text(),
	quantity: integer().notNull(),
	unitPrice: numeric({ precision: 10, scale:  2 }).notNull(),
	subtotal: numeric({ precision: 10, scale:  2 }).notNull(),
	isManualPrice: boolean().default(false).notNull(),
	priceListId: text(),
	name: text(),
	isManualName: boolean().default(false).notNull(),
}, (table) => [
	index("work_order_item_productId_idx").using("btree", table.productId.asc().nullsLast().op("text_ops")),
	index("work_order_item_serviceId_idx").using("btree", table.serviceId.asc().nullsLast().op("text_ops")),
	index("work_order_item_workOrderId_idx").using("btree", table.workOrderId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.productId],
			foreignColumns: [product.id],
			name: "work_order_item_productId_fkey"
		}).onUpdate("cascade").onDelete("set null"),
	foreignKey({
			columns: [table.serviceId],
			foreignColumns: [service.id],
			name: "work_order_item_serviceId_fkey"
		}).onUpdate("cascade").onDelete("set null"),
	foreignKey({
			columns: [table.workOrderId],
			foreignColumns: [workOrder.id],
			name: "work_order_item_workOrderId_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
]);

export const workOrderAuditLog = pgTable("work_order_audit_log", {
	id: text().primaryKey().default(sql`gen_random_uuid()`).notNull(),
	workOrderId: text().notNull(),
	fieldName: text().notNull(),
	oldValue: text(),
	newValue: text(),
	changedBy: text().notNull(),
	changedAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	ipAddress: text(),
	userAgent: text(),
}, (table) => [
	index("work_order_audit_log_changedAt_idx").using("btree", table.changedAt.asc().nullsLast().op("timestamp_ops")),
	index("work_order_audit_log_changedBy_idx").using("btree", table.changedBy.asc().nullsLast().op("text_ops")),
	index("work_order_audit_log_fieldName_idx").using("btree", table.fieldName.asc().nullsLast().op("text_ops")),
	index("work_order_audit_log_workOrderId_idx").using("btree", table.workOrderId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.workOrderId],
			foreignColumns: [workOrder.id],
			name: "work_order_audit_log_workOrderId_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
]);

export const creditNote = pgTable("credit_note", {
	id: text().primaryKey().default(sql`gen_random_uuid()`).notNull(),
	invoiceId: text(),
	originalSaleId: text().notNull(),
	originalSaleType: text().notNull(),
	customerId: text().notNull(),
	total: numeric({ precision: 10, scale:  2 }).notNull(),
	refundMethod: text().notNull(),
	cashAmount: numeric({ precision: 10, scale:  2 }),
	accountCreditAmount: numeric({ precision: 10, scale:  2 }),
	status: text().default('DRAFT').notNull(),
	notes: text(),
	createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	createdBy: text().notNull(),
	paymentMethodId: text(),
}, (table) => [
	index("credit_note_customerId_idx").using("btree", table.customerId.asc().nullsLast().op("text_ops")),
	index("credit_note_invoiceId_idx").using("btree", table.invoiceId.asc().nullsLast().op("text_ops")),
	uniqueIndex("credit_note_invoiceId_key").using("btree", table.invoiceId.asc().nullsLast().op("text_ops")),
	index("credit_note_originalSaleId_originalSaleType_idx").using("btree", table.originalSaleId.asc().nullsLast().op("text_ops"), table.originalSaleType.asc().nullsLast().op("text_ops")),
	index("credit_note_status_idx").using("btree", table.status.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.customerId],
			foreignColumns: [customer.id],
			name: "credit_note_customerId_fkey"
		}).onUpdate("cascade").onDelete("restrict"),
	foreignKey({
			columns: [table.invoiceId],
			foreignColumns: [invoice.id],
			name: "credit_note_invoiceId_fkey"
		}).onUpdate("cascade").onDelete("set null"),
]);

export const workOrder = pgTable("work_order", {
	id: text().primaryKey().default(sql`gen_random_uuid()`).notNull(),
	status: text().notNull(),
	customerId: text().notNull(),
	vehicleId: text().notNull(),
	technicianId: text(),
	entryChecklist: jsonb(),
	exitChecklist: jsonb(),
	entryPhotos: text().array(),
	exitPhotos: text().array(),
	scheduledDate: timestamp({ precision: 3, mode: 'string' }),
	startedAt: timestamp({ precision: 3, mode: 'string' }),
	completedAt: timestamp({ precision: 3, mode: 'string' }),
	deliveredAt: timestamp({ precision: 3, mode: 'string' }),
	paymentMethod: text(),
	paymentNotes: text(),
	total: numeric({ precision: 10, scale:  2 }).notNull(),
	totalProducts: numeric({ precision: 10, scale:  2 }).notNull(),
	totalServices: numeric({ precision: 10, scale:  2 }).notNull(),
	invoiceId: text(),
	notes: text().notNull(),
	createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ precision: 3, mode: 'string' }).defaultNow().notNull(),
	source: text().default('IN_PERSON').notNull(),
	fuelLevel: integer(),
	odometerValue: integer(),
}, (table) => [
	index("work_order_createdAt_idx").using("btree", table.createdAt.asc().nullsLast().op("timestamp_ops")),
	index("work_order_customerId_idx").using("btree", table.customerId.asc().nullsLast().op("text_ops")),
	index("work_order_scheduledDate_idx").using("btree", table.scheduledDate.asc().nullsLast().op("timestamp_ops")),
	index("work_order_status_idx").using("btree", table.status.asc().nullsLast().op("text_ops")),
	index("work_order_technicianId_idx").using("btree", table.technicianId.asc().nullsLast().op("text_ops")),
	index("work_order_vehicleId_idx").using("btree", table.vehicleId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.customerId],
			foreignColumns: [customer.id],
			name: "work_order_customerId_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
	foreignKey({
			columns: [table.vehicleId],
			foreignColumns: [vehicle.id],
			name: "work_order_vehicleId_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
]);

export const priceListItem = pgTable("price_list_item", {
	id: text().primaryKey().default(sql`gen_random_uuid()`).notNull(),
	priceListId: text().notNull(),
	productId: text(),
	overrideMarginPercentage: numeric({ precision: 5, scale:  2 }),
	fixedPrice: numeric({ precision: 10, scale:  2 }),
	createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ precision: 3, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("price_list_item_priceListId_idx").using("btree", table.priceListId.asc().nullsLast().op("text_ops")),
	uniqueIndex("price_list_item_priceListId_productId_key").using("btree", table.priceListId.asc().nullsLast().op("text_ops"), table.productId.asc().nullsLast().op("text_ops")),
	index("price_list_item_productId_idx").using("btree", table.productId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.priceListId],
			foreignColumns: [priceList.id],
			name: "price_list_item_priceListId_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
	foreignKey({
			columns: [table.productId],
			foreignColumns: [product.id],
			name: "price_list_item_productId_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
]);

export const balanceAudit = pgTable("balance_audit", {
	id: text().primaryKey().default(sql`gen_random_uuid()`).notNull(),
	customerId: text().notNull(),
	oldBalance: numeric({ precision: 10, scale:  2 }).notNull(),
	newBalance: numeric({ precision: 10, scale:  2 }).notNull(),
	driftAmount: numeric({ precision: 10, scale:  2 }).default('0').notNull(),
	source: text().notNull(),
	createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
	index("balance_audit_createdAt_idx").using("btree", table.createdAt.asc().nullsLast().op("timestamp_ops")),
	index("balance_audit_customerId_idx").using("btree", table.customerId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.customerId],
			foreignColumns: [customer.id],
			name: "balance_audit_customerId_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
]);
