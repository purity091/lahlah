import { useState, useCallback } from 'react';
import { AppContext as AppContextType, Freelancer, ProjectSector } from '../types';
import { apiService } from '../services/apiService';

/**
 * Custom hook for managing projects (contexts) state and operations.
 */
export const useProjects = (
    contexts: AppContextType[],
    setContexts: React.Dispatch<React.SetStateAction<AppContextType[]>>
) => {
    const [isLoading, setIsLoading] = useState(false);

    // Create a new sub-project
    const createSubProject = useCallback(async (
        parentId: string,
        name: string,
        sector: ProjectSector
    ) => {
        const parent = contexts.find(c => c.id === parentId);
        if (!parent || !name.trim()) return null;

        const newContext: AppContextType = {
            id: `sub-${Math.random().toString(36).substr(2, 6)}`,
            name,
            description: `Sub-project of ${parent.name}`,
            icon: parent.icon,
            color: parent.color,
            group: 'projects',
            parentId,
            sector,
        };

        setContexts(prev => [...prev, newContext]);

        try {
            await apiService.createProject(newContext);
        } catch (e) {
            console.error('Failed to create sub-project:', e);
        }

        return newContext;
    }, [contexts, setContexts]);

    // Update an existing project
    const updateProject = useCallback(async (updatedProject: AppContextType) => {
        setContexts(prev =>
            prev.map(c => (c.id === updatedProject.id ? updatedProject : c))
        );

        try {
            await apiService.updateProject(updatedProject);
        } catch (e) {
            console.error('Failed to update project:', e);
        }
    }, [setContexts]);

    // Add a freelancer to a project
    const addFreelancer = useCallback(async (
        projectId: string,
        freelancer: Omit<Freelancer, 'id'>
    ) => {
        const newFreelancer: Freelancer = {
            id: Math.random().toString(36).substr(2, 9),
            ...freelancer,
        };

        setContexts(prev =>
            prev.map(c => {
                if (c.id === projectId) {
                    return { ...c, freelancers: [...(c.freelancers || []), newFreelancer] };
                }
                return c;
            })
        );

        try {
            await apiService.addFreelancer(newFreelancer, projectId);
        } catch (e) {
            console.error('Failed to add freelancer:', e);
        }

        return newFreelancer;
    }, [setContexts]);

    // Get child projects of a given parent
    const getChildProjects = useCallback((parentId: string) => {
        return contexts.filter(c => c.parentId === parentId);
    }, [contexts]);

    // Get root-level projects (no parent)
    const getRootProjects = useCallback(() => {
        return contexts.filter(c => c.group === 'projects' && !c.parentId);
    }, [contexts]);

    return {
        isLoading,
        createSubProject,
        updateProject,
        addFreelancer,
        getChildProjects,
        getRootProjects,
    };
};
