import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User model
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  role: text("role").notNull().default("client"), // client, manager, admin
  avatarInitials: text("avatar_initials"),
  company: text("company"),
  position: text("position"),
  phone: text("phone"),
  bio: text("bio"),
  createdAt: timestamp("created_at").defaultNow(),
  avatarUrl: text("avatar_url"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  password: true,
  firstName: true,
  lastName: true,
  role: true,
  company: true,
  position: true,
  phone: true,
  bio: true,
});

// Project model
export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  domain: text("domain"),
  status: text("status").notNull().default("in_progress"), // in_progress, paused, completed, archived
  progress: integer("progress").notNull().default(0),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date"),
  currentPhase: text("current_phase"),
  clientId: integer("client_id").notNull(),
  managerId: integer("manager_id"),
  description: text("description"),
});

export const insertProjectSchema = createInsertSchema(projects).pick({
  name: true,
  domain: true,
  status: true,
  progress: true,
  startDate: true,
  endDate: true,
  currentPhase: true,
  clientId: true,
  managerId: true,
  description: true,
});

// Project Phases
export const projectPhases = pgTable("project_phases", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  status: text("status").notNull(), // pending, in_progress, completed
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  order: integer("order").notNull(),
});

export const insertProjectPhaseSchema = createInsertSchema(projectPhases).pick({
  projectId: true,
  name: true,
  description: true,
  status: true,
  startDate: true,
  endDate: true,
  order: true,
});

// Tasks
export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status").notNull().default("new"), // new, in_progress, review, completed, delayed
  priority: text("priority").notNull().default("medium"), // low, medium, high
  projectId: integer("project_id").notNull(),
  assignedToId: integer("assigned_to_id"),
  createdById: integer("created_by_id").notNull(),
  dueDate: timestamp("due_date"),
  createdAt: timestamp("created_at").notNull(),
  attachments: json("attachments").$type<string[]>().default([]),
  commentCount: integer("comment_count").notNull().default(0),
});

export const insertTaskSchema = createInsertSchema(tasks).pick({
  title: true,
  description: true,
  status: true,
  priority: true,
  projectId: true,
  assignedToId: true, 
  createdById: true,
  dueDate: true,
  createdAt: true,
  attachments: true,
});

// Task comments
export const taskComments = pgTable("task_comments", {
  id: serial("id").primaryKey(),
  taskId: integer("task_id").notNull(),
  userId: integer("user_id").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").notNull(),
  attachments: json("attachments").$type<string[]>().default([]),
});

export const insertTaskCommentSchema = createInsertSchema(taskComments).pick({
  taskId: true,
  userId: true,
  content: true,
  createdAt: true,
  attachments: true,
});

// Messages
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  senderId: integer("sender_id").notNull(),
  receiverId: integer("receiver_id").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").notNull(),
  isRead: boolean("is_read").notNull().default(false),
  projectId: integer("project_id"),
  attachments: json("attachments").$type<string[]>().default([]),
});

export const insertMessageSchema = createInsertSchema(messages).pick({
  senderId: true,
  receiverId: true,
  content: true,
  createdAt: true,
  isRead: true,
  projectId: true,
  attachments: true,
});

// Activities
export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  actionType: text("action_type").notNull(), // task_created, task_updated, project_updated, message_sent, etc.
  resourceType: text("resource_type").notNull(), // task, project, message
  resourceId: integer("resource_id").notNull(),
  projectId: integer("project_id"),
  description: text("description").notNull(),
  createdAt: timestamp("created_at").notNull(),
  metadata: json("metadata").default({}),
});

export const insertActivitySchema = createInsertSchema(activities).pick({
  userId: true,
  actionType: true, 
  resourceType: true,
  resourceId: true,
  projectId: true,
  description: true,
  createdAt: true,
  metadata: true,
});

// Project Files
export const projectFiles = pgTable("project_files", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull(),
  name: text("name").notNull(),
  type: text("type").notNull(), // brief, design, mockup, etc.
  path: text("path").notNull(),
  uploadedById: integer("uploaded_by_id").notNull(),
  createdAt: timestamp("created_at").notNull(),
  size: integer("size").notNull(),
});

export const insertProjectFileSchema = createInsertSchema(projectFiles).pick({
  projectId: true,
  name: true,
  type: true,
  path: true,
  uploadedById: true,
  createdAt: true,
  size: true,
});

// Finance Documents
export const financeDocuments = pgTable("finance_documents", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull(),
  projectId: integer("project_id"),
  type: text("type").notNull(), // invoice, receipt, contract
  name: text("name").notNull(),
  path: text("path").notNull(),
  amount: integer("amount"),
  status: text("status").notNull(), // pending, paid, overdue
  dueDate: timestamp("due_date"),
  createdAt: timestamp("created_at").notNull(),
});

export const insertFinanceDocumentSchema = createInsertSchema(financeDocuments).pick({
  clientId: true,
  projectId: true,
  type: true,
  name: true,
  path: true,
  amount: true,
  status: true,
  dueDate: true,
  createdAt: true,
});

// Support Tickets
export const supportTickets = pgTable("support_tickets", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull(),
  projectId: integer("project_id"),
  title: text("title").notNull(),
  description: text("description").notNull(),
  status: text("status").notNull().default("open"), // open, in_progress, closed
  priority: text("priority").notNull().default("medium"), // low, medium, high
  assignedToId: integer("assigned_to_id"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at"),
  closedAt: timestamp("closed_at"),
});

export const insertSupportTicketSchema = createInsertSchema(supportTickets).pick({
  clientId: true,
  projectId: true,
  title: true,
  description: true,
  status: true,
  priority: true,
  assignedToId: true,
  createdAt: true,
  updatedAt: true,
  closedAt: true,
});

// Export types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = typeof projects.$inferSelect;

export type InsertProjectPhase = z.infer<typeof insertProjectPhaseSchema>;
export type ProjectPhase = typeof projectPhases.$inferSelect;

export type InsertTask = z.infer<typeof insertTaskSchema>;
export type Task = typeof tasks.$inferSelect;

export type InsertTaskComment = z.infer<typeof insertTaskCommentSchema>;
export type TaskComment = typeof taskComments.$inferSelect;

export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;

export type InsertActivity = z.infer<typeof insertActivitySchema>;
export type Activity = typeof activities.$inferSelect;

export type InsertProjectFile = z.infer<typeof insertProjectFileSchema>;
export type ProjectFile = typeof projectFiles.$inferSelect;

export type InsertFinanceDocument = z.infer<typeof insertFinanceDocumentSchema>;
export type FinanceDocument = typeof financeDocuments.$inferSelect;

export type InsertSupportTicket = z.infer<typeof insertSupportTicketSchema>;
export type SupportTicket = typeof supportTickets.$inferSelect;
