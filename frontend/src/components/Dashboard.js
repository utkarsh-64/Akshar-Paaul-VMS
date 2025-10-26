import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';


const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalHours: 0,
    pendingLogs: 0,
    activeProjects: 0,
    documents: 0
  });
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch work logs to calculate stats
      const logsResponse = await axios.get('/api/volunteers/work-logs/');
      const logs = logsResponse.data.work_logs;
      
      const totalHours = logs.reduce((sum, log) => sum + log.hours_worked, 0);
      const pendingLogs = logs.filter(log => log.status === 'pending').length;
      
      // Fetch projects
      const projectsResponse = await axios.get('/api/projects/');
      const allProjects = projectsResponse.data.projects;
      setProjects(allProjects);
      
      const activeProjects = allProjects.filter(p => 
        p.status === 'in_progress' || p.status === 'approved'
      ).length;
      
      // Fetch documents
      const docsResponse = await axios.get('/api/volunteers/documents/');
      const documents = docsResponse.data.documents.length;
      
      setStats({
        totalHours,
        pendingLogs,
        activeProjects,
        documents
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  const handleProjectAction = async (projectId, action) => {
    try {
      let endpoint = '';
      switch (action) {
        case 'start':
          endpoint = `/api/projects/${projectId}/start/`;
          break;
        case 'complete':
          endpoint = `/api/projects/${projectId}/complete/`;
          break;
        default:
          return;
      }

      await axios.post(endpoint);
      fetchDashboardData(); // Refresh data
      alert(`Project ${action}d successfully!`);
    } catch (error) {
      console.error(`Error ${action}ing project:`, error);
      alert(`Error ${action}ing project: ${error.response?.data?.error || 'Unknown error'}`);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'draft': '#64748b',
      'submitted': '#d97706',
      'approved': '#059669',
      'rejected': '#dc2626',
      'in_progress': '#2563eb',
      'completed': '#059669'
    };
    return colors[status] || '#64748b';
  };

  return (
    <>

      <div className="container fade-in">
      {/* Hero Section */}
      <div className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">Welcome back, {user?.username}!</h1>
          <p className="hero-subtitle">
            {user?.role === 'volunteer' ? 
              'Every hour you contribute creates lasting change in our community. Your dedication inspires others and builds a better tomorrow.' : 
              'Empower volunteers, track impact, and build stronger communities together. Support those who are making a difference.'
            }
          </p>
          <div className="hero-cta">
            {user?.role === 'volunteer' ? (
              <>
                <button className="btn btn-volunteer" onClick={() => navigate('/work-logs')}>
                  ⏱️ Log Your Impact
                </button>
                <button className="btn btn-impact" onClick={() => navigate('/projects')}>
                  🚀 Start a Project
                </button>
              </>
            ) : (
              <>
                <button className="btn btn-volunteer" onClick={() => navigate('/work-logs')}>
                  📊 Review Contributions
                </button>
                <button className="btn btn-impact" onClick={() => navigate('/projects')}>
                  ✅ Support Projects
                </button>
              </>
            )}
          </div>
        </div>
      </div>
      
      {/* Impact Stats Section */}
      <div className="volunteer-grid">
        <div className="impact-card slide-up">
          <div className="impact-icon">⏱️</div>
          <div className="impact-number">{stats.totalHours}</div>
          <div className="impact-label">Hours Contributed</div>
          <div className="impact-description">Making a difference in the community</div>
        </div>
        
        <div className="impact-card slide-up" style={{ animationDelay: '0.1s' }}>
          <div className="impact-icon">⏳</div>
          <div className="impact-number">{stats.pendingLogs}</div>
          <div className="impact-label">Pending Reviews</div>
          <div className="impact-description">
            {stats.pendingLogs > 0 ? 'Awaiting approval' : 'All caught up!'}
          </div>
        </div>
        
        <div className="impact-card slide-up" style={{ animationDelay: '0.2s' }}>
          <div className="impact-icon">🎯</div>
          <div className="impact-number">{stats.activeProjects}</div>
          <div className="impact-label">Active Projects</div>
          <div className="impact-description">Driving positive change</div>
        </div>
        
        <div className="impact-card slide-up" style={{ animationDelay: '0.3s' }}>
          <div className="impact-icon">📚</div>
          <div className="impact-number">{stats.documents}</div>
          <div className="impact-label">Resources Shared</div>
          <div className="impact-description">Knowledge for everyone</div>
        </div>
      </div>
      
      {user?.role === 'volunteer' && (
        <>
          {/* Volunteer Actions */}
          <div className="volunteer-card">
            <h3 style={{ color: 'var(--text-primary)', marginBottom: '20px', fontSize: '1.25rem' }}>
              🚀 Take Action Today
            </h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>
              Choose how you want to contribute to your community
            </p>
            <div className="volunteer-grid">
              <div className="volunteer-action-card" onClick={() => navigate('/work-logs')}>
                <div className="action-icon">⏱️</div>
                <div className="action-title">Log Work Hours</div>
                <div className="action-description">Track your volunteer time and impact</div>
              </div>
              
              <div className="volunteer-action-card" onClick={() => navigate('/projects')}>
                <div className="action-icon">🎯</div>
                <div className="action-title">Start a Project</div>
                <div className="action-description">Launch initiatives that matter</div>
              </div>
              
              <div className="volunteer-action-card" onClick={() => navigate('/documents')}>
                <div className="action-icon">📚</div>
                <div className="action-title">Share Resources</div>
                <div className="action-description">Upload helpful documents</div>
              </div>
              
              <div className="volunteer-action-card" onClick={() => navigate('/teams')}>
                <div className="action-icon">👥</div>
                <div className="action-title">Join Teams</div>
                <div className="action-description">Collaborate with other volunteers</div>
              </div>
            </div>
          </div>

          {/* My Projects Section */}
          <div className="card">
            <div className="content-card-header">
              <h3 className="content-card-title">🎯 My Projects</h3>
              <p className="content-card-subtitle">Track your ongoing work</p>
            </div>
            <div className="content-card-body">
              {projects.length > 0 ? (
                <div className="project-grid">
                  {projects.map(project => (
                    <div key={project.id} className="project-card">
                      <div className="project-card-content">
                        <div>
                          <h4 className="project-title">{project.title}</h4>
                          <p className="project-description">
                            {project.description.length > 120 
                              ? project.description.substring(0, 120) + '...' 
                              : project.description}
                          </p>
                        </div>
                        
                        <div className="project-meta">
                          <span 
                            className="project-status"
                            style={{ 
                              backgroundColor: getStatusColor(project.status),
                              color: 'white'
                            }}
                          >
                            {project.status.replace('_', ' ')}
                          </span>
                          <span className="project-date">
                            {new Date(project.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        
                        <div style={{ marginTop: '16px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          <button 
                            className="btn btn-primary"
                            onClick={() => navigate('/projects')}
                            style={{ fontSize: '11px', padding: '6px 12px' }}
                          >
                            View Details
                          </button>
                          
                          {project.status === 'approved' && (
                            <button 
                              className="btn btn-success"
                              onClick={() => handleProjectAction(project.id, 'start')}
                              style={{ fontSize: '11px', padding: '6px 12px' }}
                            >
                              Start
                            </button>
                          )}
                          
                          {project.status === 'in_progress' && (
                            <button 
                              className="btn btn-success"
                              onClick={() => handleProjectAction(project.id, 'complete')}
                              style={{ fontSize: '11px', padding: '6px 12px' }}
                            >
                              Complete
                            </button>
                          )}
                          
                          {project.status === 'draft' && (
                            <button 
                              className="btn btn-primary"
                              onClick={() => navigate('/projects')}
                              style={{ fontSize: '11px', padding: '6px 12px' }}
                            >
                              Submit
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎯</div>
                  <p style={{ color: '#94a3b8', marginBottom: '20px' }}>
                    No projects yet. Start your first project to make an impact!
                  </p>
                  <button 
                    className="btn btn-success" 
                    onClick={() => navigate('/projects')}
                  >
                    Create Your First Project
                  </button>
                </div>
              )}
            </div>
          </div>
        </>
      )}
      
      {user?.role === 'admin' && (
        <>
          {/* Admin Actions */}
          <div className="card">
            <div className="content-card-header">
              <h3 className="content-card-title">⚡ Admin Control Center</h3>
              <p className="content-card-subtitle">Manage your volunteer community</p>
            </div>
            <div className="content-card-body">
              <div className="action-grid">
                <button className="action-btn" onClick={() => navigate('/work-logs')}>
                  📊 Review Work Logs
                </button>
                <button className="action-btn" onClick={() => navigate('/projects')}>
                  ✅ Approve Projects
                </button>
                <button className="action-btn" onClick={() => navigate('/documents')}>
                  📁 Manage Documents
                </button>
                <button className="action-btn" onClick={() => navigate('/teams')}>
                  👥 Manage Teams
                </button>
              </div>
            </div>
          </div>

          {/* Admin Project Overview */}
          <div className="card">
            <div className="content-card-header">
              <h3 className="content-card-title">📈 Project Overview</h3>
              <p className="content-card-subtitle">Recent project activity</p>
            </div>
            <div className="content-card-body">
              {projects.length > 0 ? (
                <div className="project-grid">
                  {projects.slice(0, 6).map(project => (
                    <div key={project.id} className="project-card">
                      <div className="project-card-content">
                        <div>
                          <h4 className="project-title">{project.title}</h4>
                          <p className="project-description">
                            by {project.volunteer}
                          </p>
                        </div>
                        
                        <div className="project-meta">
                          <span 
                            className="project-status"
                            style={{ 
                              backgroundColor: getStatusColor(project.status),
                              color: 'white'
                            }}
                          >
                            {project.status.replace('_', ' ')}
                          </span>
                          <span className="project-date">
                            {new Date(project.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
                  <p style={{ color: '#94a3b8' }}>
                    No projects in the system yet. Volunteers will create projects soon!
                  </p>
                </div>
              )}
              
              {projects.length > 6 && (
                <div style={{ textAlign: 'center', marginTop: '24px' }}>
                  <button 
                    className="btn btn-primary"
                    onClick={() => navigate('/projects')}
                  >
                    View All Projects ({projects.length})
                  </button>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
    </>
  );
};

export default Dashboard;