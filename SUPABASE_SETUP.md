# Supabase Database Tables Setup

This document explains how to set up the required database tables in Supabase for the Lahlah OS application.

## Prerequisites

1. A Supabase account (https://supabase.com)
2. A project created in your Supabase dashboard
3. Your project URL and anon key

## Required Tables

Create the following tables in your Supabase database using the SQL editor:

### 1. Projects Table
```sql
CREATE TABLE projects (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    color VARCHAR(50),
    group_name VARCHAR(50),
    strategic_goals JSONB,
    tech_stack JSONB,
    key_features JSONB,
    target_audience VARCHAR(255),
    current_phase VARCHAR(50),
    parent_id VARCHAR(50),
    sector VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_projects_group ON projects(group_name);
CREATE INDEX idx_projects_parent ON projects(parent_id);
```

### 2. Tasks Table
```sql
CREATE TABLE tasks (
    id VARCHAR(50) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    priority VARCHAR(50),
    status VARCHAR(50),
    date DATE,
    suggested_time VARCHAR(50),
    duration VARCHAR(50),
    rationale TEXT,
    project_id VARCHAR(50) REFERENCES projects(id) ON DELETE CASCADE,
    completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    rice_score JSONB,
    freelancer_id VARCHAR(50),
    CONSTRAINT valid_priority CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH')),
    CONSTRAINT valid_status CHECK (status IN ('DRAFT', 'TODO', 'IN_PROGRESS', 'REVIEW', 'DONE'))
);

-- Create indexes
CREATE INDEX idx_tasks_project ON tasks(project_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_priority ON tasks(priority);
```

### 3. Freelancers Table
```sql
CREATE TABLE freelancers (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(100),
    sector VARCHAR(100),
    status VARCHAR(50),
    rate VARCHAR(50),
    contact VARCHAR(255),
    project_id VARCHAR(50) REFERENCES projects(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT valid_status CHECK (status IN ('Active', 'Paused', 'Completed'))
);

-- Create indexes
CREATE INDEX idx_freelancers_project ON freelancers(project_id);
CREATE INDEX idx_freelancers_sector ON freelancers(sector);
```

### 4. Documents Table
```sql
CREATE TABLE documents (
    id VARCHAR(50) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    type VARCHAR(50),
    content JSONB,
    context_id VARCHAR(50) REFERENCES projects(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_documents_context ON documents(context_id);
CREATE INDEX idx_documents_type ON documents(type);
```

### 5. Chat History Table
```sql
CREATE TABLE chat_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    context_id VARCHAR(50) REFERENCES projects(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL,
    content TEXT NOT NULL,
    timestamp BIGINT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_chat_history_context ON chat_history(context_id);
CREATE INDEX idx_chat_history_timestamp ON chat_history(timestamp);
```

### 6. Categories Table
```sql
CREATE TABLE categories (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    color VARCHAR(50) NOT NULL,
    project_id VARCHAR(50) REFERENCES projects(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_categories_project ON categories(project_id);

-- Insert default global categories
INSERT INTO categories (id, name, color, project_id) VALUES
('cat_product', 'منتج', 'bg-blue-500', NULL),
('cat_tech', 'تقني', 'bg-purple-500', NULL),
('cat_strategy', 'استراتيجي', 'bg-indigo-500', NULL),
('cat_content', 'محتوى', 'bg-pink-500', NULL),
('cat_growth', 'نمو', 'bg-green-500', NULL),
('cat_personal', 'شخصي', 'bg-orange-500', NULL),
('cat_health', 'صحة', 'bg-red-500', NULL),
('cat_admin', 'إداري', 'bg-slate-500', NULL),
('cat_finance', 'مالي', 'bg-emerald-500', NULL),
('cat_marketing', 'تسويق', 'bg-cyan-500', NULL);
```

## Row Level Security (RLS) Policies

For enhanced security, you may want to implement Row Level Security policies depending on your application's requirements. For a basic setup, you can disable RLS or configure it based on user roles.

## Environment Variables

Make sure to set the following environment variables in your `.env.local` file:

```
VITE_SUPABASE_URL=your-supabase-project-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

Replace the values with your actual Supabase project details from the Project Settings > API section in your Supabase dashboard.