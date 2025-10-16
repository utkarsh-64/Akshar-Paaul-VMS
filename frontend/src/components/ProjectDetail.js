import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const ProjectDetail = ({ project, onClose, onUpdate }) => {
  const { user } = useAuth();
  const [updates, setUpdates] = useState([]);
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [updateForm, setUpdateForm] = useState({
    title: '',
    description: ''
  });

  useEffect(() => {
    fetchUpdates();
  }, [project.id]);

  const fetchUpdates = async () => {
    try {
      const response = await axios.get(`/api/projects/${project.id}/updates/`);
      setUpdates(response.data.updates);
    } catch (error) {
      console.error('Error fetching updates:', error);
    }
  };

  const handleAddUpdate = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`/api/projects/${project.id}/updates/create/`, updateForm);
      setUpdateForm({ title: '', description: '' });
      setShowUpdateForm(false);
      fetchUpdates();
    } catch (error) {
      console.error('Error adding update:', error);
    }
  };

  const handleProjectAction = async (action) => {
    try {
      let endpoint = '';
      switch (action) {
        case 'submit':
          endpoint = `/api/projects/${project.id}/submit/`;
          break;
        case 'approve':
          endpoint = `/api/projects/${project.id}/approve/`;
          break;
        case 'reject':
          endpoint = `/api/projects/${project.id}/approve/`;
          break;
        case 'start':
          endpoint = `/api/projects/${project.id}/start/`;
          break;
        case 'complete':
          endpoint = `/api/projects/${project.id}/complete/`;
          break;
        default:
          return;
      }

      const payload = action === 'approve' ? { action: 'approve' } : 
                     action === 'reject' ? { action: 'reject' } : {};

      await axios.post(endpoint, payload);
      onUpdate(); // Refresh the projects list
      alert(`Project ${action}d successfully!`);
    } catch (error) {
      console.error(`Error ${action}ing project:`, error);
      alert(`Error ${action}ing project: ${error.response?.data?.error || 'Unknown error'}`);
    }
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

  const canAddUpdate = () => {
    return user?.role === 'volunteer' && 
           (project.status === 'approved' || project.status === 'in_progress') &&
           (user.id === project.volunteer_id || user.username === project.volunteer);
  };

  const canSubmit = () => {
    return user?.role === 'volunteer' && project.status === 'draft' &&
           (user.id === project.volunteer_id || user.username === project.volunteer);
  };

  const canApprove = () => {
    return user?.role === 'admin' && project.status === 'submitted';
  };

  const canStart = () => {
    return user?.role === 'volunteer' && project.status === 'approved' &&
           (user.id === project.volunteer_id || user.username === project.volunteer);
  };

  const canComplete = () => {
    return user?.role === 'volunteer' && project.status === 'in_progress' &&
           (user.id === project.volunteer_id || user.username === project.volunteer);
  };

  return (
    <div style={{ 
      position: 'fixed', 
      top: 0, 
      left: 0, 
      right: 0, 
      bottom: 0, 
      backgroundColor: 'rgba(0,0,0,0.5)', 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center',
      zIndex: 1000
    }}>
      <div style={{ 
        backgroundColor: 'white', 
        padding: '20px', 
        borderRadius: '8px', 
        maxWidth: '800px', 
        maxHeight: '90vh', 
        overflow: 'auto',
        width: '90%'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2>{project.title}</h2>
          <button className="btn btn-danger" onClick={onClose}>×</button>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <p><strong>Description:</strong> {project.description}</p>
          <p><strong>Status:</strong> 
            <span style={{ 
              marginLeft: '10px',
              padding: '4px 8px', 
              borderRadius: '4px', 
              color: 'white',
              backgroundColor: getStatusColor(project.status),
              fontSize: '12px'
            }}>
              {project.status.replace('_', ' ').toUpperCase()}
            </span>
          </p>
          {user?.role === 'admin' && (
            <p><strong>Volunteer:</strong> {project.volunteer}</p>
          )}
          <p><strong>Created:</strong> {new Date(project.created_at).toLocaleDateString()}</p>
        </div>

        {/* Action Buttons */}
        <div style={{ marginBottom: '20px' }}>
          {canSubmit() && (
            <button 
              className="btn btn-primary" 
              onClick={() => handleProjectAction('submit')}
            >
              Submit for Review
            </button>
          )}
          
          {canApprove() && (
            <>
              <button 
                className="btn btn-success" 
                onClick={() => handleProjectAction('approve')}
              >
                Approve Project
              </button>
              <button 
                className="btn btn-danger" 
                onClick={() => handleProjectAction('reject')}
              >
                Reject Project
              </button>
            </>
          )}
          
          {canStart() && (
            <button 
              className="btn btn-success" 
              onClick={() => handleProjectAction('start')}
            >
              Start Project
            </button>
          )}
          
          {canComplete() && (
            <button 
              className="btn btn-success" 
              onClick={() => handleProjectAction('complete')}
            >
              Mark as Complete
            </button>
          )}
        </div>

        {/* Updates Section */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h3>Project Updates</h3>
            {canAddUpdate() && (
              <button 
                className="btn btn-primary"
                onClick={() => setShowUpdateForm(!showUpdateForm)}
              >
                {showUpdateForm ? 'Cancel' : 'Add Update'}
              </button>
            )}
          </div>

          {showUpdateForm && (
            <div className="card" style={{ marginBottom: '20px' }}>
              <h4>Add Project Update</h4>
              <form onSubmit={handleAddUpdate}>
                <div className="form-group">
                  <label>Update Title:</label>
                  <input
                    type="text"
                    value={updateForm.title}
                    onChange={(e) => setUpdateForm({...updateForm, title: e.target.value})}
                    placeholder="e.g., Frontend Development Completed"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>Description:</label>
                  <textarea
                    rows="3"
                    value={updateForm.description}
                    onChange={(e) => setUpdateForm({...updateForm, description: e.target.value})}
                    placeholder="Describe what was accomplished, current progress, next steps, etc."
                    required
                  />
                </div>
                
                <button type="submit" className="btn btn-success">Add Update</button>
              </form>
            </div>
          )}

          <div style={{ maxHeight: '300px', overflow: 'auto' }}>
            {updates.length > 0 ? (
              updates.map(update => (
                <div key={update.id} className="card" style={{ marginBottom: '10px' }}>
                  <h4>{update.title}</h4>
                  <p>{update.description}</p>
                  <small style={{ color: '#666' }}>
                    By {update.created_by} on {new Date(update.created_at).toLocaleDateString()}
                  </small>
                </div>
              ))
            ) : (
              <p style={{ color: '#666', fontStyle: 'italic' }}>No updates yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetail;