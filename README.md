# 🌟 Akshar Paaul Volunteer Management System

A comprehensive, modern web application designed specifically for **Akshar Paaul NGO** to manage volunteers, projects, teams, and community activities efficiently. Built with scalability in mind to handle growth from dozens to hundreds of volunteers.

![System Overview](https://img.shields.io/badge/Status-Production%20Ready-brightgreen)
![Version](https://img.shields.io/badge/Version-2.0-blue)
![License](https://img.shields.io/badge/License-MIT-yellow)

## 📋 Table of Contents

- [🎯 Overview](#-overview)
- [✨ Key Features](#-key-features)
- [🏗️ System Architecture](#️-system-architecture)
- [🚀 Quick Start](#-quick-start)
- [⚙️ Detailed Setup](#️-detailed-setup)
- [👥 User Roles & Permissions](#-user-roles--permissions)
- [📖 Feature Guide](#-feature-guide)
- [🔧 Admin Guide](#-admin-guide)
- [💻 Technical Details](#-technical-details)
- [🐛 Troubleshooting](#-troubleshooting)
- [🤝 Contributing](#-contributing)

## 🎯 Overview

The Akshar Paaul Volunteer Management System is a full-stack web application that streamlines volunteer coordination, project management, and community engagement. It provides a centralized platform for volunteers to collaborate, track their contributions, and stay connected with the NGO's mission.

### 🌍 Mission Alignment

> **Akshar Paaul's Mission**: Empowering communities through education, skill development, and social initiatives.

This system supports the mission by:
- **Organizing Volunteers**: Efficient team-based management
- **Tracking Impact**: Comprehensive work hour logging and project tracking
- **Facilitating Communication**: Team collaboration and announcements
- **Maintaining Records**: Document management and progress tracking

## ✨ Key Features

### 🔐 **Authentication & User Management**
- Secure registration and login system
- Role-based access control (Admin/Volunteer)
- Enhanced user profiles with college, course, and emergency contact details
- Session-based authentication with proper security

### 👥 **Team Management**
- Create and join teams for collaborative projects
- Team leader and member roles
- Team-specific document sharing
- Member management with detailed profiles

### 📊 **Project Management**
- Create, submit, and track projects
- Project approval workflow
- Team and individual project support
- Project deletion with proper validation
- Status tracking (Draft → Submitted → Approved → In Progress → Completed)

### ⏰ **Work Log System**
- Log volunteer hours with detailed descriptions
- Admin approval workflow- 
Bulk work log management
- Time tracking and reporting
- Project-specific hour logging

### 📄 **Document Management**
- Upload and share documents via Google Drive links
- Team-specific document access
- Document categorization (NGO Signed, Proposals, Updates)
- Admin and uploader deletion permissions

### 📢 **Announcements System**
- Admin-created announcements visible to all users
- Rich text formatting with line break support
- Announcement management and deletion
- Prominent dashboard display

### 📈 **Analytics & Reporting**
- Comprehensive admin dashboard with statistics
- Volunteer activity tracking
- Project progress monitoring
- Team performance metrics
- Unassigned volunteer identification

### 🎨 **Modern User Interface**
- Responsive design for all devices
- Intuitive navigation and user experience
- Clean, professional styling
- Tabbed interfaces for organized content
- Real-time updates and feedback

## 🏗️ System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   Database      │
│   (React)       │◄──►│   (Flask)       │◄──►│   (SQLite)      │
│                 │    │                 │    │                 │
│ • Dashboard     │    │ • REST APIs     │    │ • Users         │
│ • Teams         │    │ • Authentication│    │ • Teams         │
│ • Projects      │    │ • Authorization │    │ • Projects      │
│ • Work Logs     │    │ • Business Logic│    │ • Work Logs     │
│ • Documents     │    │ • Data Validation│   │ • Documents     │
│ • Announcements │    │ • Error Handling│    │ • Announcements │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Technology Stack

**Backend:**
- **Flask**: Python web framework
- **SQLAlchemy**: ORM for database operations
- **SQLite**: Lightweight database (production-ready for medium scale)
- **Werkzeug**: Password hashing and security
- **Python 3.8+**: Core programming language

**Frontend:**
- **React 18**: Modern JavaScript framework
- **Axios**: HTTP client for API communication
- **CSS3**: Custom styling with responsive design
- **HTML5**: Semantic markup

**Development Tools:**
- **npm**: Package management
- **Git**: Version control
- **VS Code**: Recommended IDE

## 🚀 Quick Start

### Prerequisites
- Python 3.8 or higher
- Node.js 16 or higher
- npm or yarn
- Git

### 1-Minute Setup

```bash
# Clone the repository
git clone <repository-url>
cd volunteer-management-system

# Backend setup
pip install -r requirements.txt
python app.py  # This initializes the database

# Frontend setup (in a new terminal)
cd frontend
npm install
npm start

# Access the application
# Frontend: http://localhost:3000
# Backend API: http://localhost:5000
```

### First Login
1. **Admin Account**: Use the credentials from `Credentials for Testing.csv`
2. **Create Volunteer Account**: Register through the signup form
3. **Explore Features**: Start with the Dashboard to see the overview

## ⚙️ Detailed Setup

### Environment Configuration

Create a `.env` file in the root directory:

```env
# Database Configuration
DATABASE_URL=sqlite:///volunteer_system.db

# Security
SECRET_KEY=your-super-secret-key-here-change-in-production

# Application Settings
FLASK_ENV=development
FLASK_DEBUG=True

# Optional: Email Configuration (for future features)
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USE_TLS=True
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password
```

### Database Initialization

The system automatically creates the database on first run. To reset the database:

```bash
# Reset database (WARNING: This deletes all data)
python reset_db.py

# Or manually delete and restart
rm volunteer_system.db instance/volunteer_system.db
python app.py
```

### Production Deployment

For production deployment:

1. **Environment Variables**:
   ```env
   FLASK_ENV=production
   FLASK_DEBUG=False
   SECRET_KEY=generate-a-strong-secret-key
   ```

2. **Database**: Consider upgrading to PostgreSQL for better performance
3. **Web Server**: Use Gunicorn + Nginx for production
4. **SSL**: Enable HTTPS for security
5. **Backup**: Implement regular database backups

## 👥 User Roles & Permissions

### 🔑 Admin Role
**Full system access with the following capabilities:**

**User Management:**
- View all volunteer profiles and statistics
- Access comprehensive admin dashboard
- Monitor system-wide activity

**Team Management:**
- View all teams and their members
- Access team details and member lists
- Monitor team activities and documents

**Project Management:**
- Approve/reject submitted projects
- View all projects across the system
- Delete projects when necessary
- Track project progress and completion

**Work Log Management:**
- Approve/reject volunteer work logs
- Bulk approve multiple work logs
- View detailed work log statistics
- Monitor volunteer contributions

**Document Management:**
- Upload documents to any team
- Delete any document in the system
- Manage document categories and access

**Announcements:**
- Create system-wide announcements
- Edit and delete announcements
- Manage announcement visibility

**Analytics:**
- Access comprehensive system statistics
- View volunteer activity reports
- Monitor team performance metrics
- Identify unassigned volunteers

### 👤 Volunteer Role
**Standard user access with the following capabilities:**

**Profile Management:**
- Update personal information
- Manage contact details and emergency contacts
- View personal statistics and contributions

**Team Participation:**
- Join existing teams
- View team member details
- Access team-specific documents
- Participate in team activities

**Project Management:**
- Create and submit projects
- Edit draft projects
- Delete own projects (with restrictions)
- Track project status and progress

**Work Log Management:**
- Log volunteer hours and activities
- Edit pending work logs
- View work log history and status
- Track total contribution hours

**Document Access:**
- View team-shared documents
- Access document links and resources
- Download shared materials

**Communication:**
- View system announcements
- Stay updated with NGO activities
- Receive important notifications

## 📖 Feature Guide

### 🏠 Dashboard

**For Volunteers:**
- **Statistics Overview**: Total hours, pending logs, projects
- **Recent Activity**: Latest work logs and project updates
- **Announcements**: Important updates from administrators
- **Quick Actions**: Easy access to common tasks

**For Admins:**
- **System Statistics**: Total volunteers, teams, projects, work logs
- **Pending Approvals**: Work logs and projects awaiting review
- **Team Overview**: Team statistics and member counts
- **Unassigned Volunteers**: Volunteers not part of any team

### 👥 Teams

**Creating Teams:**
1. Navigate to Teams section
2. Click "Create New Team"
3. Fill in team details (name, description)
4. Submit to create the team

**Joining Teams:**
1. Browse available teams
2. Click on team name to view details
3. Click "Join Team" to request membership
4. Team leaders can approve/reject requests

**Team Management:**
- **Members Tab**: View team members and their roles
- **Documents Tab**: Access team-specific documents
- **Team Leaders**: Can manage team membership and documents

### 📊 Projects

**Project Lifecycle:**
1. **Draft**: Initial creation, editable by creator
2. **Submitted**: Submitted for admin review
3. **Approved**: Approved by admin, ready to start
4. **In Progress**: Active project work
5. **Completed**: Project finished and closed

**Creating Projects:**
1. Go to Projects section
2. Click "Create New Project"
3. Fill in project details:
   - Title and description
   - Project type (Individual/Team)
   - Select team (if team project)
   - Set timeline and goals
4. Save as draft or submit for approval

**Project Management:**
- Edit projects in draft status
- Submit projects for admin approval
- Track project progress and status
- Delete projects (with restrictions)

### ⏰ Work Logs

**Logging Work Hours:**
1. Navigate to Work Logs section
2. Click "Log New Work"
3. Fill in details:
   - Select associated project
   - Enter hours worked
   - Provide detailed description
   - Set work date
4. Submit for admin approval

**Work Log Management:**
- View all personal work logs
- Edit pending work logs
- Track approval status
- View total contribution hours

**Admin Approval Process:**
- Admins review submitted work logs
- Approve or reject with feedback
- Bulk approval for multiple logs
- Track volunteer contributions

### 📄 Documents

**Document Sharing:**
- Upload documents via Google Drive links
- Categorize documents (NGO Signed, Proposals, Updates)
- Share with specific teams
- Manage document access and permissions

**Document Types:**
- **NGO Signed Documents**: Official agreements and contracts
- **Project Proposals**: Project planning and proposal documents
- **Project Updates**: Progress reports and updates

**Access Control:**
- Team-specific document sharing
- Admin can manage all documents
- Uploaders can delete their own documents
- Secure link-based access

### 📢 Announcements

**For Admins:**
1. Go to Admin Dashboard → Announcements tab
2. Click "Create Announcement"
3. Fill in title and content
4. Submit to publish system-wide

**For Volunteers:**
- View announcements on dashboard
- Stay updated with important information
- Receive notifications about NGO activities

## 🔧 Admin Guide

### Getting Started as Admin

1. **Login**: Use admin credentials from the testing file
2. **Dashboard**: Review system statistics and pending items
3. **Setup Teams**: Create initial teams for organization
4. **Approve Content**: Review and approve submitted projects and work logs
5. **Manage Users**: Monitor volunteer activity and engagement

### Daily Admin Tasks

**Morning Routine:**
- Check pending work log approvals
- Review new project submissions
- Monitor team activities
- Check for new volunteer registrations

**Weekly Tasks:**
- Create announcements for important updates
- Review team performance and member engagement
- Analyze volunteer contribution statistics
- Plan upcoming projects and initiatives

**Monthly Tasks:**
- Generate volunteer activity reports
- Review and update team structures
- Archive completed projects
- Plan recognition and appreciation events

### Best Practices

**Project Management:**
- Approve projects promptly to maintain volunteer engagement
- Provide constructive feedback for rejected projects
- Monitor project progress and offer support
- Celebrate project completions

**Work Log Management:**
- Review work logs within 48 hours
- Provide feedback for rejected logs
- Use bulk approval for efficiency
- Track volunteer contribution trends

**Team Management:**
- Encourage team formation and collaboration
- Monitor team document sharing
- Support team leaders in their roles
- Address team conflicts promptly

**Communication:**
- Use announcements for important updates
- Keep announcements concise and actionable
- Regular communication builds engagement
- Acknowledge volunteer contributions publicly

## 💻 Technical Details

### API Endpoints

**Authentication:**
```
POST /api/register/          # User registration
POST /api/login/             # User login
POST /api/logout/            # User logout
GET  /api/profile/           # Get user profile
POST /api/profile/update/    # Update user profile
```

**Teams:**
```
GET  /api/teams/                    # Get all teams
POST /api/teams/create/             # Create new team
GET  /api/teams/<id>/members/       # Get team members
POST /api/teams/<id>/join/          # Join team
POST /api/teams/<id>/leave/         # Leave team
GET  /api/teams/<id>/documents/     # Get team documents
```

**Projects:**
```
GET  /api/projects/                 # Get user projects
POST /api/projects/create/          # Create new project
GET  /api/projects/<id>/            # Get project details
POST /api/projects/<id>/update/     # Update project
POST /api/projects/<id>/submit/     # Submit project
POST /api/projects/<id>/approve/    # Approve project (admin)
DELETE /api/projects/<id>/delete/   # Delete project
```

**Work Logs:**
```
GET  /api/work-logs/                # Get user work logs
POST /api/work-logs/create/         # Create work log
POST /api/work-logs/<id>/update/    # Update work log
POST /api/work-logs/<id>/approve/   # Approve work log (admin)
POST /api/work-logs/bulk-approve/   # Bulk approve (admin)
```

**Documents:**
```
GET  /api/volunteers/documents/     # Get user documents
POST /api/volunteers/documents/upload/ # Upload document
DELETE /api/volunteers/documents/<id>/delete/ # Delete document
```

**Announcements:**
```
GET  /api/announcements/            # Get active announcements
POST /api/announcements/create/     # Create announcement (admin)
DELETE /api/announcements/<id>/delete/ # Delete announcement (admin)
GET  /api/admin/announcements/      # Get all announcements (admin)
```

### Database Schema

**Key Tables:**
- `user`: User accounts and profiles
- `team`: Team information and metadata
- `team_member`: Team membership relationships
- `project`: Project details and status
- `work_log`: Volunteer work hour logs
- `document`: Document metadata and links
- `document_team_access`: Document-team access control
- `announcement`: System announcements

**Relationships:**
- Users can belong to multiple teams
- Projects can be individual or team-based
- Work logs are linked to projects and users
- Documents can be shared with multiple teams
- Announcements are created by admins

### Security Features

**Authentication:**
- Session-based authentication
- Password hashing with Werkzeug
- Secure session management
- Role-based access control

**Authorization:**
- Admin-only endpoints protected
- User-specific data access control
- Team-based document access
- Project ownership validation

**Data Validation:**
- Input sanitization and validation
- SQL injection prevention
- XSS protection
- CSRF protection (recommended for production)

### Performance Considerations

**Database Optimization:**
- Indexed foreign keys for faster queries
- Efficient relationship loading
- Query optimization for large datasets
- Database connection pooling

**Frontend Optimization:**
- Component-based architecture
- Efficient state management
- Lazy loading for large lists
- Responsive design for mobile devices

**Scalability:**
- Modular code structure
- Separation of concerns
- Easy horizontal scaling
- Database migration support

## 🐛 Troubleshooting

### Common Issues

**Database Issues:**
```bash
# Database locked error
rm volunteer_system.db instance/volunteer_system.db
python app.py

# Migration issues
python reset_db.py
```

**Frontend Issues:**
```bash
# Clear npm cache
npm cache clean --force
rm -rf node_modules package-lock.json
npm install

# Port conflicts
# Change port in package.json or kill process on port 3000
```

**Backend Issues:**
```bash
# Module not found errors
pip install -r requirements.txt

# Port 5000 in use
# Change port in app.py or kill process on port 5000
```

### Error Messages

**"User not found"**: Check login credentials or register new account
**"Access denied"**: Verify user role and permissions
**"Database error"**: Check database connection and file permissions
**"Network error"**: Verify backend server is running on port 5000

### Performance Issues

**Slow loading**: Check database size and consider optimization
**Memory usage**: Monitor for memory leaks in long-running sessions
**Network timeouts**: Verify stable internet connection for API calls

### Getting Help

1. **Check Logs**: Review browser console and server logs
2. **Database State**: Verify data integrity and relationships
3. **Network**: Check API endpoint responses
4. **Documentation**: Review this README and code comments
5. **Community**: Reach out to the development team

## 🤝 Contributing

### Development Setup

```bash
# Fork and clone the repository
git clone <your-fork-url>
cd volunteer-management-system

# Create development branch
git checkout -b feature/your-feature-name

# Set up development environment
pip install -r requirements.txt
cd frontend && npm install

# Make your changes
# Test thoroughly
# Commit and push
git add .
git commit -m "Add: your feature description"
git push origin feature/your-feature-name

# Create pull request
```

### Code Standards

**Python (Backend):**
- Follow PEP 8 style guidelines
- Use meaningful variable and function names
- Add docstrings for functions and classes
- Handle errors gracefully
- Write unit tests for new features

**JavaScript (Frontend):**
- Use modern ES6+ syntax
- Follow React best practices
- Use meaningful component and variable names
- Handle errors and loading states
- Maintain responsive design

**Database:**
- Use proper foreign key relationships
- Add appropriate indexes
- Validate data integrity
- Document schema changes

### Feature Requests

When requesting new features:
1. **Describe the problem** the feature would solve
2. **Explain the proposed solution** in detail
3. **Consider the impact** on existing functionality
4. **Provide mockups** or examples if applicable
5. **Discuss implementation** approach

### Bug Reports

When reporting bugs:
1. **Describe the issue** clearly and concisely
2. **Provide steps to reproduce** the problem
3. **Include error messages** and screenshots
4. **Specify environment** (browser, OS, versions)
5. **Suggest potential fixes** if possible

---

## 📞 Support & Contact

**For Technical Issues:**
- Create an issue in the repository
- Include detailed error information
- Provide steps to reproduce

**For Feature Requests:**
- Submit a detailed feature request
- Explain the business value
- Provide implementation suggestions

**For General Questions:**
- Check this documentation first
- Review existing issues and discussions
- Contact the development team

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Akshar Paaul NGO** for the opportunity to build this system
- **Volunteer Community** for feedback and testing
- **Open Source Libraries** that made this project possible
- **Development Team** for their dedication and hard work

---

**Built with ❤️ for the Akshar Paaul community**

*Last updated: December 2024*