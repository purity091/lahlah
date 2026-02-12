import { Client, Account, Databases, Storage, ID } from 'appwrite';

class AppwriteService {
    private client: Client;
    public account: Account;
    public databases: Databases;
    public storage: Storage;

    constructor() {
        this.client = new Client();
        
        // Configure Appwrite client
        this.client
            .setEndpoint(process.env.VITE_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1') // Replace with your Appwrite endpoint
            .setProject(process.env.VITE_APPWRITE_PROJECT_ID || ''); // Replace with your Appwrite project ID

        this.account = new Account(this.client);
        this.databases = new Databases(this.client);
        this.storage = new Storage(this.client);
    }

    // Authentication methods
    async createAccount(email: string, password: string, name?: string) {
        try {
            const response = await this.account.create(ID.unique(), email, password, name);
            return response;
        } catch (error) {
            console.error('Error creating account:', error);
            throw error;
        }
    }

    async login(email: string, password: string) {
        try {
            const response = await this.account.createEmailPasswordSession(email, password);
            return response;
        } catch (error) {
            console.error('Error logging in:', error);
            throw error;
        }
    }

    async logout() {
        try {
            await this.account.deleteSession('current');
        } catch (error) {
            console.error('Error logging out:', error);
            throw error;
        }
    }

    async getCurrentUser() {
        try {
            const response = await this.account.get();
            return response;
        } catch (error) {
            console.error('Error getting current user:', error);
            return null;
        }
    }

    // Database methods
    async createDocument(collectionId: string, data: any, documentId?: string) {
        try {
            const response = await this.databases.createDocument(
                process.env.VITE_APPWRITE_DATABASE_ID || '', // Replace with your database ID
                collectionId,
                documentId || ID.unique(),
                data
            );
            return response;
        } catch (error) {
            console.error('Error creating document:', error);
            throw error;
        }
    }

    async getDocument(collectionId: string, documentId: string) {
        try {
            const response = await this.databases.getDocument(
                process.env.VITE_APPWRITE_DATABASE_ID || '', // Replace with your database ID
                collectionId,
                documentId
            );
            return response;
        } catch (error) {
            console.error('Error getting document:', error);
            throw error;
        }
    }

    async listDocuments(collectionId: string, queries: string[] = []) {
        try {
            const response = await this.databases.listDocuments(
                process.env.VITE_APPWRITE_DATABASE_ID || '', // Replace with your database ID
                collectionId,
                queries
            );
            return response;
        } catch (error) {
            console.error('Error listing documents:', error);
            throw error;
        }
    }

    async updateDocument(collectionId: string, documentId: string, data: any) {
        try {
            const response = await this.databases.updateDocument(
                process.env.VITE_APPWRITE_DATABASE_ID || '', // Replace with your database ID
                collectionId,
                documentId,
                data
            );
            return response;
        } catch (error) {
            console.error('Error updating document:', error);
            throw error;
        }
    }

    async deleteDocument(collectionId: string, documentId: string) {
        try {
            const response = await this.databases.deleteDocument(
                process.env.VITE_APPWRITE_DATABASE_ID || '', // Replace with your database ID
                collectionId,
                documentId
            );
            return response;
        } catch (error) {
            console.error('Error deleting document:', error);
            throw error;
        }
    }
}

export default AppwriteService;