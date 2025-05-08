import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, hashPassword, comparePasswords } from "./auth";
import { db } from "./db";
import { eq, ne, sql } from "drizzle-orm";
import multer from "multer";
import path from "path";
import fs from "fs";
import {
  insertProjectSchema,
  insertTaskSchema,
  insertTaskCommentSchema,
  insertMessageSchema,
  insertActivitySchema,
  insertProjectFileSchema,
  insertFinanceDocumentSchema,
  insertSupportTicketSchema,
  users,
} from "@shared/schema";
import { z } from "zod";

// Helper to ensure user is authenticated
function ensureAuthenticated(req: any, res: any, next: any) {
  console.log("Checking auth for route:", req.path, "authenticated:", req.isAuthenticated(), "Session ID:", req.sessionID);
  console.log("Cookie header:", req.headers.cookie);
  
  if (req.isAuthenticated()) {
    console.log("User authenticated:", req.user?.email);
    return next();
  }
  console.log("Access denied: Not authenticated");
  res.status(401).json({ message: "Unauthorized" });
}

// Helper to check if user has required role
function hasRole(roles: string[]) {
  return (req: any, res: any, next: any) => {
    if (req.isAuthenticated() && roles.includes(req.user.role)) {
      return next();
    }
    res.status(403).json({ message: "Forbidden" });
  };
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes
  setupAuth(app);

  // Projects routes
  app.get("/api/projects", ensureAuthenticated, async (req, res) => {
    try {
      const userRole = req.user.role;
      let projects;
      
      if (userRole === "client") {
        projects = await storage.getProjectsByClientId(req.user.id);
      } else {
        // Managers and admins can see projects they manage or all projects
        projects = userRole === "admin" 
          ? await storage.getAllProjects()
          : await storage.getProjectsByManagerId(req.user.id);
      }
      
      res.json(projects);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch projects" });
    }
  });

  app.get("/api/projects/:id", ensureAuthenticated, async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const project = await storage.getProject(projectId);
      
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      // Check if user has access to this project
      const userRole = req.user.role;
      const userId = req.user.id;
      
      if (userRole === "client" && project.clientId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      if (userRole === "manager" && project.managerId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      res.json(project);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch project" });
    }
  });

  app.post("/api/projects", ensureAuthenticated, async (req, res) => {
    try {
      console.log('Creating project with data:', JSON.stringify(req.body, null, 2));
      
      // Преобразование строковых дат в объекты Date перед валидацией
      const formattedBody = {
        ...req.body,
        startDate: req.body.startDate ? new Date(req.body.startDate) : undefined,
        endDate: req.body.endDate ? new Date(req.body.endDate) : undefined,
        clientId: typeof req.body.clientId === 'string' ? parseInt(req.body.clientId) : req.body.clientId,
        managerId: req.body.managerId ? (typeof req.body.managerId === 'string' ? parseInt(req.body.managerId) : req.body.managerId) : undefined
      };
      
      console.log('Formatted project data:', JSON.stringify(formattedBody, null, 2));
      
      const projectData = insertProjectSchema.parse(formattedBody);
      console.log('Validated project data:', JSON.stringify(projectData, null, 2));
      
      const project = await storage.createProject(projectData);
      console.log('Created project:', JSON.stringify(project, null, 2));
      
      // Create activity for project creation
      await storage.createActivity({
        userId: req.user.id,
        actionType: "project_created",
        resourceType: "project",
        resourceId: project.id,
        projectId: project.id,
        description: `Project "${project.name}" was created`,
        createdAt: new Date(),
        metadata: {},
      });
      
      res.status(201).json(project);
    } catch (error) {
      console.error('Error creating project:', error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid project data", errors: error.errors });
      }
      
      res.status(500).json({ 
        message: "Failed to create project", 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  });

  app.patch("/api/projects/:id", hasRole(["admin", "manager"]), async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const project = await storage.getProject(projectId);
      
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      // Managers can only update projects they manage
      if (req.user.role === "manager" && project.managerId !== req.user.id) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      // Преобразование строковых дат в объекты Date
      const formattedBody = {
        ...req.body,
        startDate: req.body.startDate ? new Date(req.body.startDate) : undefined,
        endDate: req.body.endDate ? new Date(req.body.endDate) : undefined
      };
      
      const updatedProject = await storage.updateProject(projectId, formattedBody);
      
      // Create activity for project update
      await storage.createActivity({
        userId: req.user.id,
        actionType: "project_updated",
        resourceType: "project",
        resourceId: projectId,
        projectId: projectId,
        description: `Project "${project.name}" was updated`,
        createdAt: new Date(),
        metadata: req.body,
      });
      
      res.json(updatedProject);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid project data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update project" });
    }
  });

  // Task routes
  app.get("/api/tasks", ensureAuthenticated, async (req, res) => {
    try {
      const userRole = req.user.role;
      const userId = req.user.id;
      let tasks;
      
      // Filter by project if specified
      const projectId = req.query.projectId ? parseInt(req.query.projectId as string) : undefined;
      
      if (projectId) {
        const project = await storage.getProject(projectId);
        if (!project) {
          return res.status(404).json({ message: "Project not found" });
        }
        
        // Check if user has access to this project
        if (userRole === "client" && project.clientId !== userId) {
          return res.status(403).json({ message: "Access denied" });
        }
        
        if (userRole === "manager" && project.managerId !== userId) {
          return res.status(403).json({ message: "Access denied" });
        }
        
        tasks = await storage.getTasksByProjectId(projectId);
      } else {
        // Get all tasks accessible to the user
        if (userRole === "admin") {
          tasks = await storage.getAllTasks();
        } else if (userRole === "manager") {
          // Get tasks for projects managed by this manager
          const managedProjects = await storage.getProjectsByManagerId(userId);
          const projectIds = managedProjects.map(p => p.id);
          tasks = await storage.getTasksByProjectIds(projectIds);
        } else {
          // Client: get tasks for their projects
          const clientProjects = await storage.getProjectsByClientId(userId);
          const projectIds = clientProjects.map(p => p.id);
          tasks = await storage.getTasksByProjectIds(projectIds);
        }
      }
      
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch tasks" });
    }
  });

  app.get("/api/tasks/:id", ensureAuthenticated, async (req, res) => {
    try {
      const taskId = parseInt(req.params.id);
      const task = await storage.getTask(taskId);
      
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      // Check if user has access to the project this task belongs to
      const project = await storage.getProject(task.projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      const userRole = req.user.role;
      const userId = req.user.id;
      
      if (userRole === "client" && project.clientId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      if (userRole === "manager" && project.managerId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      res.json(task);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch task" });
    }
  });

  app.post("/api/tasks", ensureAuthenticated, async (req, res) => {
    try {
      const taskData = insertTaskSchema.parse({
        ...req.body,
        createdById: req.user.id,
        createdAt: new Date(),
      });
      
      // Check if user has access to the project
      const project = await storage.getProject(taskData.projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      const userRole = req.user.role;
      const userId = req.user.id;
      
      if (userRole === "client" && project.clientId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      if (userRole === "manager" && project.managerId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const task = await storage.createTask(taskData);
      
      // Create activity for task creation
      await storage.createActivity({
        userId: req.user.id,
        actionType: "task_created",
        resourceType: "task",
        resourceId: task.id,
        projectId: task.projectId,
        description: `Task "${task.title}" was created`,
        createdAt: new Date(),
        metadata: {},
      });
      
      res.status(201).json(task);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid task data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create task" });
    }
  });

  app.patch("/api/tasks/:id", ensureAuthenticated, async (req, res) => {
    try {
      const taskId = parseInt(req.params.id);
      const task = await storage.getTask(taskId);
      
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      // Check if user has access to the project this task belongs to
      const project = await storage.getProject(task.projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      const userRole = req.user.role;
      const userId = req.user.id;
      
      if (userRole === "client" && project.clientId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      if (userRole === "manager" && project.managerId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const updatedTask = await storage.updateTask(taskId, req.body);
      
      // Create activity for task update
      await storage.createActivity({
        userId: req.user.id,
        actionType: "task_updated",
        resourceType: "task",
        resourceId: taskId,
        projectId: task.projectId,
        description: `Task "${task.title}" was updated`,
        createdAt: new Date(),
        metadata: req.body,
      });
      
      res.json(updatedTask);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid task data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update task" });
    }
  });

  // Task Comments routes
  app.get("/api/tasks/:taskId/comments", ensureAuthenticated, async (req, res) => {
    try {
      const taskId = parseInt(req.params.taskId);
      const task = await storage.getTask(taskId);
      
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      // Check if user has access to the project this task belongs to
      const project = await storage.getProject(task.projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      const userRole = req.user.role;
      const userId = req.user.id;
      
      if (userRole === "client" && project.clientId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      if (userRole === "manager" && project.managerId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const comments = await storage.getTaskComments(taskId);
      res.json(comments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch task comments" });
    }
  });

  app.post("/api/tasks/:taskId/comments", ensureAuthenticated, async (req, res) => {
    try {
      const taskId = parseInt(req.params.taskId);
      const task = await storage.getTask(taskId);
      
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      // Check if user has access to the project this task belongs to
      const project = await storage.getProject(task.projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      const userRole = req.user.role;
      const userId = req.user.id;
      
      if (userRole === "client" && project.clientId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      if (userRole === "manager" && project.managerId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const commentData = insertTaskCommentSchema.parse({
        ...req.body,
        taskId,
        userId: req.user.id,
        createdAt: new Date(),
      });
      
      const comment = await storage.createTaskComment(commentData);
      
      // Update comment count on task
      await storage.updateTask(taskId, {
        commentCount: task.commentCount + 1,
      });
      
      // Create activity for comment creation
      await storage.createActivity({
        userId: req.user.id,
        actionType: "comment_added",
        resourceType: "task",
        resourceId: taskId,
        projectId: task.projectId,
        description: `Comment added to task "${task.title}"`,
        createdAt: new Date(),
        metadata: {},
      });
      
      res.status(201).json(comment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid comment data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create comment" });
    }
  });

  // Messages routes
  app.get("/api/messages", ensureAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      
      // Filter by conversation partner if specified
      const partnerId = req.query.partnerId ? parseInt(req.query.partnerId as string) : undefined;
      const projectId = req.query.projectId ? parseInt(req.query.projectId as string) : undefined;
      
      let messages;
      
      if (partnerId) {
        messages = await storage.getMessagesBetweenUsers(userId, partnerId, projectId);
      } else {
        messages = await storage.getMessagesByUser(userId, projectId);
      }
      
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  app.post("/api/messages", ensureAuthenticated, async (req, res) => {
    try {
      const messageData = insertMessageSchema.parse({
        ...req.body,
        senderId: req.user.id,
        createdAt: new Date(),
        isRead: false,
      });
      
      // If message is associated with a project, verify access
      if (messageData.projectId) {
        const project = await storage.getProject(messageData.projectId);
        if (!project) {
          return res.status(404).json({ message: "Project not found" });
        }
        
        const userRole = req.user.role;
        const userId = req.user.id;
        
        if (userRole === "client" && project.clientId !== userId) {
          return res.status(403).json({ message: "Access denied" });
        }
        
        if (userRole === "manager" && project.managerId !== userId) {
          return res.status(403).json({ message: "Access denied" });
        }
      }
      
      const message = await storage.createMessage(messageData);
      
      // Create activity for message creation if associated with project
      if (messageData.projectId) {
        await storage.createActivity({
          userId: req.user.id,
          actionType: "message_sent",
          resourceType: "message",
          resourceId: message.id,
          projectId: messageData.projectId,
          description: `Message sent`,
          createdAt: new Date(),
          metadata: {},
        });
      }
      
      res.status(201).json(message);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid message data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  // Activities routes
  app.get("/api/activities", ensureAuthenticated, async (req, res) => {
    try {
      const userRole = req.user.role;
      const userId = req.user.id;
      
      // Filter by project if specified
      const projectId = req.query.projectId ? parseInt(req.query.projectId as string) : undefined;
      
      let activities;
      
      if (projectId) {
        // Check if user has access to this project
        const project = await storage.getProject(projectId);
        if (!project) {
          return res.status(404).json({ message: "Project not found" });
        }
        
        if (userRole === "client" && project.clientId !== userId) {
          return res.status(403).json({ message: "Access denied" });
        }
        
        if (userRole === "manager" && project.managerId !== userId) {
          return res.status(403).json({ message: "Access denied" });
        }
        
        activities = await storage.getActivitiesByProject(projectId);
      } else {
        // Get all activities accessible to the user
        if (userRole === "admin") {
          activities = await storage.getAllActivities();
        } else if (userRole === "manager") {
          // Get activities for projects managed by this manager
          const managedProjects = await storage.getProjectsByManagerId(userId);
          const projectIds = managedProjects.map(p => p.id);
          activities = await storage.getActivitiesByProjects(projectIds);
        } else {
          // Client: get activities for their projects
          const clientProjects = await storage.getProjectsByClientId(userId);
          const projectIds = clientProjects.map(p => p.id);
          activities = await storage.getActivitiesByProjects(projectIds);
        }
      }
      
      res.json(activities);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch activities" });
    }
  });

  // Project Files routes
  app.get("/api/projects/:projectId/files", ensureAuthenticated, async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      
      // Check if user has access to this project
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      const userRole = req.user.role;
      const userId = req.user.id;
      
      if (userRole === "client" && project.clientId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      if (userRole === "manager" && project.managerId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const files = await storage.getProjectFiles(projectId);
      res.json(files);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch project files" });
    }
  });

  // In a real implementation, this would handle file uploads
  app.post("/api/projects/:projectId/files", ensureAuthenticated, async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      
      // Check if user has access to this project
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      const userRole = req.user.role;
      const userId = req.user.id;
      
      if (userRole === "client" && project.clientId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      if (userRole === "manager" && project.managerId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      // In a real implementation, file upload would be handled here
      // For now, we'll just create a file record
      const fileData = insertProjectFileSchema.parse({
        ...req.body,
        projectId,
        uploadedById: req.user.id,
        createdAt: new Date(),
      });
      
      const file = await storage.createProjectFile(fileData);
      
      // Create activity for file upload
      await storage.createActivity({
        userId: req.user.id,
        actionType: "file_uploaded",
        resourceType: "file",
        resourceId: file.id,
        projectId,
        description: `File "${file.name}" was uploaded`,
        createdAt: new Date(),
        metadata: {},
      });
      
      res.status(201).json(file);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid file data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to upload file" });
    }
  });

  // Finance Documents routes
  app.get("/api/finance-documents", ensureAuthenticated, async (req, res) => {
    try {
      const userRole = req.user.role;
      const userId = req.user.id;
      
      let documents;
      
      if (userRole === "admin") {
        documents = await storage.getAllFinanceDocuments();
      } else if (userRole === "manager") {
        // Get documents for projects managed by this manager
        const managedProjects = await storage.getProjectsByManagerId(userId);
        const projectIds = managedProjects.map(p => p.id);
        documents = await storage.getFinanceDocumentsByProjects(projectIds);
      } else {
        // Client: get documents for them
        documents = await storage.getFinanceDocumentsByClient(userId);
      }
      
      res.json(documents);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch finance documents" });
    }
  });

  app.post("/api/finance-documents", ensureAuthenticated, async (req, res) => {
    try {
      const userRole = req.user.role;
      const userId = req.user.id;

      // Создаем финансовый документ с учетом текущего пользователя
      const documentData = insertFinanceDocumentSchema.parse({
        ...req.body,
        createdAt: new Date(),
      });

      // Если пользователь - клиент, убедиться, что clientId соответствует их ID
      if (userRole === "client") {
        // Клиенты могут создавать только свои документы
        if (documentData.clientId && documentData.clientId !== userId) {
          return res.status(403).json({ message: "Вы можете создавать документы только для себя" });
        }
        // Устанавливаем clientId как ID клиента
        documentData.clientId = userId;
        
        // Проверяем, связан ли клиент с проектом, если указан projectId
        if (documentData.projectId) {
          const project = await storage.getProject(documentData.projectId);
          if (!project) {
            return res.status(404).json({ message: "Проект не найден" });
          }
          
          if (project.clientId !== userId) {
            return res.status(403).json({ message: "Вы можете создавать документы только для своих проектов" });
          }
        }
      } else if (userRole === "manager") {
        // Если документ связан с проектом, проверяем доступ
        if (documentData.projectId) {
          const project = await storage.getProject(documentData.projectId);
          if (!project) {
            return res.status(404).json({ message: "Проект не найден" });
          }
          
          if (project.managerId !== userId) {
            return res.status(403).json({ message: "Доступ запрещен" });
          }
        }
      }
      
      const document = await storage.createFinanceDocument(documentData);
      
      // Создаем запись активности, если документ связан с проектом
      if (documentData.projectId) {
        await storage.createActivity({
          userId: userId,
          actionType: "finance_document_created",
          resourceType: "finance_document",
          resourceId: document.id,
          projectId: documentData.projectId,
          description: `Финансовый документ "${document.name}" был создан`,
          createdAt: new Date(),
          metadata: {},
        });
      }
      
      res.status(201).json(document);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Неверные данные документа", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create finance document" });
    }
  });

  // Support Tickets routes
  app.get("/api/support-tickets", ensureAuthenticated, async (req, res) => {
    try {
      const userRole = req.user.role;
      const userId = req.user.id;
      
      let tickets;
      
      if (userRole === "admin" || userRole === "manager") {
        tickets = await storage.getAllSupportTickets();
      } else {
        // Client: get their tickets
        tickets = await storage.getSupportTicketsByClient(userId);
      }
      
      res.json(tickets);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch support tickets" });
    }
  });

  app.post("/api/support-tickets", ensureAuthenticated, async (req, res) => {
    try {
      const ticketData = insertSupportTicketSchema.parse({
        ...req.body,
        clientId: req.user.id,
        createdAt: new Date(),
      });
      
      // If ticket is associated with a project, verify access
      if (ticketData.projectId) {
        const project = await storage.getProject(ticketData.projectId);
        if (!project) {
          return res.status(404).json({ message: "Project not found" });
        }
        
        if (req.user.role === "client" && project.clientId !== req.user.id) {
          return res.status(403).json({ message: "Access denied" });
        }
      }
      
      const ticket = await storage.createSupportTicket(ticketData);
      
      // Create activity for ticket creation if associated with project
      if (ticketData.projectId) {
        await storage.createActivity({
          userId: req.user.id,
          actionType: "support_ticket_created",
          resourceType: "support_ticket",
          resourceId: ticket.id,
          projectId: ticketData.projectId,
          description: `Support ticket "${ticket.title}" was created`,
          createdAt: new Date(),
          metadata: {},
        });
      }
      
      res.status(201).json(ticket);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid ticket data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create support ticket" });
    }
  });

  // User profile routes
  app.get("/api/users/contacts", ensureAuthenticated, async (req, res) => {
    try {
      // Get all users except current user
      const allUsers = await db.select().from(users).where(sql`id != ${req.user.id}`);
      
      // Map to contact format
      const contacts = allUsers.map(user => ({
        id: user.id,
        name: `${user.firstName} ${user.lastName}`.trim(),
        email: user.email,
        role: user.role,
        avatarInitials: user.avatarInitials,
      }));
      
      res.json(contacts);
    } catch (error) {
      console.error("Error fetching contacts:", error);
      res.status(500).json({ message: "Failed to fetch contacts" });
    }
  });

  // Update user profile
  app.patch("/api/users/:id", ensureAuthenticated, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      
      // Make sure user can only update their own profile
      if (userId !== req.user.id && req.user.role !== "admin") {
        return res.status(403).json({ message: "Access denied" });
      }
      
      // Get the current user
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Create update data with type safety
      const updateData: Record<string, any> = {
        firstName: req.body.firstName || user.firstName,
        lastName: req.body.lastName || user.lastName,
        email: req.body.email || user.email,
        // Generate avatar initials from first and last name
        avatarInitials: req.body.firstName && req.body.lastName 
          ? `${req.body.firstName[0]}${req.body.lastName[0]}`.toUpperCase()
          : user.avatarInitials
      };
      
      // Add optional fields if provided
      if (req.body.company !== undefined) updateData.company = req.body.company;
      if (req.body.position !== undefined) updateData.position = req.body.position;
      if (req.body.phone !== undefined) updateData.phone = req.body.phone;
      if (req.body.bio !== undefined) updateData.bio = req.body.bio;
      
      // Update the user
      const updatedUser = await db.update(users)
        .set(updateData)
        .where(eq(users.id, userId))
        .returning();
      
      // Return the updated user
      if (updatedUser.length > 0) {
        // Remove password from response
        const { password, ...userWithoutPassword } = updatedUser[0];
        res.json(userWithoutPassword);
      } else {
        res.status(500).json({ message: "Failed to update user" });
      }
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });
  
  // Change user password
  app.post("/api/users/change-password", ensureAuthenticated, async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: "Current password and new password are required" });
      }
      
      // Get the current user
      const user = await storage.getUser(req.user.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Verify current password
      const isPasswordValid = await comparePasswords(currentPassword, user.password);
      if (!isPasswordValid) {
        return res.status(400).json({ message: "Current password is incorrect" });
      }
      
      // Hash new password
      const hashedPassword = await hashPassword(newPassword);
      
      // Update the user's password
      await db.update(users)
        .set({ password: hashedPassword })
        .where(eq(users.id, req.user.id));
      
      res.json({ message: "Password updated successfully" });
    } catch (error) {
      console.error("Error changing password:", error);
      res.status(500).json({ message: "Failed to change password" });
    }
  });

  // API для получения списка пользователей системы для выбора в формах
  // Получение списка всех пользователей (только для администраторов)
  app.get("/api/users", ensureAuthenticated, hasRole(["admin"]), async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Получение конкретного пользователя по ID
  app.get("/api/users/:id", ensureAuthenticated, hasRole(["admin"]), async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      
      // Проверка на валидный числовой ID
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Создание нового пользователя (только для администраторов)
  app.post("/api/users", ensureAuthenticated, hasRole(["admin"]), async (req, res) => {
    try {
      // Проверяем, не существует ли уже пользователь с таким email
      const existingUser = await storage.getUserByEmail(req.body.email);
      if (existingUser) {
        return res.status(400).json({ message: "User with this email already exists" });
      }
      
      // Хешируем пароль
      const hashedPassword = await hashPassword(req.body.password);
      
      // Создаем инициалы для аватара
      const avatarInitials = `${req.body.firstName.charAt(0)}${req.body.lastName.charAt(0)}`.toUpperCase();
      
      // Создаем пользователя
      const userData = {
        ...req.body,
        password: hashedPassword,
        avatarInitials
      };
      
      const newUser = await storage.createUser(userData);
      
      // Удаляем пароль из ответа
      const { password, ...userWithoutPassword } = newUser;
      
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  // Обновление пользователя (только для администраторов)
  app.patch("/api/users/:id", ensureAuthenticated, hasRole(["admin"]), async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      
      // Проверка на валидный числовой ID
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const userData = { ...req.body };
      
      // Проверяем существование пользователя
      const existingUser = await storage.getUser(userId);
      if (!existingUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Если меняется email, проверяем, не занят ли он
      if (userData.email && userData.email !== existingUser.email) {
        const userWithSameEmail = await storage.getUserByEmail(userData.email);
        if (userWithSameEmail && userWithSameEmail.id !== userId) {
          return res.status(400).json({ message: "Email is already in use" });
        }
      }
      
      // Создаем инициалы для аватара, если изменились имя или фамилия
      if (userData.firstName || userData.lastName) {
        const firstName = userData.firstName || existingUser.firstName;
        const lastName = userData.lastName || existingUser.lastName;
        userData.avatarInitials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
      }
      
      // Обновляем пользователя
      const updatedUser = await storage.updateUser(userId, userData);
      
      // Удаляем пароль из ответа
      const { password, ...userWithoutPassword } = updatedUser;
      
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  // Обновление пароля пользователя (только для администраторов)
  app.patch("/api/users/:id/password", ensureAuthenticated, hasRole(["admin"]), async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const { password } = req.body;
      
      if (!password || password.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters long" });
      }
      
      // Проверяем существование пользователя
      const existingUser = await storage.getUser(userId);
      if (!existingUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Хешируем новый пароль
      const hashedPassword = await hashPassword(password);
      
      // Обновляем пароль
      await storage.updateUser(userId, { password: hashedPassword });
      
      res.json({ message: "Password updated successfully" });
    } catch (error) {
      console.error("Error updating password:", error);
      res.status(500).json({ message: "Failed to update password" });
    }
  });

  // Удаление пользователя (только для администраторов)
  app.delete("/api/users/:id", ensureAuthenticated, hasRole(["admin"]), async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      
      // Проверяем существование пользователя
      const existingUser = await storage.getUser(userId);
      if (!existingUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Запрещаем удалять самого себя
      if (userId === req.user.id) {
        return res.status(400).json({ message: "You cannot delete your own account" });
      }
      
      // Удаляем пользователя
      await storage.deleteUser(userId);
      
      res.json({ message: "User deleted successfully" });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  // GET /api/users/clients - получить список клиентов
  app.get("/api/users/clients", hasRole(["admin", "manager"]), async (req, res) => {
    try {
      // Получаем список пользователей с ролью client
      const clients = await storage.getUsersByRole("client");
      res.json(clients);
    } catch (error) {
      console.error("Error fetching clients:", error);
      res.status(500).json({ message: "Failed to fetch clients" });
    }
  });
  
  // GET /api/users/managers - получить список менеджеров
  app.get("/api/users/managers", hasRole(["admin"]), async (req, res) => {
    try {
      // Получаем список пользователей с ролью manager
      const managers = await storage.getUsersByRole("manager");
      res.json(managers);
    } catch (error) {
      console.error("Error fetching managers:", error);
      res.status(500).json({ message: "Failed to fetch managers" });
    }
  });
  
  // GET /api/users/contacts - получить список всех пользователей для контактов
  app.get("/api/users/contacts", ensureAuthenticated, async (req, res) => {
    try {
      // Получаем список всех пользователей (кроме текущего)
      const contacts = await db.select({
        id: users.id,
        name: sql`concat(${users.firstName}, ' ', ${users.lastName})`,
        email: users.email,
        role: users.role,
        avatarInitials: users.avatarInitials
      })
      .from(users)
      .where(ne(users.id, req.user.id));
      
      res.json(contacts);
    } catch (error) {
      console.error("Error fetching contacts:", error);
      res.status(500).json({ message: "Failed to fetch contacts" });
    }
  });

  // Настраиваем сохранение загруженных файлов
  const uploadsDir = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  // Настройка multer для загрузки файлов
  const multerStorage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
      // Добавляем временную метку к имени файла для уникальности
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, uniqueSuffix + '-' + file.originalname);
    }
  });

  const upload = multer({ storage: multerStorage });

  // Загрузка файлов для проекта
  app.post('/api/project-files/upload', ensureAuthenticated, upload.array('files'), async (req, res) => {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ message: 'No files uploaded' });
      }

      const projectId = parseInt(req.body.projectId);
      if (isNaN(projectId)) {
        return res.status(400).json({ message: 'Invalid project ID' });
      }

      // Проверка доступа к проекту
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ message: 'Project not found' });
      }

      const userRole = req.user.role;
      const userId = req.user.id;

      if (userRole === "client" && project.clientId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      if (userRole === "manager" && project.managerId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      // Сохраняем информацию о файлах в базе данных
      const savedFiles = [];
      for (const file of req.files as Express.Multer.File[]) {
        const fileData = {
          projectId,
          name: file.originalname,
          path: file.path,
          size: file.size,
          type: file.mimetype,
          uploadedById: userId,
          uploadedAt: new Date(),
        };

        const savedFile = await storage.createProjectFile(fileData);
        savedFiles.push(savedFile);
      }

      // Создаем активность для загрузки файлов
      await storage.createActivity({
        userId: req.user.id,
        actionType: "files_uploaded",
        resourceType: "project",
        resourceId: projectId,
        projectId: projectId,
        description: `${savedFiles.length} files were uploaded to project "${project.name}"`,
        createdAt: new Date(),
        metadata: {
          fileCount: savedFiles.length,
          fileNames: savedFiles.map(f => f.name),
        },
      });

      res.status(201).json(savedFiles);
    } catch (error) {
      console.error('Error uploading files:', error);
      res.status(500).json({ message: 'Failed to upload files' });
    }
  });

  // Setup HTTP server
  const httpServer = createServer(app);
  return httpServer;
}
