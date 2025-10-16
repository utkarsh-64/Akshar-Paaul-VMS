import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const TeamProjects = ({ teamId, teamName }) => {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sortBy, setSortBy] = useState('created_at');
  const [filterStatus, setFilterStatus] = useState('all');
  const [teamStats, setTeamStats] = useState({});

  useEffect(() => {
    if (teamId) {
      fetchTeamProjects();
      fetchTeamStats();
    }
  }, [teamId]);

  const fetchTeamProjects = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/admin/teams/${teamId}/projects/`);
      setProjects(response.data.projects);
    } catch (error) {
      console.error('Error fetching team projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeamStats = async () => {
    try {
      const response = await axios.get(`/api/teams/${teamId}/stats/`);
      setTeamStats(response.data);
    } catch (error) {
      console.error('Error fetching team stats:', error);
    }
  };

  const handleProjectApproval = async (projectId, action) => {
    const confirmMessage = `Are you sure you want to ${action} this project?`;
    if (!window.confirm(confirmMessage)) {
      return;
    }

    setLoading(true);
    try {
      await axios.post(`/api/projects/${projectId}/approve/`, {
        action: action
      });
      
      fetchTeamProjects();
      fetchTeamStats();
    } catch (error) {
      console.error('Error updating project:', error);
      alert('Error processing project approval');
    } finally {
      setLoading(false);
    }
  };

  const getFilteredProjects = () => {
    let filtered = [...projects];

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(project => project.status === filterStatus);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'created_at':
          return new Date(b.created_at) - new Date(a.created_at);
        case 'title':
          return a.title.localeCompare(b.title);
        case 'volunteer':
          return a.volunteer.localeCompare(b.volunteer);
        case 'status':
          return a.status.localeCompare(b.status);
        default:
          return 0;
      }
    });

    return filtered;
  };

  const getStatusColor = (status) => {
    const colors = {
      'draft': '#6c757d',
      'submitted': '#ffc107',
      'approved': '#28a745',
      'rejected': '#dc3545',
      'in_progress': '#007bff',
      'completed': '#28a745'
    };
    return colors[status] || '#6c757d';
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

  const filteredProjects = getFilteredProjects();
  const pendingProjects = projects.filter(project => project.status === 'submitted');

  if (user?.role !== 'admin') {
    return <div>Access denied. Admin privileges required.</div>;
  }

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Projects - {teamName}</h2>
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          <span style={{ 
            padding: '6px 12px', 
            borderRadius: '15px', 
            backgroundColor: pendingProjects.length > 0 ? '#fff3cd' : '#d4edda',
            color: pendingProjects.length > 0 ? '#856404' : '#155724',
            fontSize: '12px',
            fontWeight: '600'
          }}>
            {pendingProjects.length} Pending Approval
          </span>
        </div>
      </div>

      {/* Team Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '20px' }}>
        <div className="card" style={{ padding: '15px', textAlign: 'center' }}>
          <div style={{ fontSize: '24px', fontWeight: '600', color: '#2c3e50' }}>
            {teamStats.total_projects || 0}
          </div>
          <div style={{ fontSize: '12px', color: '#7f8c8d' }}>Total Projects</div>
        </div>
        
        <div className="card" style={{ padding: '15px', textAlign: 'center' }}>
          <div style={{ fontSize: '24px', fontWeight: '600', color: '#27ae60' }}>
            {teamStats.active_projects || 0}
          </div>
          <div style={{ fontSize: '12px', color: '#7f8c8d' }}>Active Projects</div>
        </div>
        
        <div className="card" style={{ padding: '15px', textAlign: 'center' }}>
          <div style={{ fontSize: '24px', fontWeight: '600', color: '#f39c12' }}>
            {pendingProjects.length}
          </div>
          <div style={{ fontSize: '12px', color: '#7f8c8d' }}>Pending Approval</div>
        </div>
        
        <div className="card" style={{ padding: '15px', textAlign: 'center' }}>
          <div style={{ fontSize: '24px', fontWeight: '600', color: '#3498db' }}>
            {teamStats.member_count || 0}
          </div>
          <div style={{ fontSize: '12px', color: '#7f8c8d' }}>Team Members</div>
        </div>
      </div>

      {/* Filters and Controls */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
          <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
            <div>
              <label style={{ fontSize: '12px', color: '#666', marginRight: '5px' }}>Filter:</label>
              <select 
                value={filterStatus} 
                onChange={(e) => setFilterStatus(e.target.value)}
                style={{ fontSize: '12px', padding: '4px 8px' }}
              >
                <option value="all">All Status</option>
                <option value="draft">Draft</option>
                <option value="submitted">Submitted</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            
            <div>
              <label style={{ fontSize: '12px', color: '#666', marginRight: '5px' }}>Sort by:</label>
              <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value)}
                style={{ fontSize: '12px', padding: '4px 8px' }}
              >
                <option value="created_at">Date Created</option>
                <option value="title">Project Title</option>
                <option value="volunteer">Volunteer</option>
                <option value="status">Status</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Projects List */}
      <div className="card">
        {loading && (
          <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
            Loading projects...
          </div>
        )}
        
        {!loading && filteredProjects.length === 0 && (
          <div style={{ 
            textAlign: 'center', 
            padding: '40px 20px', 
            color: '#95a5a6',
            fontStyle: 'italic'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '10px' }}>🚀</div>
            <div>No projects found</div>
            <small>Team projects will appear here</small>
          </div>
        )}

        {!loading && filteredProjects.length > 0 && (
          <div style={{ maxHeight: '600px', overflow: 'auto' }}>
            {filteredProjects.map(project => (
              <div 
                key={project.id} 
                style={{ 
                  padding: '20px', 
                  borderBottom: '1px solid #eee'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '15px' }}>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ margin: '0 0 8px 0', color: '#2c3e50' }}>
                      {project.title}
                    </h3>
                    
                    <div style={{ display: 'flex', gap: '20px', marginBottom: '10px', fontSize: '14px', color: '#7f8c8d' }}>
                      <div>
                        <strong>Volunteer:</strong> {project.volunteer_details?.full_name || project.volunteer}
                      </div>
                      <div>
                        <strong>Created:</strong> {new Date(project.created_at).toLocaleDateString()}
                      </div>
                      {project.is_team_project && (
                        <div style={{ color: '#667eea', fontWeight: '600' }}>
                          👥 Team Project
                        </div>
                      )}
                    </div>
                    
                    <p style={{ margin: '10px 0', fontSize: '14px', color: '#34495e', lineHeight: '1.5' }}>
                      {project.description}
                    </p>
                    
                    <div style={{ fontSize: '12px', color: '#95a5a6' }}>
                      {getStatusDescription(project.status)}
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'end', gap: '10px' }}>
                    <span 
                      style={{ 
                        padding: '6px 12px', 
                        borderRadius: '15px', 
                        color: 'white',
                        backgroundColor: getStatusColor(project.status),
                        fontSize: '11px',
                        fontWeight: '600'
                      }}
                    >
                      {project.status.replace('_', ' ').toUpperCase()}
                    </span>
                    
                    {project.status === 'submitted' && (
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button 
                          className="btn btn-success"
                          onClick={() => handleProjectApproval(project.id, 'approve')}
                          disabled={loading}
                          style={{ fontSize: '12px', padding: '6px 12px' }}
                        >
                          ✓ Approve
                        </button>
                        <button 
                          className="btn"
                          onClick={() => handleProjectApproval(project.id, 'reject')}
                          disabled={loading}
                          style={{ 
                            fontSize: '12px', 
                            padding: '6px 12px',
                            backgroundColor: '#dc3545',
                            color: 'white',
                            border: '1px solid #dc3545'
                          }}
                        >
                          ✗ Reject
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Project dates if available */}
                {(project.start_date || project.end_date) && (
                  <div style={{ 
                    padding: '10px', 
                    backgroundColor: '#f8f9fa', 
                    borderRadius: '4px',
                    fontSize: '12px',
                    color: '#666'
                  }}>
                    {project.start_date && (
                      <span style={{ marginRight: '15px' }}>
                        <strong>Started:</strong> {new Date(project.start_date).toLocaleDateString()}
                      </span>
                    )}
                    {project.end_date && (
                      <span>
                        <strong>End Date:</strong> {new Date(project.end_date).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TeamProjects;