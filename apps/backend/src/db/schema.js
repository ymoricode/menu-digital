import {
  pgTable,
  serial,
  varchar,
  text,
  integer,
  timestamp,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ============================
// TABLE: users
// ============================
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }),
  email: varchar('email', { length: 100 }).unique(),
  password: varchar('password', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// ============================
// TABLE: categories
// ============================
export const categories = pgTable('categories', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 50 }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// ============================
// TABLE: foods
// ============================
export const foods = pgTable('foods', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }),
  description: text('description'),
  image: varchar('image', { length: 255 }),
  price: integer('price'),
  categoriesId: integer('categories_id').references(() => categories.id, {
    onDelete: 'cascade',
  }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// ============================
// TABLE: barcodes
// ============================
export const barcodes = pgTable('barcodes', {
  id: serial('id').primaryKey(),
  tableNumber: varchar('table_number', { length: 10 }),
  image: varchar('image', { length: 255 }),
  qrValue: varchar('qr_value', { length: 255 }),
  userId: integer('user_id').references(() => users.id, {
    onDelete: 'set null',
  }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// ============================
// TABLE: transactions
// ============================
export const transactions = pgTable('transactions', {
  id: serial('id').primaryKey(),
  code: varchar('code', { length: 50 }),
  name: varchar('name', { length: 100 }),
  phone: varchar('phone', { length: 20 }),
  externalId: varchar('external_id', { length: 100 }),
  checkoutLink: varchar('checkout_link', { length: 255 }),
  barcodeId: integer('barcode_id').references(() => barcodes.id, {
    onDelete: 'set null',
  }),
  paymentMethod: varchar('payment_method', { length: 50 }),
  paymentStatus: varchar('payment_status', { length: 20 }).default('pending'),
  total: integer('total'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// ============================
// TABLE: transaction_items
// ============================
export const transactionItems = pgTable('transaction_items', {
  id: serial('id').primaryKey(),
  transactionId: integer('transaction_id').references(() => transactions.id, {
    onDelete: 'cascade',
  }),
  foodsId: integer('foods_id').references(() => foods.id, {
    onDelete: 'cascade',
  }),
  quantity: integer('quantity'),
  price: integer('price'),
  subtotal: integer('subtotal'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// ============================
// RELATIONS
// ============================
export const usersRelations = relations(users, ({ many }) => ({
  barcodes: many(barcodes),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  foods: many(foods),
}));

export const foodsRelations = relations(foods, ({ one, many }) => ({
  category: one(categories, {
    fields: [foods.categoriesId],
    references: [categories.id],
  }),
  transactionItems: many(transactionItems),
}));

export const barcodesRelations = relations(barcodes, ({ one, many }) => ({
  user: one(users, {
    fields: [barcodes.userId],
    references: [users.id],
  }),
  transactions: many(transactions),
}));

export const transactionsRelations = relations(transactions, ({ one, many }) => ({
  barcode: one(barcodes, {
    fields: [transactions.barcodeId],
    references: [barcodes.id],
  }),
  items: many(transactionItems),
}));

export const transactionItemsRelations = relations(transactionItems, ({ one }) => ({
  transaction: one(transactions, {
    fields: [transactionItems.transactionId],
    references: [transactions.id],
  }),
  food: one(foods, {
    fields: [transactionItems.foodsId],
    references: [foods.id],
  }),
}));
