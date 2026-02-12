import { useState, useCallback } from 'react';
import { Task, TaskStatus } from '../types';
import { apiService } from '../services/apiService';

/**
 * Custom hook for managing tasks state and operations.
 * Provides methods for creating, updating, and toggling tasks with API persistence.
 */
export const useTasks = (
    tasks: Task[],
    setTasks: React.Dispatch<React.SetStateAction<Task[]>>
) => {
    const [isLoading, setIsLoading] = useState(false);

    // Toggle task status between TODO and DONE
    const toggleTaskStatus = useCallback(async (taskId: string) => {
        let updatedTask: Task | undefined;

        setTasks(prev =>
            prev.map(t => {
                if (t.id === taskId) {
                    const nextStatus = t.status === TaskStatus.DONE ? TaskStatus.TODO : TaskStatus.DONE;
                    const u = { ...t, status: nextStatus, completed: nextStatus === TaskStatus.DONE };
                    updatedTask = u;
                    return u;
                }
                return t;
            })
        );

        if (updatedTask) {
            try {
                await apiService.updateTask(updatedTask);
            } catch (e) {
                console.error('Failed to update task status:', e);
            }
        }
    }, [setTasks]);

    // Add a new task
    const addTask = useCallback(async (task: Task) => {
        setTasks(prev => [task, ...prev]);
        try {
            await apiService.createTask(task);
        } catch (e) {
            console.error('Failed to create task:', e);
        }
    }, [setTasks]);

    // Add multiple tasks at once
    const addTasks = useCallback(async (newTasks: Task[]) => {
        setTasks(prev => [...newTasks, ...prev]);
        try {
            await Promise.all(newTasks.map(t => apiService.createTask(t)));
        } catch (e) {
            console.error('Failed to create tasks:', e);
        }
    }, [setTasks]);

    // Update task (e.g., RICE score)
    const updateTask = useCallback(async (updatedTask: Task) => {
        setTasks(prev => prev.map(t => (t.id === updatedTask.id ? updatedTask : t)));
        try {
            await apiService.updateTask(updatedTask);
        } catch (e) {
            console.error('Failed to update task:', e);
        }
    }, [setTasks]);

    return {
        isLoading,
        toggleTaskStatus,
        addTask,
        addTasks,
        updateTask,
    };
};
