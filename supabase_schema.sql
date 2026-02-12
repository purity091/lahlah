-- Lahlah OS Database Schema Setup
-- Run this script in the Supabase SQL Editor to create all required tables

-- 1. Create Projects Table
CREATE TABLE IF NOT EXISTS projects (
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

-- Create indexes for Projects
CREATE INDEX IF NOT EXISTS idx_projects_group ON projects(group_name);
CREATE INDEX IF NOT EXISTS idx_projects_parent ON projects(parent_id);

-- 2. Create Tasks Table
CREATE TABLE IF NOT EXISTS tasks (
    id VARCHAR(50) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    priority VARCHAR(50) CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH')),
    status VARCHAR(50) CHECK (status IN ('DRAFT', 'TODO', 'IN_PROGRESS', 'REVIEW', 'DONE')),
    date DATE,
    suggested_time VARCHAR(50),
    duration VARCHAR(50),
    rationale TEXT,
    project_id VARCHAR(50) REFERENCES projects(id) ON DELETE CASCADE,
    completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    rice_score JSONB,
    freelancer_id VARCHAR(50)
);

-- Create indexes for Tasks
CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);

-- 3. Create Freelancers Table
CREATE TABLE IF NOT EXISTS freelancers (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(100),
    sector VARCHAR(100),
    status VARCHAR(50) CHECK (status IN ('Active', 'Paused', 'Completed')),
    rate VARCHAR(50),
    contact VARCHAR(255),
    project_id VARCHAR(50) REFERENCES projects(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for Freelancers
CREATE INDEX IF NOT EXISTS idx_freelancers_project ON freelancers(project_id);
CREATE INDEX IF NOT EXISTS idx_freelancers_sector ON freelancers(sector);

-- 4. Create Documents Table
CREATE TABLE IF NOT EXISTS documents (
    id VARCHAR(50) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    type VARCHAR(50),
    content JSONB,
    context_id VARCHAR(50) REFERENCES projects(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for Documents
CREATE INDEX IF NOT EXISTS idx_documents_context ON documents(context_id);
CREATE INDEX IF NOT EXISTS idx_documents_type ON documents(type);

-- 5. Create Chat History Table
CREATE TABLE IF NOT EXISTS chat_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    context_id VARCHAR(50) REFERENCES projects(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL,
    content TEXT NOT NULL,
    timestamp BIGINT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for Chat History
CREATE INDEX IF NOT EXISTS idx_chat_history_context ON chat_history(context_id);
CREATE INDEX IF NOT EXISTS idx_chat_history_timestamp ON chat_history(timestamp);

-- 6. Create Categories Table
CREATE TABLE IF NOT EXISTS categories (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    color VARCHAR(50) NOT NULL,
    project_id VARCHAR(50) REFERENCES projects(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for Categories
CREATE INDEX IF NOT EXISTS idx_categories_project ON categories(project_id);

-- Insert default global categories
INSERT INTO categories (id, name, color, project_id) 
SELECT 
    unnest(ARRAY['cat_product', 'cat_tech', 'cat_strategy', 'cat_content', 'cat_growth', 
                 'cat_personal', 'cat_health', 'cat_admin', 'cat_finance', 'cat_marketing']),
    unnest(ARRAY['منتج', 'تقني', 'استراتيجي', 'محتوى', 'نمو', 
                 'شخصي', 'صحة', 'إداري', 'مالي', 'تسويق']),
    unnest(ARRAY['bg-blue-500', 'bg-purple-500', 'bg-indigo-500', 'bg-pink-500', 'bg-green-500', 
                 'bg-orange-500', 'bg-red-500', 'bg-slate-500', 'bg-emerald-500', 'bg-cyan-500']),
    NULL
ON CONFLICT (id) DO NOTHING;

-- Enable Row Level Security (RLS) if needed
-- Uncomment the following lines if you want to enable RLS
/*
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE freelancers ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Example policy (adjust according to your needs)
CREATE POLICY "Allow all operations for authenticated users" ON projects
    FOR ALL USING (auth.role() = 'authenticated');
*/