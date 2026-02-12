CREATE DATABASE IF NOT EXISTS lahlah_os_db;
USE lahlah_os_db;

-- Projects / Contexts Table
CREATE TABLE IF NOT EXISTS projects (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    color VARCHAR(50),
    group_name VARCHAR(50), -- 'system', 'projects', 'personal'
    strategic_goals JSON, -- JSON Array
    tech_stack JSON, -- JSON Array
    key_features JSON, -- JSON Array
    target_audience TEXT,
    current_phase VARCHAR(50),
    parent_id VARCHAR(50),
    sector VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES projects(id) ON DELETE SET NULL
);

-- Tasks Table
CREATE TABLE IF NOT EXISTS tasks (
    id VARCHAR(50) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(50), -- 'Deep Work', 'Marketing', etc
    priority VARCHAR(10), -- 'High', 'Medium', 'Low'
    status VARCHAR(20), -- 'todo', 'in-progress', 'done'
    date DATE,
    suggested_time VARCHAR(20),
    duration VARCHAR(20),
    rationale TEXT,
    project_id VARCHAR(50),
    completed BOOLEAN DEFAULT FALSE,
    created_at BIGINT,
    rice_score JSON, -- Store RICE score object as JSON
    freelancer_id VARCHAR(50),
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- Freelancers Table
CREATE TABLE IF NOT EXISTS freelancers (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(100),
    sector VARCHAR(50),
    status VARCHAR(20),
    rate VARCHAR(50),
    contact VARCHAR(255),
    project_id VARCHAR(50), -- Simplify: A freelancer belongs to a project context for now
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- Documents Table
CREATE TABLE IF NOT EXISTS documents (
    id VARCHAR(50) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    type VARCHAR(50), -- 'PRD', 'Discovery', 'Note'
    content JSON, -- Structure depends on type
    context_id VARCHAR(50),
    created_at BIGINT,
    FOREIGN KEY (context_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- Chat History Table
CREATE TABLE IF NOT EXISTS chat_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    context_id VARCHAR(50),
    role VARCHAR(20), -- 'user', 'model'
    content TEXT,
    timestamp BIGINT,
    FOREIGN KEY (context_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- Pomodoro Sessions Table
CREATE TABLE IF NOT EXISTS pomodoro_sessions (
    id VARCHAR(50) PRIMARY KEY,
    project_id VARCHAR(50),
    project_name VARCHAR(255),
    start_time BIGINT,
    end_time BIGINT,
    duration INT, -- in seconds
    completed BOOLEAN DEFAULT TRUE,
    session_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);
