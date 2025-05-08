import { 
  users, type User, type InsertUser,
  projects, type Project, type InsertProject,
  projectPhases, type ProjectPhase, type InsertProjectPhase,
  tasks, type Task, type InsertTask,
  taskComments, type TaskComment, type InsertTaskComment,
  messages, type Message, type InsertMessage,
  activities, type Activity, type InsertActivity,
  projectFiles, type ProjectFile, type InsertProjectFile,
  financeDocuments, type FinanceDocument, type InsertFinanceDocument,
  supportTickets, type SupportTicket, type InsertSupportTicket
} from "@shared/schema";
import { db } from "./db";
import { eq, and, or, inArray, desc, asc } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser & { avatarInitials?: string }): Promise<User>;
  getAllUsers(): Promise<User[]>;
  getUsersByRole(role: string): Promise<User[]>;
  updateUser(id: number, userData: Partial<User>): Promise<User>;
  deleteUser(id: number): Promise<void>;
  
  // Project operations
  getAllProjects(): Promise<Project[]>;
  getProject(id: number): Promise<Project | undefined>;
  getProjectsByClientId(clientId: number): Promise<Project[]>;
  getProjectsByManagerId(managerId: number): Promise<Project[]>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: number, project: Partial<Project>): Promise<Project>;
  
  // Project Phase operations
  getProjectPhases(projectId: number): Promise<ProjectPhase[]>;
  createProjectPhase(phase: InsertProjectPhase): Promise<ProjectPhase>;
  updateProjectPhase(id: number, phase: Partial<ProjectPhase>): Promise<ProjectPhase>;
  
  // Task operations
  getAllTasks(): Promise<Task[]>;
  getTask(id: number): Promise<Task | undefined>;
  getTasksByProjectId(projectId: number): Promise<Task[]>;
  getTasksByProjectIds(projectIds: number[]): Promise<Task[]>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: number, task: Partial<Task>): Promise<Task>;
  
  // Task Comment operations
  getTaskComments(taskId: number): Promise<TaskComment[]>;
  createTaskComment(comment: InsertTaskComment): Promise<TaskComment>;
  
  // Message operations
  getMessagesByUser(userId: number, projectId?: number): Promise<Message[]>;
  getMessagesBetweenUsers(userId1: number, userId2: number, projectId?: number): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  markMessageAsRead(id: number): Promise<Message>;
  
  // Activity operations
  getAllActivities(): Promise<Activity[]>;
  getActivitiesByProject(projectId: number): Promise<Activity[]>;
  getActivitiesByProjects(projectIds: number[]): Promise<Activity[]>;
  createActivity(activity: InsertActivity): Promise<Activity>;
  
  // Project File operations
  getProjectFiles(projectId: number): Promise<ProjectFile[]>;
  createProjectFile(file: InsertProjectFile): Promise<ProjectFile>;
  
  // Finance Document operations
  getAllFinanceDocuments(): Promise<FinanceDocument[]>;
  getFinanceDocumentsByClient(clientId: number): Promise<FinanceDocument[]>;
  getFinanceDocumentsByProjects(projectIds: number[]): Promise<FinanceDocument[]>;
  createFinanceDocument(document: InsertFinanceDocument): Promise<FinanceDocument>;
  
  // Support Ticket operations
  getAllSupportTickets(): Promise<SupportTicket[]>;
  getSupportTicketsByClient(clientId: number): Promise<SupportTicket[]>;
  createSupportTicket(ticket: InsertSupportTicket): Promise<SupportTicket>;
  updateSupportTicket(id: number, ticket: Partial<SupportTicket>): Promise<SupportTicket>;
  
  // Session store
  sessionStore: any;
}

export class DatabaseStorage implements IStorage {
  sessionStore: any;

  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool,
      createTableIfMissing: true
    });
    
    // Create demo data if it doesn't exist yet
    this.seedInitialData();
  }
  
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(
      eq(users.email, email.toLowerCase())
    );
    return user;
  }

  async createUser(userData: InsertUser & { avatarInitials?: string }): Promise<User> {
    const avatarInitials = userData.avatarInitials || 
      `${userData.firstName.charAt(0)}${userData.lastName.charAt(0)}`;
    
    // Hash password if needed
    let password = userData.password;
    if (!password.includes('.')) { // Simple check if the password is already hashed
      const salt = randomBytes(16).toString("hex");
      const buf = (await scryptAsync(password, salt, 64)) as Buffer;
      password = `${buf.toString("hex")}.${salt}`;
    }
    
    const [user] = await db.insert(users).values({
      email: userData.email.toLowerCase(),
      password,
      firstName: userData.firstName,
      lastName: userData.lastName,
      role: userData.role || 'client',
      avatarInitials,
      company: userData.company || null,
      phone: userData.phone || null
    }).returning();
    
    return user;
  }
  
  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }
  
  async getUsersByRole(role: string): Promise<User[]> {
    return await db.select().from(users).where(eq(users.role, role));
  }
  
  async updateUser(id: number, userData: Partial<User>): Promise<User> {
    const [user] = await db.update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    
    if (!user) {
      throw new Error(`User with ID ${id} not found`);
    }
    
    return user;
  }
  
  async deleteUser(id: number): Promise<void> {
    // Проверяем, существует ли пользователь
    const existingUser = await this.getUser(id);
    if (!existingUser) {
      throw new Error(`User with ID ${id} not found`);
    }
    
    // Удаляем пользователя
    await db.delete(users).where(eq(users.id, id));
  }

  // Project operations
  async getAllProjects(): Promise<Project[]> {
    console.log("getAllProjects: Fetching all projects from database");
    const result = await db.select().from(projects);
    console.log(`getAllProjects: Retrieved ${result.length} projects`);
    if (result.length > 0) {
      console.log("Project statuses found:", result.map(p => p.status).join(", "));
    }
    return result;
  }

  async getProject(id: number): Promise<Project | undefined> {
    console.log(`getProject: Fetching project with ID ${id}`);
    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    console.log(`getProject: Project found: ${project ? 'Yes' : 'No'}`);
    if (project) {
      console.log(`Project status: ${project.status}`);
    }
    return project;
  }

  async getProjectsByClientId(clientId: number): Promise<Project[]> {
    console.log(`getProjectsByClientId: Fetching projects for client ID ${clientId}`);
    const result = await db.select().from(projects).where(eq(projects.clientId, clientId));
    console.log(`getProjectsByClientId: Retrieved ${result.length} projects`);
    if (result.length > 0) {
      console.log("Project statuses found:", result.map(p => p.status).join(", "));
    }
    return result;
  }

  async getProjectsByManagerId(managerId: number): Promise<Project[]> {
    console.log(`getProjectsByManagerId: Fetching projects for manager ID ${managerId}`);
    const result = await db.select().from(projects).where(eq(projects.managerId, managerId));
    console.log(`getProjectsByManagerId: Retrieved ${result.length} projects`);
    if (result.length > 0) {
      console.log("Project statuses found:", result.map(p => p.status).join(", "));
    }
    return result;
  }

  async createProject(projectData: InsertProject): Promise<Project> {
    console.log("Creating project with status:", projectData.status || 'new');
    const [project] = await db.insert(projects).values({
      name: projectData.name,
      status: projectData.status || 'new',
      progress: projectData.progress || 0,
      description: projectData.description || null,
      domain: projectData.domain || null,
      startDate: projectData.startDate,
      endDate: projectData.endDate || null,
      currentPhase: projectData.currentPhase || null,
      clientId: projectData.clientId,
      managerId: projectData.managerId || null
    }).returning();
    
    console.log("Project created with status:", project.status);
    return project;
  }

  async updateProject(id: number, updateData: Partial<Project>): Promise<Project> {
    console.log(`updateProject: Updating project with ID ${id}`);
    console.log(`updateProject: Update data:`, JSON.stringify(updateData, null, 2));
    
    try {
      const [project] = await db.update(projects)
        .set(updateData)
        .where(eq(projects.id, id))
        .returning();
      
      if (!project) {
        console.error(`updateProject: Project with ID ${id} not found after update`);
        throw new Error(`Project with ID ${id} not found`);
      }
      
      console.log(`updateProject: Project updated successfully:`, JSON.stringify(project, null, 2));
      return project;
    } catch (error) {
      console.error(`updateProject: Error updating project:`, error);
      throw error;
    }
  }

  private async seedInitialData() {
    try {
      // Check if any users exist already
      const existingUsers = await db.select().from(users);
      if (existingUsers.length > 0) {
        console.log("Users already exist, skipping seed data creation");
        return;
      }
      
      console.log("Creating seed data...");
      
      // Create demo admin user with plaintext passwords
      // They will be hashed properly in the createUser method
      await this.createUser({
        email: "admin@webstudio.com",
        password: "admin123", // Will be hashed in createUser method
        firstName: "Admin",
        lastName: "User",
        role: "admin",
        avatarInitials: "AU"
      });
      
      // Create demo manager user
      await this.createUser({
        email: "manager@webstudio.com",
        password: "manager123", // Will be hashed in createUser method
        firstName: "Manager",
        lastName: "User",
        role: "manager",
        avatarInitials: "MU"
      });
      
      // Create demo client user
      await this.createUser({
        email: "client@example.com",
        password: "client123", // Will be hashed in createUser method
        firstName: "Client",
        lastName: "User",
        role: "client",
        avatarInitials: "CU"
      });
      
      console.log("Seed data created successfully");
    } catch (error) {
      console.error("Error seeding initial data:", error);
    }
  }





  // Project Phase operations
  async getProjectPhases(projectId: number): Promise<ProjectPhase[]> {
    return await db.select()
      .from(projectPhases)
      .where(eq(projectPhases.projectId, projectId))
      .orderBy(projectPhases.order);
  }

  async createProjectPhase(phaseData: InsertProjectPhase): Promise<ProjectPhase> {
    const [phase] = await db.insert(projectPhases)
      .values({
        name: phaseData.name,
        status: phaseData.status,
        projectId: phaseData.projectId,
        order: phaseData.order,
        startDate: phaseData.startDate || null,
        endDate: phaseData.endDate || null,
        description: phaseData.description || null
      })
      .returning();
    
    return phase;
  }

  async updateProjectPhase(id: number, updateData: Partial<ProjectPhase>): Promise<ProjectPhase> {
    const [phase] = await db.update(projectPhases)
      .set(updateData)
      .where(eq(projectPhases.id, id))
      .returning();
    
    if (!phase) {
      throw new Error(`Project phase with ID ${id} not found`);
    }
    
    return phase;
  }

  // Task operations
  async getAllTasks(): Promise<Task[]> {
    return await db.select().from(tasks);
  }

  async getTask(id: number): Promise<Task | undefined> {
    const [task] = await db.select().from(tasks).where(eq(tasks.id, id));
    return task;
  }

  async getTasksByProjectId(projectId: number): Promise<Task[]> {
    return await db.select()
      .from(tasks)
      .where(eq(tasks.projectId, projectId));
  }

  async getTasksByProjectIds(projectIds: number[]): Promise<Task[]> {
    return await db.select()
      .from(tasks)
      .where(inArray(tasks.projectId, projectIds));
  }

  async createTask(taskData: InsertTask): Promise<Task> {
    const [task] = await db.insert(tasks)
      .values({
        title: taskData.title,
        description: taskData.description || null,
        status: taskData.status || "pending",
        priority: taskData.priority || "medium",
        projectId: taskData.projectId,
        createdById: taskData.createdById,
        dueDate: taskData.dueDate || null,
        assignedToId: taskData.assignedToId || null,
        attachments: taskData.attachments || null,
        commentCount: 0,
        createdAt: taskData.createdAt || new Date()
      })
      .returning();
    
    return task;
  }

  async updateTask(id: number, updateData: Partial<Task>): Promise<Task> {
    const [task] = await db.update(tasks)
      .set(updateData)
      .where(eq(tasks.id, id))
      .returning();
    
    if (!task) {
      throw new Error(`Task with ID ${id} not found`);
    }
    
    return task;
  }

  // Task Comment operations
  async getTaskComments(taskId: number): Promise<TaskComment[]> {
    return await db.select()
      .from(taskComments)
      .where(eq(taskComments.taskId, taskId))
      .orderBy(asc(taskComments.createdAt));
  }

  async createTaskComment(commentData: InsertTaskComment): Promise<TaskComment> {
    const [comment] = await db.insert(taskComments)
      .values({
        content: commentData.content,
        taskId: commentData.taskId,
        userId: commentData.userId,
        createdAt: commentData.createdAt || new Date(),
        attachments: commentData.attachments || null
      })
      .returning();
    
    return comment;
  }

  // Message operations
  async getMessagesByUser(userId: number, projectId?: number): Promise<Message[]> {
    const query = db.select()
      .from(messages)
      .where(
        or(
          eq(messages.senderId, userId),
          eq(messages.receiverId, userId)
        )
      );
    
    if (projectId) {
      query.where(eq(messages.projectId, projectId));
    }
    
    return await query.orderBy(asc(messages.createdAt));
  }

  async getMessagesBetweenUsers(userId1: number, userId2: number, projectId?: number): Promise<Message[]> {
    const query = db.select()
      .from(messages)
      .where(
        or(
          and(
            eq(messages.senderId, userId1),
            eq(messages.receiverId, userId2)
          ),
          and(
            eq(messages.senderId, userId2),
            eq(messages.receiverId, userId1)
          )
        )
      );
    
    if (projectId) {
      query.where(eq(messages.projectId, projectId));
    }
    
    return await query.orderBy(asc(messages.createdAt));
  }

  async createMessage(messageData: InsertMessage): Promise<Message> {
    const [message] = await db.insert(messages)
      .values({
        content: messageData.content,
        senderId: messageData.senderId,
        receiverId: messageData.receiverId,
        projectId: messageData.projectId || null,
        createdAt: messageData.createdAt || new Date(),
        attachments: messageData.attachments || null,
        isRead: messageData.isRead || false
      })
      .returning();
    
    return message;
  }

  async markMessageAsRead(id: number): Promise<Message> {
    const [message] = await db.update(messages)
      .set({ isRead: true })
      .where(eq(messages.id, id))
      .returning();
    
    if (!message) {
      throw new Error(`Message with ID ${id} not found`);
    }
    
    return message;
  }

  // Activity operations
  async getAllActivities(): Promise<Activity[]> {
    return await db.select()
      .from(activities)
      .orderBy(desc(activities.createdAt));
  }

  async getActivitiesByProject(projectId: number): Promise<Activity[]> {
    return await db.select()
      .from(activities)
      .where(eq(activities.projectId, projectId))
      .orderBy(desc(activities.createdAt));
  }

  async getActivitiesByProjects(projectIds: number[]): Promise<Activity[]> {
    return await db.select()
      .from(activities)
      .where(inArray(activities.projectId, projectIds))
      .orderBy(desc(activities.createdAt));
  }

  async createActivity(activityData: InsertActivity): Promise<Activity> {
    const [activity] = await db.insert(activities)
      .values({
        description: activityData.description,
        userId: activityData.userId,
        actionType: activityData.actionType,
        resourceType: activityData.resourceType,
        resourceId: activityData.resourceId,
        projectId: activityData.projectId || null,
        createdAt: activityData.createdAt || new Date(),
        metadata: activityData.metadata || null
      })
      .returning();
    
    return activity;
  }

  // Project File operations
  async getProjectFiles(projectId: number): Promise<ProjectFile[]> {
    return await db.select()
      .from(projectFiles)
      .where(eq(projectFiles.projectId, projectId))
      .orderBy(desc(projectFiles.createdAt));
  }

  async createProjectFile(fileData: InsertProjectFile): Promise<ProjectFile> {
    const [file] = await db.insert(projectFiles)
      .values({
        name: fileData.name,
        path: fileData.path,
        type: fileData.type,
        size: fileData.size,
        projectId: fileData.projectId,
        uploadedById: fileData.uploadedById,
        createdAt: fileData.createdAt || new Date()
      })
      .returning();
    
    return file;
  }

  // Finance Document operations
  async getAllFinanceDocuments(): Promise<FinanceDocument[]> {
    return await db.select()
      .from(financeDocuments)
      .orderBy(desc(financeDocuments.createdAt));
  }

  async getFinanceDocumentsByClient(clientId: number): Promise<FinanceDocument[]> {
    return await db.select()
      .from(financeDocuments)
      .where(eq(financeDocuments.clientId, clientId))
      .orderBy(desc(financeDocuments.createdAt));
  }

  async getFinanceDocumentsByProjects(projectIds: number[]): Promise<FinanceDocument[]> {
    return await db.select()
      .from(financeDocuments)
      .where(inArray(financeDocuments.projectId, projectIds))
      .orderBy(desc(financeDocuments.createdAt));
  }

  async createFinanceDocument(documentData: InsertFinanceDocument): Promise<FinanceDocument> {
    const [document] = await db.insert(financeDocuments)
      .values({
        name: documentData.name,
        path: documentData.path,
        type: documentData.type,
        status: documentData.status,
        clientId: documentData.clientId,
        projectId: documentData.projectId || null,
        dueDate: documentData.dueDate || null,
        amount: documentData.amount || null,
        createdAt: documentData.createdAt || new Date()
      })
      .returning();
    
    return document;
  }

  // Support Ticket operations
  async getAllSupportTickets(): Promise<SupportTicket[]> {
    return await db.select()
      .from(supportTickets)
      .orderBy(desc(supportTickets.createdAt));
  }

  async getSupportTicketsByClient(clientId: number): Promise<SupportTicket[]> {
    return await db.select()
      .from(supportTickets)
      .where(eq(supportTickets.clientId, clientId))
      .orderBy(desc(supportTickets.createdAt));
  }

  async createSupportTicket(ticketData: InsertSupportTicket): Promise<SupportTicket> {
    const [ticket] = await db.insert(supportTickets)
      .values({
        clientId: ticketData.clientId,
        title: ticketData.title,
        description: ticketData.description,
        status: ticketData.status || 'open',
        priority: ticketData.priority || 'medium',
        projectId: ticketData.projectId || null,
        assignedToId: ticketData.assignedToId || null,
        createdAt: ticketData.createdAt || new Date(),
        updatedAt: ticketData.updatedAt || null,
        closedAt: ticketData.closedAt || null
      })
      .returning();
    
    return ticket;
  }

  async updateSupportTicket(id: number, updateData: Partial<SupportTicket>): Promise<SupportTicket> {
    const [ticket] = await db.update(supportTickets)
      .set(updateData)
      .where(eq(supportTickets.id, id))
      .returning();
    
    if (!ticket) {
      throw new Error(`Support ticket with ID ${id} not found`);
    }
    
    return ticket;
  }
}

export const storage = new DatabaseStorage();
