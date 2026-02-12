import { AppContext, Task, PRDocument, Freelancer, ChatMessage, CustomCategory } from '../types';
import SupabaseService from './SupabaseService';

const supabaseService = new SupabaseService();

// Table names - These should match your Supabase tables
const PROJECTS_TABLE = 'projects';
const TASKS_TABLE = 'tasks';
const FREELANCERS_TABLE = 'freelancers';
const DOCUMENTS_TABLE = 'documents';
const CHAT_HISTORY_TABLE = 'chat_history';
const CATEGORIES_TABLE = 'categories';

export const apiService = {
    // Load all initial data
    fetchInitialData: async () => {
        try {
            // Check if Supabase is configured
            if (!supabaseService.getClient()) {
                // Use localStorage as fallback
                const savedData = localStorage.getItem('appData');
                if (savedData) {
                    return JSON.parse(savedData);
                }
                return { projects: [], tasks: [], documents: [] };
            }
            
            // Fetch all projects
            const projects = await supabaseService.select(PROJECTS_TABLE);
            const mappedProjects = projects?.map(mapProjectFromDB) || [];

            // Fetch all tasks
            const tasks = await supabaseService.select(TASKS_TABLE);
            const mappedTasks = tasks?.map(mapTaskFromDB) || [];

            // Fetch all documents
            const documents = await supabaseService.select(DOCUMENTS_TABLE);
            const mappedDocuments = documents?.map(mapDocumentFromDB) || [];

            // Fetch all freelancers
            const freelancers = await supabaseService.select(FREELANCERS_TABLE);

            // Attach freelancers to projects
            mappedProjects.forEach(project => {
                project.freelancers = freelancers
                    .filter((f: any) => f.project_id === project.id)
                    .map(mapFreelancerFromDB);
            });

            return { projects: mappedProjects, tasks: mappedTasks, documents: mappedDocuments };
        } catch (err) {
            console.error('Error fetching initial data:', err);
            // Fallback to localStorage if Supabase fails
            const savedData = localStorage.getItem('appData');
            if (savedData) {
                return JSON.parse(savedData);
            }
            return { projects: [], tasks: [], documents: [] };
        }
    },

    // Projects
    createProject: async (project: AppContext) => {
        if (!supabaseService.getClient()) {
            // Use localStorage as fallback
            const savedData = localStorage.getItem('appData');
            const data = savedData ? JSON.parse(savedData) : { projects: [], tasks: [], documents: [] };
            data.projects.push(project);
            localStorage.setItem('appData', JSON.stringify(data));
            return;
        }
        
        try {
            const mappedProject = mapProjectToDB(project);
            await supabaseService.insert(PROJECTS_TABLE, mappedProject);
        } catch (err) {
            console.error('Error creating project:', err);
            // Fallback to localStorage
            const savedData = localStorage.getItem('appData');
            const data = savedData ? JSON.parse(savedData) : { projects: [], tasks: [], documents: [] };
            data.projects.push(project);
            localStorage.setItem('appData', JSON.stringify(data));
        }
    },

    updateProject: async (project: AppContext) => {
        if (!supabaseService.getClient()) {
            // Use localStorage as fallback
            const savedData = localStorage.getItem('appData');
            const data = savedData ? JSON.parse(savedData) : { projects: [], tasks: [], documents: [] };
            const projectIndex = data.projects.findIndex((p: any) => p.id === project.id);
            if (projectIndex !== -1) {
                data.projects[projectIndex] = project;
            } else {
                data.projects.push(project);
            }
            localStorage.setItem('appData', JSON.stringify(data));
            return;
        }
        
        try {
            const mappedProject = mapProjectToDB(project);
            await supabaseService.update(
                PROJECTS_TABLE, 
                mappedProject, 
                [{ column: 'id', value: project.id }]
            );
        } catch (err) {
            console.error('Error updating project:', err);
            // Fallback to localStorage
            const savedData = localStorage.getItem('appData');
            const data = savedData ? JSON.parse(savedData) : { projects: [], tasks: [], documents: [] };
            const projectIndex = data.projects.findIndex((p: any) => p.id === project.id);
            if (projectIndex !== -1) {
                data.projects[projectIndex] = project;
            } else {
                data.projects.push(project);
            }
            localStorage.setItem('appData', JSON.stringify(data));
        }
    },

    // Tasks
    createTask: async (task: Task) => {
        if (!supabaseService.getClient()) {
            // Use localStorage as fallback
            const savedData = localStorage.getItem('appData');
            const data = savedData ? JSON.parse(savedData) : { projects: [], tasks: [], documents: [] };
            data.tasks.push(task);
            localStorage.setItem('appData', JSON.stringify(data));
            return;
        }
        
        try {
            const mappedTask = mapTaskToDB(task);
            await supabaseService.insert(TASKS_TABLE, mappedTask);
        } catch (err) {
            console.error('Error creating task:', err);
            // Fallback to localStorage
            const savedData = localStorage.getItem('appData');
            const data = savedData ? JSON.parse(savedData) : { projects: [], tasks: [], documents: [] };
            data.tasks.push(task);
            localStorage.setItem('appData', JSON.stringify(data));
        }
    },

    updateTask: async (task: Task) => {
        if (!supabaseService.getClient()) {
            // Use localStorage as fallback
            const savedData = localStorage.getItem('appData');
            const data = savedData ? JSON.parse(savedData) : { projects: [], tasks: [], documents: [] };
            const taskIndex = data.tasks.findIndex((t: any) => t.id === task.id);
            if (taskIndex !== -1) {
                data.tasks[taskIndex] = task;
            } else {
                data.tasks.push(task);
            }
            localStorage.setItem('appData', JSON.stringify(data));
            return;
        }
        
        try {
            const mappedTask = mapTaskToDB(task);
            await supabaseService.update(
                TASKS_TABLE, 
                mappedTask, 
                [{ column: 'id', value: task.id }]
            );
        } catch (err) {
            console.error('Error updating task:', err);
            // Fallback to localStorage
            const savedData = localStorage.getItem('appData');
            const data = savedData ? JSON.parse(savedData) : { projects: [], tasks: [], documents: [] };
            const taskIndex = data.tasks.findIndex((t: any) => t.id === task.id);
            if (taskIndex !== -1) {
                data.tasks[taskIndex] = task;
            } else {
                data.tasks.push(task);
            }
            localStorage.setItem('appData', JSON.stringify(data));
        }
    },

    deleteTask: async (taskId: string) => {
        if (!supabaseService.getClient()) {
            // Use localStorage as fallback
            const savedData = localStorage.getItem('appData');
            const data = savedData ? JSON.parse(savedData) : { projects: [], tasks: [], documents: [] };
            data.tasks = data.tasks.filter((t: any) => t.id !== taskId);
            localStorage.setItem('appData', JSON.stringify(data));
            return;
        }
        
        try {
            await supabaseService.delete(TASKS_TABLE, [{ column: 'id', value: taskId }]);
        } catch (err) {
            console.error('Error deleting task:', err);
            // Fallback to localStorage
            const savedData = localStorage.getItem('appData');
            const data = savedData ? JSON.parse(savedData) : { projects: [], tasks: [], documents: [] };
            data.tasks = data.tasks.filter((t: any) => t.id !== taskId);
            localStorage.setItem('appData', JSON.stringify(data));
        }
    },

    // Freelancers
    addFreelancer: async (freelancer: Freelancer, projectId: string) => {
        if (!supabaseService.getClient()) {
            // Use localStorage as fallback
            const savedData = localStorage.getItem('appData');
            const data = savedData ? JSON.parse(savedData) : { projects: [], tasks: [], documents: [] };
            // Find the project and add the freelancer
            const project = data.projects.find((p: any) => p.id === projectId);
            if (project) {
                if (!project.freelancers) project.freelancers = [];
                project.freelancers.push(freelancer);
            }
            localStorage.setItem('appData', JSON.stringify(data));
            return;
        }
        
        try {
            const mappedFreelancer = {
                ...mapFreelancerToDB(freelancer),
                project_id: projectId
            };
            await supabaseService.insert(FREELANCERS_TABLE, mappedFreelancer);
        } catch (err) {
            console.error('Error adding freelancer:', err);
            // Fallback to localStorage
            const savedData = localStorage.getItem('appData');
            const data = savedData ? JSON.parse(savedData) : { projects: [], tasks: [], documents: [] };
            // Find the project and add the freelancer
            const project = data.projects.find((p: any) => p.id === projectId);
            if (project) {
                if (!project.freelancers) project.freelancers = [];
                project.freelancers.push(freelancer);
            }
            localStorage.setItem('appData', JSON.stringify(data));
        }
    },

    updateFreelancer: async (freelancer: Freelancer, projectId: string) => {
        if (!supabaseService.getClient()) {
            // Use localStorage as fallback
            const savedData = localStorage.getItem('appData');
            const data = savedData ? JSON.parse(savedData) : { projects: [], tasks: [], documents: [] };
            // Find the project and update the freelancer
            const project = data.projects.find((p: any) => p.id === projectId);
            if (project && project.freelancers) {
                const freelancerIndex = project.freelancers.findIndex((f: any) => f.id === freelancer.id);
                if (freelancerIndex !== -1) {
                    project.freelancers[freelancerIndex] = freelancer;
                }
            }
            localStorage.setItem('appData', JSON.stringify(data));
            return;
        }
        
        try {
            const mappedFreelancer = {
                ...mapFreelancerToDB(freelancer),
                project_id: projectId
            };
            await supabaseService.update(
                FREELANCERS_TABLE, 
                mappedFreelancer, 
                [{ column: 'id', value: freelancer.id }]
            );
        } catch (err) {
            console.error('Error updating freelancer:', err);
            // Fallback to localStorage
            const savedData = localStorage.getItem('appData');
            const data = savedData ? JSON.parse(savedData) : { projects: [], tasks: [], documents: [] };
            // Find the project and update the freelancer
            const project = data.projects.find((p: any) => p.id === projectId);
            if (project && project.freelancers) {
                const freelancerIndex = project.freelancers.findIndex((f: any) => f.id === freelancer.id);
                if (freelancerIndex !== -1) {
                    project.freelancers[freelancerIndex] = freelancer;
                }
            }
            localStorage.setItem('appData', JSON.stringify(data));
        }
    },

    deleteFreelancer: async (freelancerId: string, projectId: string) => {
        if (!supabaseService.getClient()) {
            // Use localStorage as fallback
            const savedData = localStorage.getItem('appData');
            const data = savedData ? JSON.parse(savedData) : { projects: [], tasks: [], documents: [] };
            // Find the project and remove the freelancer
            const project = data.projects.find((p: any) => p.id === projectId);
            if (project && project.freelancers) {
                project.freelancers = project.freelancers.filter((f: any) => f.id !== freelancerId);
            }
            localStorage.setItem('appData', JSON.stringify(data));
            return;
        }
        
        try {
            await supabaseService.delete(FREELANCERS_TABLE, [{ column: 'id', value: freelancerId }]);
        } catch (err) {
            console.error('Error deleting freelancer:', err);
            // Fallback to localStorage
            const savedData = localStorage.getItem('appData');
            const data = savedData ? JSON.parse(savedData) : { projects: [], tasks: [], documents: [] };
            // Find the project and remove the freelancer
            const project = data.projects.find((p: any) => p.id === projectId);
            if (project && project.freelancers) {
                project.freelancers = project.freelancers.filter((f: any) => f.id !== freelancerId);
            }
            localStorage.setItem('appData', JSON.stringify(data));
        }
    },

    // Chat
    fetchChatHistory: async (contextId: string) => {
        if (!supabaseService.getClient()) {
            // Use localStorage as fallback
            const savedChats = localStorage.getItem(`chat_${contextId}`);
            return savedChats ? JSON.parse(savedChats) : [];
        }
        
        try {
            const response = await supabaseService.select(
                CHAT_HISTORY_TABLE,
                '*',
                [{ column: 'context_id', value: contextId }]
            );
            return response?.map(mapChatMessageFromDB) || [];
        } catch (err) {
            console.error('Error fetching chat history:', err);
            // Fallback to localStorage
            const savedChats = localStorage.getItem(`chat_${contextId}`);
            return savedChats ? JSON.parse(savedChats) : [];
        }
    },

    saveChatMessage: async (contextId: string, msg: ChatMessage) => {
        if (!supabaseService.getClient()) {
            // Use localStorage as fallback
            const savedChats = localStorage.getItem(`chat_${contextId}`);
            const chats = savedChats ? JSON.parse(savedChats) : [];
            chats.push(msg);
            localStorage.setItem(`chat_${contextId}`, JSON.stringify(chats));
            return;
        }
        
        try {
            const mappedMessage = {
                context_id: contextId,
                role: msg.role,
                content: msg.content,
                timestamp: msg.timestamp
            };
            await supabaseService.insert(CHAT_HISTORY_TABLE, mappedMessage);
        } catch (err) {
            console.error('Error saving chat message:', err);
            // Fallback to localStorage
            const savedChats = localStorage.getItem(`chat_${contextId}`);
            const chats = savedChats ? JSON.parse(savedChats) : [];
            chats.push(msg);
            localStorage.setItem(`chat_${contextId}`, JSON.stringify(chats));
        }
    },

    // Documents
    createDocument: async (doc: PRDocument) => {
        if (!supabaseService.getClient()) {
            // Use localStorage as fallback
            const savedData = localStorage.getItem('appData');
            const data = savedData ? JSON.parse(savedData) : { projects: [], tasks: [], documents: [] };
            data.documents.push(doc);
            localStorage.setItem('appData', JSON.stringify(data));
            return;
        }
        
        try {
            const mappedDoc = mapDocumentToDB(doc);
            await supabaseService.insert(DOCUMENTS_TABLE, mappedDoc);
        } catch (err) {
            console.error('Error creating document:', err);
            // Fallback to localStorage
            const savedData = localStorage.getItem('appData');
            const data = savedData ? JSON.parse(savedData) : { projects: [], tasks: [], documents: [] };
            data.documents.push(doc);
            localStorage.setItem('appData', JSON.stringify(data));
        }
    },

    updateDocument: async (doc: PRDocument) => {
        if (!supabaseService.getClient()) {
            // Use localStorage as fallback
            const savedData = localStorage.getItem('appData');
            const data = savedData ? JSON.parse(savedData) : { projects: [], tasks: [], documents: [] };
            const docIndex = data.documents.findIndex((d: any) => d.id === doc.id);
            if (docIndex !== -1) {
                data.documents[docIndex] = doc;
            } else {
                data.documents.push(doc);
            }
            localStorage.setItem('appData', JSON.stringify(data));
            return;
        }
        
        try {
            const mappedDoc = mapDocumentToDB(doc);
            await supabaseService.update(
                DOCUMENTS_TABLE, 
                mappedDoc, 
                [{ column: 'id', value: doc.id }]
            );
        } catch (err) {
            console.error('Error updating document:', err);
            // Fallback to localStorage
            const savedData = localStorage.getItem('appData');
            const data = savedData ? JSON.parse(savedData) : { projects: [], tasks: [], documents: [] };
            const docIndex = data.documents.findIndex((d: any) => d.id === doc.id);
            if (docIndex !== -1) {
                data.documents[docIndex] = doc;
            } else {
                data.documents.push(doc);
            }
            localStorage.setItem('appData', JSON.stringify(data));
        }
    },

    deleteDocument: async (docId: string) => {
        if (!supabaseService.getClient()) {
            // Use localStorage as fallback
            const savedData = localStorage.getItem('appData');
            const data = savedData ? JSON.parse(savedData) : { projects: [], tasks: [], documents: [] };
            data.documents = data.documents.filter((d: any) => d.id !== docId);
            localStorage.setItem('appData', JSON.stringify(data));
            return;
        }
        
        try {
            await supabaseService.delete(DOCUMENTS_TABLE, [{ column: 'id', value: docId }]);
        } catch (err) {
            console.error('Error deleting document:', err);
            // Fallback to localStorage
            const savedData = localStorage.getItem('appData');
            const data = savedData ? JSON.parse(savedData) : { projects: [], tasks: [], documents: [] };
            data.documents = data.documents.filter((d: any) => d.id !== docId);
            localStorage.setItem('appData', JSON.stringify(data));
        }
    },

    // Categories
    getCategories: async (projectId: string): Promise<CustomCategory[]> => {
        if (!supabaseService.getClient()) {
            // Use localStorage as fallback
            const savedData = localStorage.getItem('appData');
            const data = savedData ? JSON.parse(savedData) : { projects: [], tasks: [], documents: [], categories: {} };
            const projectCategories = data.categories?.[projectId] || [];
            const globalCategories = data.categories?.['global'] || [];
            return [...globalCategories, ...projectCategories];
        }
        
        try {
            // Get global categories (project_id IS NULL) OR project specific categories
            let filters = [];
            if (projectId === 'home') {
                filters = [{ column: 'project_id', value: null }];
            } else {
                filters = [
                    { column: 'project_id', value: null },
                    { column: 'project_id', value: projectId }
                ];
            }
            
            // For simplicity, we'll fetch all categories and filter on the client side
            // In a real implementation, you might want to use a more complex query
            const allCategories = await supabaseService.select(CATEGORIES_TABLE);
            const filteredCategories = allCategories?.filter((cat: any) => 
                cat.project_id === null || cat.project_id === projectId
            ) || [];
            
            return filteredCategories.map(mapCategoryFromDB);
        } catch (err) {
            console.error('Error fetching categories:', err);
            // Fallback to localStorage
            const savedData = localStorage.getItem('appData');
            const data = savedData ? JSON.parse(savedData) : { projects: [], tasks: [], documents: [], categories: {} };
            const projectCategories = data.categories?.[projectId] || [];
            const globalCategories = data.categories?.['global'] || [];
            return [...globalCategories, ...projectCategories];
        }
    },

    addCategory: async (category: CustomCategory, projectId: string) => {
        if (!supabaseService.getClient()) {
            // Use localStorage as fallback
            const savedData = localStorage.getItem('appData');
            const data = savedData ? JSON.parse(savedData) : { projects: [], tasks: [], documents: [], categories: {} };
            if (!data.categories) data.categories = {};
            const categoryKey = projectId === 'home' ? 'global' : projectId;
            if (!data.categories[categoryKey]) data.categories[categoryKey] = [];
            data.categories[categoryKey].push(category);
            localStorage.setItem('appData', JSON.stringify(data));
            return;
        }
        
        try {
            const mappedCategory = {
                ...mapCategoryToDB(category),
                project_id: projectId === 'home' ? null : projectId
            };
            await supabaseService.insert(CATEGORIES_TABLE, mappedCategory);
        } catch (err) {
            console.error('Error adding category:', err);
            // Fallback to localStorage
            const savedData = localStorage.getItem('appData');
            const data = savedData ? JSON.parse(savedData) : { projects: [], tasks: [], documents: [], categories: {} };
            if (!data.categories) data.categories = {};
            const categoryKey = projectId === 'home' ? 'global' : projectId;
            if (!data.categories[categoryKey]) data.categories[categoryKey] = [];
            data.categories[categoryKey].push(category);
            localStorage.setItem('appData', JSON.stringify(data));
        }
    },

    deleteCategory: async (categoryId: string) => {
        if (!supabaseService.getClient()) {
            // Use localStorage as fallback
            const savedData = localStorage.getItem('appData');
            const data = savedData ? JSON.parse(savedData) : { projects: [], tasks: [], documents: [], categories: {} };
            if (data.categories) {
                Object.keys(data.categories).forEach(key => {
                    data.categories[key] = data.categories[key].filter((cat: any) => cat.id !== categoryId);
                });
            }
            localStorage.setItem('appData', JSON.stringify(data));
            return;
        }
        
        try {
            await supabaseService.delete(CATEGORIES_TABLE, [{ column: 'id', value: categoryId }]);
        } catch (err) {
            console.error('Error deleting category:', err);
            // Fallback to localStorage
            const savedData = localStorage.getItem('appData');
            const data = savedData ? JSON.parse(savedData) : { projects: [], tasks: [], documents: [], categories: {} };
            if (data.categories) {
                Object.keys(data.categories).forEach(key => {
                    data.categories[key] = data.categories[key].filter((cat: any) => cat.id !== categoryId);
                });
            }
            localStorage.setItem('appData', JSON.stringify(data));
        }
    },

    // Bulk Sync
    syncAll: async (projects: AppContext[], tasks: Task[], documents: PRDocument[]) => {
        if (!supabaseService.getClient()) {
            // Use localStorage as fallback
            const data = { projects, tasks, documents };
            localStorage.setItem('appData', JSON.stringify(data));
            return { success: true, message: 'Synced to local storage' };
        }
        
        try {
            // Update projects
            for (const project of projects) {
                try {
                    const mappedProject = mapProjectToDB(project);
                    const result = await supabaseService.update(
                        PROJECTS_TABLE, 
                        mappedProject, 
                        [{ column: 'id', value: project.id }]
                    );
                    
                    // If no rows were updated, try inserting
                    if (!result || result.length === 0) {
                        await supabaseService.insert(PROJECTS_TABLE, mapProjectToDB(project));
                    }
                } catch (err) {
                    // If update fails, try inserting
                    try {
                        await supabaseService.insert(PROJECTS_TABLE, mapProjectToDB(project));
                    } catch (insertErr) {
                        console.error('Error syncing project:', insertErr);
                    }
                }
            }

            // Update tasks
            for (const task of tasks) {
                try {
                    const mappedTask = mapTaskToDB(task);
                    const result = await supabaseService.update(
                        TASKS_TABLE, 
                        mappedTask, 
                        [{ column: 'id', value: task.id }]
                    );
                    
                    // If no rows were updated, try inserting
                    if (!result || result.length === 0) {
                        await supabaseService.insert(TASKS_TABLE, mapTaskToDB(task));
                    }
                } catch (err) {
                    // If update fails, try inserting
                    try {
                        await supabaseService.insert(TASKS_TABLE, mapTaskToDB(task));
                    } catch (insertErr) {
                        console.error('Error syncing task:', insertErr);
                    }
                }
            }

            // Update documents
            for (const document of documents) {
                try {
                    const mappedDoc = mapDocumentToDB(document);
                    const result = await supabaseService.update(
                        DOCUMENTS_TABLE, 
                        mappedDoc, 
                        [{ column: 'id', value: document.id }]
                    );
                    
                    // If no rows were updated, try inserting
                    if (!result || result.length === 0) {
                        await supabaseService.insert(DOCUMENTS_TABLE, mapDocumentToDB(document));
                    }
                } catch (err) {
                    // If update fails, try inserting
                    try {
                        await supabaseService.insert(DOCUMENTS_TABLE, mapDocumentToDB(document));
                    } catch (insertErr) {
                        console.error('Error syncing document:', insertErr);
                    }
                }
            }

            return { success: true, message: 'Synced successfully' };
        } catch (err) {
            console.error('Error during sync:', err);
            // Fallback to localStorage
            const data = { projects, tasks, documents };
            localStorage.setItem('appData', JSON.stringify(data));
            return { success: true, message: 'Synced to local storage due to error' };
        }
    }
};

// Mapping functions to convert between app format and Supabase format
const mapProjectToDB = (project: AppContext) => ({
    id: project.id,
    name: project.name,
    description: project.description,
    icon: project.icon,
    color: project.color,
    group_name: project.group,
    strategic_goals: project.strategicGoals || [],
    tech_stack: project.techStack || [],
    key_features: project.keyFeatures || [],
    target_audience: project.targetAudience,
    current_phase: project.currentPhase,
    parent_id: project.parentId,
    sector: project.sector,
    // Note: freelancers are stored separately
});

const mapProjectFromDB = (doc: any): AppContext => ({
    id: doc.id,
    name: doc.name,
    description: doc.description,
    icon: doc.icon,
    color: doc.color,
    group: doc.group_name,
    strategicGoals: doc.strategic_goals || [],
    techStack: doc.tech_stack || [],
    keyFeatures: doc.key_features || [],
    targetAudience: doc.target_audience,
    currentPhase: doc.current_phase,
    parentId: doc.parent_id,
    sector: doc.sector,
    freelancers: [] // Will be populated separately
});

const mapTaskToDB = (task: Task) => ({
    id: task.id,
    title: task.title,
    category: task.category,
    priority: task.priority,
    status: task.status,
    date: task.date,
    suggested_time: task.suggestedTime,
    duration: task.duration,
    rationale: task.rationale,
    project_id: task.contextId,
    completed: task.completed,
    created_at: task.createdAt,
    rice_score: task.rice || {},
    freelancer_id: task.freelancerId
});

const mapTaskFromDB = (doc: any): Task => ({
    id: doc.id,
    title: doc.title,
    category: doc.category,
    priority: doc.priority,
    status: doc.status,
    date: doc.date,
    suggestedTime: doc.suggested_time,
    duration: doc.duration,
    rationale: doc.rationale,
    contextId: doc.project_id,
    completed: doc.completed,
    createdAt: doc.created_at,
    rice: doc.rice_score || {},
    freelancerId: doc.freelancer_id
});

const mapDocumentToDB = (doc: PRDocument) => ({
    id: doc.id,
    title: doc.title,
    type: doc.type,
    content: doc.content,
    context_id: doc.contextId,
    created_at: doc.createdAt
});

const mapDocumentFromDB = (doc: any): PRDocument => ({
    id: doc.id,
    title: doc.title,
    type: doc.type,
    content: doc.content,
    contextId: doc.context_id,
    createdAt: doc.created_at
});

const mapFreelancerToDB = (freelancer: Freelancer) => ({
    id: freelancer.id,
    name: freelancer.name,
    role: freelancer.role,
    sector: freelancer.sector,
    status: freelancer.status,
    rate: freelancer.rate,
    contact: freelancer.contact
});

const mapFreelancerFromDB = (doc: any): Freelancer => ({
    id: doc.id,
    name: doc.name,
    role: doc.role,
    sector: doc.sector,
    status: doc.status,
    rate: doc.rate,
    contact: doc.contact
});

const mapChatMessageFromDB = (doc: any): ChatMessage => ({
    role: doc.role,
    content: doc.content,
    timestamp: doc.timestamp
});

const mapCategoryToDB = (category: CustomCategory) => ({
    id: category.id,
    name: category.name,
    color: category.color
});

const mapCategoryFromDB = (doc: any): CustomCategory => ({
    id: doc.id,
    name: doc.name,
    color: doc.color
});