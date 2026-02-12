# Appwrite Database Collections Setup

This document explains how to set up the required database collections in Appwrite for the Lahlah OS application.

## Prerequisites

1. An Appwrite account (either self-hosted or using Appwrite Cloud)
2. A project created in your Appwrite console
3. Your project ID and API key

## Required Collections

Create the following collections in your Appwrite database:

### 1. Projects Collection (`projects`)
- **Collection ID**: `projects`
- **Attributes**:
  - `id` (String, 50 chars, required) - Unique identifier for the project
  - `name` (String, 255 chars, required) - Name of the project
  - `description` (String, 1000 chars, optional) - Description of the project
  - `icon` (String, 50 chars, optional) - Icon identifier
  - `color` (String, 50 chars, optional) - Color for the project
  - `group` (String, 50 chars, optional) - Group identifier (e.g., 'system', 'personal', 'projects')
  - `strategicGoals` (String, array, optional) - Array of strategic goals
  - `techStack` (String, array, optional) - Array of technologies used
  - `keyFeatures` (String, array, optional) - Array of key features
  - `targetAudience` (String, 255 chars, optional) - Target audience description
  - `currentPhase` (String, 50 chars, optional) - Current phase of the project
  - `parentId` (String, 50 chars, optional) - Parent project ID for hierarchical projects
  - `sector` (String, 50 chars, optional) - Sector of the project

### 2. Tasks Collection (`tasks`)
- **Collection ID**: `tasks`
- **Attributes**:
  - `id` (String, 50 chars, required) - Unique identifier for the task
  - `title` (String, 255 chars, required) - Title of the task
  - `category` (String, 100 chars, optional) - Category of the task
  - `priority` (String, 50 chars, optional) - Priority level (HIGH, MEDIUM, LOW)
  - `status` (String, 50 chars, optional) - Status of the task (TODO, IN_PROGRESS, REVIEW, DONE, etc.)
  - `date` (Date, optional) - Due date of the task
  - `suggestedTime` (String, 50 chars, optional) - Suggested time for the task
  - `duration` (String, 50 chars, optional) - Duration of the task
  - `rationale` (String, 1000 chars, optional) - Reason for the task
  - `contextId` (String, 50 chars, required) - Reference to the project ID
  - `completed` (Boolean, required) - Whether the task is completed
  - `createdAt` (Integer, required) - Timestamp when the task was created
  - `rice` (JSON, optional) - RICE scoring data (reach, impact, confidence, effort)
  - `freelancerId` (String, 50 chars, optional) - ID of assigned freelancer

### 3. Freelancers Collection (`freelancers`)
- **Collection ID**: `freelancers`
- **Attributes**:
  - `id` (String, 50 chars, required) - Unique identifier for the freelancer
  - `name` (String, 255 chars, required) - Name of the freelancer
  - `role` (String, 100 chars, optional) - Role of the freelancer
  - `sector` (String, 100 chars, optional) - Sector of expertise
  - `status` (String, 50 chars, optional) - Status (Active, Paused, Completed)
  - `rate` (String, 50 chars, optional) - Rate of pay
  - `contact` (String, 255 chars, optional) - Contact information
  - `projectId` (String, 50 chars, required) - Reference to the project ID

### 4. Documents Collection (`documents`)
- **Collection ID**: `documents`
- **Attributes**:
  - `id` (String, 50 chars, required) - Unique identifier for the document
  - `title` (String, 255 chars, required) - Title of the document
  - `type` (String, 50 chars, optional) - Type of document (PRD, feature_rdp, etc.)
  - `content` (JSON, required) - Content of the document
  - `contextId` (String, 50 chars, required) - Reference to the project ID
  - `createdAt` (Integer, required) - Timestamp when the document was created

### 5. Chat History Collection (`chat_history`)
- **Collection ID**: `chat_history`
- **Attributes**:
  - `id` (String, 50 chars, required) - Unique identifier for the chat message
  - `contextId` (String, 50 chars, required) - Reference to the project ID
  - `role` (String, 50 chars, required) - Role of the message sender (user, model)
  - `content` (String, 10000 chars, required) - Content of the message
  - `timestamp` (Integer, required) - Timestamp when the message was sent

### 6. Categories Collection (`categories`)
- **Collection ID**: `categories`
- **Attributes**:
  - `id` (String, 50 chars, required) - Unique identifier for the category
  - `name` (String, 100 chars, required) - Name of the category
  - `color` (String, 50 chars, required) - Color for the category
  - `projectId` (String, 50 chars, optional) - Reference to the project ID (null for global categories)

## Indexes

For each collection, create the following indexes:

- **Projects**: Index on `id` (unique), `group` (key), `parentId` (key)
- **Tasks**: Index on `id` (unique), `contextId` (key), `status` (key), `priority` (key)
- **Freelancers**: Index on `id` (unique), `projectId` (key), `sector` (key)
- **Documents**: Index on `id` (unique), `contextId` (key), `type` (key)
- **Chat History**: Index on `id` (unique), `contextId` (key), `timestamp` (key)
- **Categories**: Index on `id` (unique), `projectId` (key)

## Permissions

Set the following permissions for each collection:

- **Read**: `role:all` (or more restrictive as needed)
- **Write**: `role:member` (authenticated users) or `role:owner` for more security

## Environment Variables

Make sure to set the following environment variables in your `.env.local` file:

```
VITE_APPWRITE_ENDPOINT=https://your-appwrite-instance.com/v1
VITE_APPWRITE_PROJECT_ID=your-project-id
VITE_APPWRITE_DATABASE_ID=your-database-id
```

Replace the values with your actual Appwrite instance details.