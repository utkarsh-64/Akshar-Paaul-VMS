import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLocation } from 'react-router-dom';
import { useNotification } from '../context/NotificationContext';
import { useLoading } from '../context/LoadingContext';
import ProjectDetail from './ProjectDetail';
import ConfirmDialog from './ConfirmDialog';
import { handleApiError, validateForm } from '../utils/errorHandler';
import axios from 'axios';

const Projects = () => {
  const { user } = useAuth();
  const location = useLocation();
  const { showSuccess, showError, showWarning } = useNotification();
  const { setLoading, isLoading } = useLoading();
  const [projects, setProjects] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    is_team_project: false,
    team_id: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [viewMode, setViewMode] = useState('all'); // 'all', 'team', 'unassigned'
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null
  });

  useEffect(() => {
    fetchProjects();
    fetchTeams();
    
    // Check URL parameters for team filtering
    if (user?.role === 'admin') {
      const urlParams = new URLSearchParams(location.search);
      const teamParam = urlParams.get('team');
      const filterParam = urlParams.get('filter');
      
      if (teamParam) {
        const teamId = parseInt(teamParam);
        setViewMode('team');
        // Find team details after teams are loaded
        fetchTeams().then((teamsList) => {
          const team = teamsList.find(t => t.id === teamId);
          if (team) {
            setSelectedTeam(team);
          }
        });
      } else if (filterParam === 'unassigned') {
        setViewMode('unassigned');
      }
    }
  }, [location.search, user]);

  useEffect(() => {
    if (viewMode === 'unassigned' || viewMode === 'all') {
      fetchProjects();
    } else if (viewMode === 'team' && selectedTeam) {
      fetchTeamProjects(selectedTeam.id);
    }
  }, [viewMode, selectedTeam]);

  const fetchTeams = async () => {
    try {
      const response = await axios.get('/api/teams/');
      setTeams(response.data.teams);
      return response.data.teams;
    } catch (error) {
      console.error('Error fetching teams:', error);
      return [];
    }
  };

  const fetchProjects = async () => {
    try {
      let endpoint = '/api/projects/';
      
      // Use different endpoint for unassigned volunteers
      if (user?.role === 'admin' && viewMode === 'unassigned') {
        endpoint = '/api/admin/unassigned/projects/';
      }
      
      const response = await axios.get(endpoint);
      const allProjects = response.data.projects;
      
      // If user is a volunteer, also fetch team projects
      if (user?.role === 'volunteer') {
        try {
          const teamsResponse = await axios.get('/api/teams/');
          const userTeams = teamsResponse.data.teams;
          
          // Fetch projects from all user's teams
          const teamProjects = [];
          for (const team of userTeams) {
            try {
              const teamProjectsResponse = await axios.get(`/api/teams/${team.id}/projects/`);
              teamProjects.push(...teamProjectsResponse.data.projects);
            } catch (error) {
              console.error(`Error fetching projects for team ${team.id}:`, error);
            }
          }
          
          // Combine and deduplicate projects
          const combinedProjects = [...allProjects];
          teamProjects.forEach(teamProject => {
            if (!combinedProjects.find(p => p.id === teamProject.id)) {
              combinedProjects.push({...teamProject, isTeamProject: true});
            }
          });
          
          setProjects(combinedProjects);
        } catch (error) {
          console.error('Error fetching team projects:', error);
          setProjects(allProjects);
        }
      } else {
        setProjects(allProjects);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const fetchTeamProjects = async (teamId) => {
    try {
      const response = await axios.get(`/api/teams/${teamId}/projects/`);
      setProjects(response.data.projects);
    } catch (error) {
      console.error('Error fetching team projects:', error);
      setProjects([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    const validation = validateForm(formData, {
      title: { 
        required: true, 
        minLength: 3, 
        maxLength: 200, 
        label: 'Project Title' 
      },
      description: { 
        required: true, 
        minLength: 10, 
        maxLength: 1000, 
        label: 'Description' 
      },
      team_id: {
        required: formData.is_team_project,
        label: 'Team',
        custom: (value, data) => {
          if (data.is_team_project && !value) {
            return 'Please select a team for team projects';
          }
          return null;
        }
      }
    });
    
    if (!validation.isValid) {
      setFormErrors(validation.errors);
      showError('Please fix the form errors before submitting');
      return;
    }
    
    setFormErrors({});
    setLoading('createProject', true);
    
    try {
      const projectData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        is_team_project: formData.is_team_project,
        team_id: formData.is_team_project ? formData.team_id : null
      };
      
      await axios.post('/api/projects/create/', projectData);
      
      setFormData({ title: '', description: '', is_team_project: false, team_id: '' });
      setShowForm(false);
      fetchProjects();
      
      const successMessage = formData.is_team_project 
        ? 'Team project created successfully!' 
        : 'Project created successfully!';
      showSuccess(successMessage);
      
    } catch (error) {
      handleApiError(error, showError, 'Failed to create project');
    } finally {
      setLoading('createProject', false);
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

  const getStatusDescription = (status) => {
    const descriptions = {
      'draft': 'Project created but not yet submitted for review',
      'submitted': 'Project submitted and awaiting admin approval',
      'approved': 'Project approved and ready to start',
      'rejected': 'Project rejected by admin',
      'in_progress': 'Project is currently being worked on',
      'completed': 'Project has been completed'
    };
    return descriptions[status] || status;
  };

  const handleDeleteProject = (project) => {
    const confirmMessage = `Are you sure you want to delete "${project.title}"?\n\n` +
      `This action cannot be undone and will permanently remove:\n` +
      `• The project and all its details\n` +
      `• All project updates\n` +
      `• Associated documents\n\n` +
      `${project.is_team_project ? 'Note: This is a team project. Make sure team members are aware of this deletion.' : ''}`;
    
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Project',
      message: confirmMessage,
      onConfirm: () => confirmDeleteProject(project),
      onCancel: () => setConfirmDialog({ ...confirmDialog, isOpen: false })
    });
  };

  const handleProjectApproval = async (projectId, action) => {
    try {
      setLoading('projectApproval', true);
      
      const response = await axios.post(`/api/projects/${projectId}/approve/`, {
        action: action
      });
      
      if (response.data.success) {
        showSuccess(`Project ${action}d successfully!`);
        fetchProjects(); // Refresh the projects list
      }
    } catch (error) {
      console.error(`Error ${action}ing project:`, error);
      showError(`Error ${action}ing project: ${error.response?.data?.error || 'Unknown error'}`);
    } finally {
      setLoading('projectApproval', false);
    }
  };

  const confirmDeleteProject = async (project) => {
    setConfirmDialog({ ...confirmDialog, isOpen: false });
    setLoading('deleteProject', true);

    try {
      const response = await axios.delete(`/api/projects/${project.id}/delete/`);
      
      if (response.data.success) {
        showSuccess(response.data.message);
        fetchProjects(); // Refresh the project list
      }
    } catch (error) {
      handleApiError(error, showError, 'Failed to delete project');
    } finally {
      setLoading('deleteProject', false);
    }
  };

  const canDeleteProject = (project) => {
    // Only the project creator can delete their own projects
    return user?.role === 'volunteer' && project.volunteer === user.username;
  };

  // Don't redirect to TeamProjects, handle team view in this component

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <h1>
            Projects
            {viewMode === 'team' && selectedTeam && (
              <span style={{ fontSize: '18px', color: '#666', fontWeight: 'normal' }}>
                {' '}- {selectedTeam.name}
              </span>
            )}
            {viewMode === 'unassigned' && (
              <span style={{ fontSize: '18px', color: '#666', fontWeight: 'normal' }}>
                {' '}- Unassigned Volunteers
              </span>
            )}
          </h1>
          {(viewMode === 'team' || viewMode === 'unassigned') && (
            <button 
              className="btn btn-secondary"
              onClick={() => {
                setViewMode('all');
                setSelectedTeam(null);
              }}
              style={{ fontSize: '12px', padding: '6px 12px' }}
            >
              ← Back to All
            </button>
          )}
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {user?.role === 'admin' && (
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <select 
                value={viewMode} 
                onChange={(e) => {
                  setViewMode(e.target.value);
                  if (e.target.value === 'all') {
                    setSelectedTeam(null);
                    fetchProjects();
                  }
                }}
                style={{ fontSize: '14px', padding: '6px 10px' }}
              >
                <option value="all">All Projects</option>
                <option value="team">By Team</option>
                <option value="unassigned">Unassigned Volunteers</option>
              </select>
              
              {viewMode === 'team' && (
                <select 
                  value={selectedTeam?.id || ''} 
                  onChange={(e) => {
                    const teamId = parseInt(e.target.value);
                    const team = teams.find(t => t.id === teamId);
                    setSelectedTeam(team);
                    if (team) {
                      fetchTeamProjects(team.id);
                    } else {
                      setProjects([]);
                    }
                  }}
                  style={{ fontSize: '14px', padding: '6px 10px' }}
                >
                  <option value="">Select Team</option>
                  {teams.map(team => (
                    <option key={team.id} value={team.id}>
                      {team.name} ({team.member_count} members)
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}
          
          {user?.role === 'volunteer' && (
            <button 
              className="btn btn-primary"
              onClick={() => setShowForm(!showForm)}
            >
              {showForm ? 'Cancel' : 'Create Project'}
            </button>
          )}
        </div>
      </div>

      {showForm && (
        <div className="card">
          <h3>Create New Project</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Project Title:</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => {
                  setFormData({...formData, title: e.target.value});
                  if (formErrors.title) {
                    setFormErrors({...formErrors, title: null});
                  }
                }}
                placeholder="e.g., Community Garden Initiative"
                style={{ 
                  borderColor: formErrors.title ? '#dc3545' : undefined 
                }}
                required
              />
              {formErrors.title && (
                <small style={{ color: '#dc3545', fontSize: '12px', display: 'block', marginTop: '4px' }}>
                  {formErrors.title}
                </small>
              )}
            </div>
            
            <div className="form-group">
              <label>Description:</label>
              <textarea
                rows="4"
                value={formData.description}
                onChange={(e) => {
                  setFormData({...formData, description: e.target.value});
                  if (formErrors.description) {
                    setFormErrors({...formErrors, description: null});
                  }
                }}
                placeholder="Describe your project goals, target audience, expected outcomes, etc."
                style={{ 
                  borderColor: formErrors.description ? '#dc3545' : undefined 
                }}
                required
              />
              {formErrors.description && (
                <small style={{ color: '#dc3545', fontSize: '12px', display: 'block', marginTop: '4px' }}>
                  {formErrors.description}
                </small>
              )}
            </div>
            
            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  checked={formData.is_team_project}
                  onChange={(e) => setFormData({...formData, is_team_project: e.target.checked})}
                />
                {' '}This is a team project
              </label>
            </div>
            
            {formData.is_team_project && (
              <div className="form-group">
                <label>Select Team:</label>
                <select
                  value={formData.team_id}
                  onChange={(e) => {
                    setFormData({...formData, team_id: e.target.value});
                    if (formErrors.team_id) {
                      setFormErrors({...formErrors, team_id: null});
                    }
                  }}
                  style={{ 
                    borderColor: formErrors.team_id ? '#dc3545' : undefined 
                  }}
                  required={formData.is_team_project}
                >
                  <option value="">Select a team</option>
                  {teams.map(team => (
                    <option key={team.id} value={team.id}>
                      {team.name} ({team.member_count} members)
                    </option>
                  ))}
                </select>
                {formErrors.team_id && (
                  <small style={{ color: '#dc3545', fontSize: '12px', display: 'block', marginTop: '4px' }}>
                    {formErrors.team_id}
                  </small>
                )}
                <small style={{ color: '#666', fontSize: '12px' }}>
                  Don't see your team? <button 
                    type="button" 
                    style={{ background: 'none', border: 'none', color: '#007bff', textDecoration: 'underline', cursor: 'pointer' }}
                    onClick={() => window.open('/teams', '_blank')}
                  >
                    Create a new team
                  </button>
                </small>
              </div>
            )}
            
            <button 
              type="submit" 
              className="btn btn-success"
              disabled={isLoading('createProject')}
            >
              {isLoading('createProject') ? 'Creating...' : 'Create Project'}
            </button>
          </form>
        </div>
      )}

      <div style={{ display: 'grid', gap: '20px' }}>
        {projects.map(project => (
          <div key={project.id} className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
              <div style={{ flex: 1 }}>
                <h3>{project.title}</h3>
                <p>{project.description}</p>
                {user?.role === 'admin' && (
                  <p><strong>Volunteer:</strong> {project.volunteer}</p>
                )}
                <p><strong>Created:</strong> {new Date(project.created_at).toLocaleDateString()}</p>
                {(project.is_team_project || project.team_name) && (
                  <p style={{ fontSize: '14px', color: '#2563eb', fontWeight: '600' }}>
                    👥 Team Project {project.team_name ? `(${project.team_name})` : ''}
                  </p>
                )}
                <p style={{ fontSize: '14px', color: '#666' }}>
                  <strong>Status:</strong> {getStatusDescription(project.status)}
                </p>
              </div>
              <div>
                <span 
                  style={{ 
                    padding: '4px 8px', 
                    borderRadius: '4px', 
                    color: 'white',
                    backgroundColor: getStatusColor(project.status),
                    fontSize: '12px'
                  }}
                >
                  {project.status.replace('_', ' ').toUpperCase()}
                </span>
              </div>
            </div>
            
            <div style={{ marginTop: '15px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button 
                className="btn btn-primary"
                onClick={() => setSelectedProject(project)}
              >
                View Details & Updates
              </button>
              
              {/* Quick action buttons */}
              {user?.role === 'volunteer' && project.status === 'draft' && (
                <button 
                  className="btn btn-success"
                  onClick={() => setSelectedProject(project)}
                >
                  Submit for Review
                </button>
              )}
              
              {user?.role === 'volunteer' && project.status === 'approved' && (
                <button 
                  className="btn btn-success"
                  onClick={() => setSelectedProject(project)}
                >
                  Start Project
                </button>
              )}
              
              {user?.role === 'admin' && project.status === 'submitted' && (
                <>
                  <button 
                    className="btn btn-success"
                    onClick={() => handleProjectApproval(project.id, 'approve')}
                    style={{ fontSize: '12px' }}
                  >
                    ✅ Approve
                  </button>
                  <button 
                    className="btn btn-danger"
                    onClick={() => handleProjectApproval(project.id, 'reject')}
                    style={{ fontSize: '12px' }}
                  >
                    ❌ Reject
                  </button>
                  <button 
                    className="btn btn-primary"
                    onClick={() => setSelectedProject(project)}
                    style={{ fontSize: '12px' }}
                  >
                    👁️ Details
                  </button>
                </>
              )}
              
              {/* Delete button for project creators */}
              {canDeleteProject(project) && (
                <button 
                  className="btn"
                  onClick={() => handleDeleteProject(project)}
                  disabled={isLoading('deleteProject')}
                  style={{ 
                    backgroundColor: '#dc3545',
                    color: 'white',
                    border: '1px solid #dc3545',
                    opacity: isLoading('deleteProject') ? 0.6 : 1
                  }}
                  onMouseOver={(e) => {
                    if (!isLoading('deleteProject')) {
                      e.target.style.backgroundColor = '#c82333';
                      e.target.style.borderColor = '#bd2130';
                    }
                  }}
                  onMouseOut={(e) => {
                    if (!isLoading('deleteProject')) {
                      e.target.style.backgroundColor = '#dc3545';
                      e.target.style.borderColor = '#dc3545';
                    }
                  }}
                >
                  {isLoading('deleteProject') ? '⏳ Deleting...' : '🗑️ Delete Project'}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {selectedProject && (
        <ProjectDetail 
          project={selectedProject}
          onClose={() => setSelectedProject(null)}
          onUpdate={() => {
            fetchProjects();
            setSelectedProject(null);
          }}
        />
      )}
      
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText="Delete"
        cancelText="Cancel"
        confirmButtonStyle="danger"
        onConfirm={confirmDialog.onConfirm}
        onCancel={confirmDialog.onCancel}
      />
    </div>
  );
};

export default Projects;