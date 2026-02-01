
# Project Management Dashboard - Implementation Plan

## Overview
A clean, invite-only project management dashboard with a shared workspace where Admins manage projects/tasks/files and Viewers have read-only access. Built with Supabase for authentication, database, and file storage.

---

## 1. Authentication & Access Control

### Login System
- Email-based authentication with password
- Custom login page (no sign-up option visible)
- Password reset functionality via email

### Invite-Only System
- Admins invite users by entering email and role
- System sends invitation email with secure signup link
- First-time login links auth account to existing team member record by email
- Users without invites cannot access the system

---

## 2. Team Members & Roles

### Role Permissions
| Action | Admin | Viewer |
|--------|-------|--------|
| View all projects, tasks, files | ✅ | ✅ |
| Invite team members | ✅ | ❌ |
| Create/edit/delete projects | ✅ | ❌ |
| Create/edit/delete tasks | ✅ | ❌ |
| Assign tasks | ✅ | ❌ |
| Upload/delete files | ✅ | ❌ |

### Team Member Fields
- Email (unique, from invite)
- Name
- Role (Admin/Viewer)
- Status (Invited, Active)

---

## 3. Core Features

### Global Dashboard
- **Projects Overview**: Cards showing all projects with status badges (Active/Paused/Completed) using color coding
- **Task Summary**: Visual counters for tasks by status (Todo, In Progress, Blocked, Done)
- **Team Activity**: List of team members with their current "In Progress" task → linked project

### Projects
- Project cards with name, description, and status
- Status shown with colored badges (green=Active, yellow=Paused, blue=Completed)
- Click to view project details
- Admin-only: Add, Edit, Delete buttons

### Project Detail View
- Project information header
- **Kanban Board**: 4 columns (Todo, In Progress, Blocked, Done)
  - Task cards show title, priority badge, assigned member avatar, due date
  - Drag-and-drop to change status (Admin only)
- Files section: List of uploaded files for this project
- Admin-only: Add Task, Upload File buttons

### Tasks
- Title, description, status, priority, due date
- Assigned team member (one per task)
- **Auto-Status Logic**: When a user's task is marked "In Progress", their previous "In Progress" task automatically moves to "Todo"
- Related files list

### Files
- Stored in Supabase Storage
- Linked to project (required) and optionally to a task
- Display: file name, upload date, uploaded by
- Admin-only: Upload and Delete actions

---

## 4. Views & Navigation

### Sidebar Navigation
- Dashboard (home)
- Projects
- Team Members
- Current user info + logout

### Pages
1. **Login** - Clean login form
2. **Dashboard** - Overview with project cards, task stats, team activity
3. **Projects List** - All projects with search/filter
4. **Project Detail** - Kanban board + files
5. **Task Detail** - Full task info in modal/slide-out panel
6. **Team Members** - List with roles and current assignments
7. **Invite Member** (Admin only) - Form to invite new users

---

## 5. Design Style

### Modern & Colorful Theme
- **Status Colors**: 
  - Active/Done = Green
  - In Progress = Blue  
  - Paused/Todo = Yellow/Orange
  - Blocked = Red
- **Priority Badges**: Low (gray), Medium (yellow), High (orange), Urgent (red)
- Gradient accents on headers
- Card-based layout with subtle shadows
- Clean typography with good visual hierarchy
- Desktop-optimized layout

---

## 6. Database Structure

### Tables
- **team_members**: id, email, name, role, status, user_id (linked after first login)
- **user_roles**: For secure role-based access (separate from team_members for security)
- **projects**: id, name, description, status, created_at, created_by
- **tasks**: id, project_id, title, description, status, priority, assigned_to, due_date
- **files**: id, project_id, task_id (optional), file_name, file_url, uploaded_by, uploaded_at

### Security
- Row Level Security (RLS) on all tables
- Role checked server-side using security definer functions
- Viewers can only SELECT; Admins can INSERT/UPDATE/DELETE

---

## 7. File Storage

### Supabase Storage Setup
- Bucket for project files
- RLS policies to enforce read/write based on role
- File organization: `/projects/{project_id}/{filename}`

---

## What's NOT Included (per spec)
- No per-project permissions (all projects visible to all)
- No notifications
- No comments on tasks
- No time tracking
- No mobile optimization (desktop-first)
