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
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser & { avatarInitials?: string }): Promise<User>;
  
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
  sessionStore: session.SessionStore;
}

export class MemStorage implements IStorage {
  private usersData: Map<number, User>;
  private projectsData: Map<number, Project>;
  private projectPhasesData: Map<number, ProjectPhase>;
  private tasksData: Map<number, Task>;
  private taskCommentsData: Map<number, TaskComment>;
  private messagesData: Map<number, Message>;
  private activitiesData: Map<number, Activity>;
  private projectFilesData: Map<number, ProjectFile>;
  private financeDocumentsData: Map<number, FinanceDocument>;
  private supportTicketsData: Map<number, SupportTicket>;
  
  sessionStore: session.SessionStore;
  
  private userCounter: number = 1;
  private projectCounter: number = 1;
  private phaseCounter: number = 1;
  private taskCounter: number = 1;
  private commentCounter: number = 1;
  private messageCounter: number = 1;
  private activityCounter: number = 1;
  private fileCounter: number = 1;
  private documentCounter: number = 1;
  private ticketCounter: number = 1;

  constructor() {
    this.usersData = new Map();
    this.projectsData = new Map();
    this.projectPhasesData = new Map();
    this.tasksData = new Map();
    this.taskCommentsData = new Map();
    this.messagesData = new Map();
    this.activitiesData = new Map();
    this.projectFilesData = new Map();
    this.financeDocumentsData = new Map();
    this.supportTicketsData = new Map();
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
    
    // Create demo users
    this.seedInitialData();
  }

  private seedInitialData() {
    // Create demo admin user
    this.createUser({
      email: "admin@webstudio.com",
      password: "$2b$10$NrGkMwZ2rR.dZrXIX/v1K.RCeLwPT6sTYrVJhJXw7olO4M0b3xINi", // password: admin123
      firstName: "Admin",
      lastName: "User",
      role: "admin",
      avatarInitials: "AU"
    });
    
    // Create demo manager user
    this.createUser({
      email: "manager@webstudio.com",
      password: "$2b$10$xEEtq0IhEQqPLN2JfJcfDuKnZLHYAplZbO5I46oU9ZmH7uh9Zqcfm", // password: manager123
      firstName: "Manager",
      lastName: "User",
      role: "manager",
      avatarInitials: "MU"
    });
    
    // Create demo client user
    this.createUser({
      email: "client@example.com",
      password: "$2b$10$ntFzGsb/lcjxmH9cxXY3vOmjaLWa9.hjOvf3jTvOOl6qA8lfsxhuu", // password: client123
      firstName: "Client",
      lastName: "User",
      role: "client",
      avatarInitials: "CU"
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.usersData.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.usersData.values()).find(
      (user) => user.email.toLowerCase() === email.toLowerCase()
    );
  }

  async createUser(userData: InsertUser & { avatarInitials?: string }): Promise<User> {
    const id = this.userCounter++;
    const avatarInitials = userData.avatarInitials || 
      `${userData.firstName.charAt(0)}${userData.lastName.charAt(0)}`;
    
    const user: User = { 
      ...userData, 
      id,
      avatarInitials 
    };
    
    this.usersData.set(id, user);
    return user;
  }

  // Project operations
  async getAllProjects(): Promise<Project[]> {
    return Array.from(this.projectsData.values());
  }

  async getProject(id: number): Promise<Project | undefined> {
    return this.projectsData.get(id);
  }

  async getProjectsByClientId(clientId: number): Promise<Project[]> {
    return Array.from(this.projectsData.values()).filter(
      (project) => project.clientId === clientId
    );
  }

  async getProjectsByManagerId(managerId: number): Promise<Project[]> {
    return Array.from(this.projectsData.values()).filter(
      (project) => project.managerId === managerId
    );
  }

  async createProject(projectData: InsertProject): Promise<Project> {
    const id = this.projectCounter++;
    const project: Project = { ...projectData, id };
    this.projectsData.set(id, project);
    return project;
  }

  async updateProject(id: number, updateData: Partial<Project>): Promise<Project> {
    const project = this.projectsData.get(id);
    if (!project) {
      throw new Error(`Project with ID ${id} not found`);
    }
    
    const updatedProject = { ...project, ...updateData };
    this.projectsData.set(id, updatedProject);
    return updatedProject;
  }

  // Project Phase operations
  async getProjectPhases(projectId: number): Promise<ProjectPhase[]> {
    return Array.from(this.projectPhasesData.values())
      .filter((phase) => phase.projectId === projectId)
      .sort((a, b) => a.order - b.order);
  }

  async createProjectPhase(phaseData: InsertProjectPhase): Promise<ProjectPhase> {
    const id = this.phaseCounter++;
    const phase: ProjectPhase = { ...phaseData, id };
    this.projectPhasesData.set(id, phase);
    return phase;
  }

  async updateProjectPhase(id: number, updateData: Partial<ProjectPhase>): Promise<ProjectPhase> {
    const phase = this.projectPhasesData.get(id);
    if (!phase) {
      throw new Error(`Project phase with ID ${id} not found`);
    }
    
    const updatedPhase = { ...phase, ...updateData };
    this.projectPhasesData.set(id, updatedPhase);
    return updatedPhase;
  }

  // Task operations
  async getAllTasks(): Promise<Task[]> {
    return Array.from(this.tasksData.values());
  }

  async getTask(id: number): Promise<Task | undefined> {
    return this.tasksData.get(id);
  }

  async getTasksByProjectId(projectId: number): Promise<Task[]> {
    return Array.from(this.tasksData.values()).filter(
      (task) => task.projectId === projectId
    );
  }

  async getTasksByProjectIds(projectIds: number[]): Promise<Task[]> {
    return Array.from(this.tasksData.values()).filter(
      (task) => projectIds.includes(task.projectId)
    );
  }

  async createTask(taskData: InsertTask): Promise<Task> {
    const id = this.taskCounter++;
    const task: Task = { ...taskData, id };
    this.tasksData.set(id, task);
    return task;
  }

  async updateTask(id: number, updateData: Partial<Task>): Promise<Task> {
    const task = this.tasksData.get(id);
    if (!task) {
      throw new Error(`Task with ID ${id} not found`);
    }
    
    const updatedTask = { ...task, ...updateData };
    this.tasksData.set(id, updatedTask);
    return updatedTask;
  }

  // Task Comment operations
  async getTaskComments(taskId: number): Promise<TaskComment[]> {
    return Array.from(this.taskCommentsData.values())
      .filter((comment) => comment.taskId === taskId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  async createTaskComment(commentData: InsertTaskComment): Promise<TaskComment> {
    const id = this.commentCounter++;
    const comment: TaskComment = { ...commentData, id };
    this.taskCommentsData.set(id, comment);
    return comment;
  }

  // Message operations
  async getMessagesByUser(userId: number, projectId?: number): Promise<Message[]> {
    return Array.from(this.messagesData.values())
      .filter((message) => 
        (message.senderId === userId || message.receiverId === userId) &&
        (projectId ? message.projectId === projectId : true)
      )
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  async getMessagesBetweenUsers(userId1: number, userId2: number, projectId?: number): Promise<Message[]> {
    return Array.from(this.messagesData.values())
      .filter((message) => 
        ((message.senderId === userId1 && message.receiverId === userId2) ||
        (message.senderId === userId2 && message.receiverId === userId1)) &&
        (projectId ? message.projectId === projectId : true)
      )
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  async createMessage(messageData: InsertMessage): Promise<Message> {
    const id = this.messageCounter++;
    const message: Message = { ...messageData, id };
    this.messagesData.set(id, message);
    return message;
  }

  async markMessageAsRead(id: number): Promise<Message> {
    const message = this.messagesData.get(id);
    if (!message) {
      throw new Error(`Message with ID ${id} not found`);
    }
    
    const updatedMessage = { ...message, isRead: true };
    this.messagesData.set(id, updatedMessage);
    return updatedMessage;
  }

  // Activity operations
  async getAllActivities(): Promise<Activity[]> {
    return Array.from(this.activitiesData.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getActivitiesByProject(projectId: number): Promise<Activity[]> {
    return Array.from(this.activitiesData.values())
      .filter((activity) => activity.projectId === projectId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getActivitiesByProjects(projectIds: number[]): Promise<Activity[]> {
    return Array.from(this.activitiesData.values())
      .filter((activity) => activity.projectId && projectIds.includes(activity.projectId))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async createActivity(activityData: InsertActivity): Promise<Activity> {
    const id = this.activityCounter++;
    const activity: Activity = { ...activityData, id };
    this.activitiesData.set(id, activity);
    return activity;
  }

  // Project File operations
  async getProjectFiles(projectId: number): Promise<ProjectFile[]> {
    return Array.from(this.projectFilesData.values())
      .filter((file) => file.projectId === projectId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async createProjectFile(fileData: InsertProjectFile): Promise<ProjectFile> {
    const id = this.fileCounter++;
    const file: ProjectFile = { ...fileData, id };
    this.projectFilesData.set(id, file);
    return file;
  }

  // Finance Document operations
  async getAllFinanceDocuments(): Promise<FinanceDocument[]> {
    return Array.from(this.financeDocumentsData.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getFinanceDocumentsByClient(clientId: number): Promise<FinanceDocument[]> {
    return Array.from(this.financeDocumentsData.values())
      .filter((doc) => doc.clientId === clientId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getFinanceDocumentsByProjects(projectIds: number[]): Promise<FinanceDocument[]> {
    return Array.from(this.financeDocumentsData.values())
      .filter((doc) => doc.projectId && projectIds.includes(doc.projectId))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async createFinanceDocument(documentData: InsertFinanceDocument): Promise<FinanceDocument> {
    const id = this.documentCounter++;
    const document: FinanceDocument = { ...documentData, id };
    this.financeDocumentsData.set(id, document);
    return document;
  }

  // Support Ticket operations
  async getAllSupportTickets(): Promise<SupportTicket[]> {
    return Array.from(this.supportTicketsData.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getSupportTicketsByClient(clientId: number): Promise<SupportTicket[]> {
    return Array.from(this.supportTicketsData.values())
      .filter((ticket) => ticket.clientId === clientId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async createSupportTicket(ticketData: InsertSupportTicket): Promise<SupportTicket> {
    const id = this.ticketCounter++;
    const ticket: SupportTicket = { ...ticketData, id };
    this.supportTicketsData.set(id, ticket);
    return ticket;
  }

  async updateSupportTicket(id: number, updateData: Partial<SupportTicket>): Promise<SupportTicket> {
    const ticket = this.supportTicketsData.get(id);
    if (!ticket) {
      throw new Error(`Support ticket with ID ${id} not found`);
    }
    
    const updatedTicket = { ...ticket, ...updateData };
    this.supportTicketsData.set(id, updatedTicket);
    return updatedTicket;
  }
}

export const storage = new MemStorage();
