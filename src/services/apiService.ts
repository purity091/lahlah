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
                console.warn('Supabase is not configured. Returning empty data.');
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
            throw err;
        }
    },

    // Projects
    createProject: async (project: AppContext) => {
        if (!supabaseService.getClient()) {
            console.warn('Supabase is not configured. Skipping project creation.');
            return;
        }
        
        try {
            const mappedProject = mapProjectToDB(project);
            await supabaseService.insert(PROJECTS_TABLE, mappedProject);
        } catch (err) {
            console.error('Error creating project:', err);
            throw err;
        }
    },

    updateProject: async (project: AppContext) => {
        if (!supabaseService.getClient()) {
            console.warn('Supabase is not configured. Skipping project update.');
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
            throw err;
        }
    },

    // Tasks
    createTask: async (task: Task) => {
        if (!supabaseService.getClient()) {
            console.warn('Supabase is not configured. Skipping task creation.');
            return;
        }
        
        try {
            const mappedTask = mapTaskToDB(task);
            await supabaseService.insert(TASKS_TABLE, mappedTask);
        } catch (err) {
            console.error('Error creating task:', err);
            throw err;
        }
    },

    updateTask: async (task: Task) => {
        if (!supabaseService.getClient()) {
            console.warn('Supabase is not configured. Skipping task update.');
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
            throw err;
        }
    },

    deleteTask: async (taskId: string) => {
        if (!supabaseService.getClient()) {
            console.warn('Supabase is not configured. Skipping task deletion.');
            return;
        }
        
        try {
            await supabaseService.delete(TASKS_TABLE, [{ column: 'id', value: taskId }]);
        } catch (err) {
            console.error('Error deleting task:', err);
            throw err;
        }
    },

    // Freelancers
    addFreelancer: async (freelancer: Freelancer, projectId: string) => {
        if (!supabaseService.getClient()) {
            console.warn('Supabase is not configured. Skipping freelancer addition.');
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
            throw err;
        }
    },

    updateFreelancer: async (freelancer: Freelancer, projectId: string) => {
        if (!supabaseService.getClient()) {
            console.warn('Supabase is not configured. Skipping freelancer update.');
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
            throw err;
        }
    },

    deleteFreelancer: async (freelancerId: string, projectId: string) => {
        if (!supabaseService.getClient()) {
            console.warn('Supabase is not configured. Skipping freelancer deletion.');
            return;
        }
        
        try {
            await supabaseService.delete(FREELANCERS_TABLE, [{ column: 'id', value: freelancerId }]);
        } catch (err) {
            console.error('Error deleting freelancer:', err);
            throw err;
        }
    },

    // Chat
    fetchChatHistory: async (contextId: string) => {
        if (!supabaseService.getClient()) {
            console.warn('Supabase is not configured. Returning empty chat history.');
            return [];
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
            return [];
        }
    },

    saveChatMessage: async (contextId: string, msg: ChatMessage) => {
        if (!supabaseService.getClient()) {
            console.warn('Supabase is not configured. Skipping chat message save.');
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
            throw err;
        }
    },

    // Documents
    createDocument: async (doc: PRDocument) => {
        if (!supabaseService.getClient()) {
            console.warn('Supabase is not configured. Skipping document creation.');
            return;
        }
        
        try {
            const mappedDoc = mapDocumentToDB(doc);
            await supabaseService.insert(DOCUMENTS_TABLE, mappedDoc);
        } catch (err) {
            console.error('Error creating document:', err);
            throw err;
        }
    },

    updateDocument: async (doc: PRDocument) => {
        if (!supabaseService.getClient()) {
            console.warn('Supabase is not configured. Skipping document update.');
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
            throw err;
        }
    },

    deleteDocument: async (docId: string) => {
        if (!supabaseService.getClient()) {
            console.warn('Supabase is not configured. Skipping document deletion.');
            return;
        }
        
        try {
            await supabaseService.delete(DOCUMENTS_TABLE, [{ column: 'id', value: docId }]);
        } catch (err) {
            console.error('Error deleting document:', err);
            throw err;
        }
    },

    // Categories
    getCategories: async (projectId: string): Promise<CustomCategory[]> => {
        if (!supabaseService.getClient()) {
            console.warn('Supabase is not configured. Returning empty categories.');
            return [];
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
            throw err;
        }
    },

    addCategory: async (category: CustomCategory, projectId: string) => {
        if (!supabaseService.getClient()) {
            console.warn('Supabase is not configured. Skipping category addition.');
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
            throw err;
        }
    },

    deleteCategory: async (categoryId: string) => {
        if (!supabaseService.getClient()) {
            console.warn('Supabase is not configured. Skipping category deletion.');
            return;
        }
        
        try {
            await supabaseService.delete(CATEGORIES_TABLE, [{ column: 'id', value: categoryId }]);
        } catch (err) {
            console.error('Error deleting category:', err);
            throw err;
        }
    },

    // Bulk Sync
    syncAll: async (projects: AppContext[], tasks: Task[], documents: PRDocument[]) => {
        if (!supabaseService.getClient()) {
            console.warn('Supabase is not configured. Skipping sync operation.');
            return { success: true, message: 'Sync skipped due to missing Supabase configuration' };
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
            throw err;
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