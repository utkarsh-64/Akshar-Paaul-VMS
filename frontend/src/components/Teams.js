import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import TeamDetail from './TeamDetail';
import axios from 'axios';

const Teams = () => {
  const { user } = useAuth();
  const [teams, setTeams] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });
  const [selectedTeamForDetail, setSelectedTeamForDetail] = useState(null);

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    try {
      const response = await axios.get('/api/teams/');
      setTeams(response.data.teams);
    } catch (error) {
      console.error('Error fetching teams:', error);
    }
  };



  const handleCreateTeam = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/teams/create/', formData);
      setFormData({ name: '', description: '' });
      setShowCreateForm(false);
      fetchTeams();
      alert('Team created successfully!');
    } catch (error) {
      console.error('Error creating team:', error);
      alert('Error creating team');
    }
  };

  const handleJoinTeam = async (teamId) => {
    try {
      await axios.post(`/api/teams/${teamId}/join/`);
      fetchTeams();
      alert('Joined team successfully!');
    } catch (error) {
      console.error('Error joining team:', error);
      alert(error.response?.data?.error || 'Error joining team');
    }
  };

  const handleDeleteTeam = async (teamId, teamName) => {
    if (!window.confirm(`Are you sure you want to delete "${teamName}"? This action cannot be undone.`)) {
      return;
    }
    
    try {
      const endpoint = user?.role === 'admin' ? `/api/admin/teams/${teamId}/delete/` : `/api/teams/${teamId}/delete/`;
      await axios.delete(endpoint);
      fetchTeams();
      alert('Team deleted successfully!');
    } catch (error) {
      console.error('Error deleting team:', error);
      alert(error.response?.data?.error || 'Error deleting team');
    }
  };







  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Teams</h1>
        <button 
          className="btn btn-success"
          onClick={() => setShowCreateForm(!showCreateForm)}
        >
          {showCreateForm ? 'Cancel' : 'Create Team'}
        </button>
      </div>

      {showCreateForm && (
        <div className="card">
          <h3>Create New Team</h3>
          <form onSubmit={handleCreateTeam}>
            <div className="form-group">
              <label>Team Name:</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="e.g., Community Garden Team"
                required
              />
            </div>
            
            <div className="form-group">
              <label>Description:</label>
              <textarea
                rows="3"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Describe your team's purpose and goals"
              />
            </div>
            
            <button type="submit" className="btn btn-success">Create Team</button>
          </form>
        </div>
      )}



      <div style={{ display: 'grid', gap: '20px' }}>
        {teams.map(team => (
          <div key={team.id} className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
              <div style={{ flex: 1 }}>
                <h3 
                  style={{ 
                    cursor: 'pointer', 
                    color: '#007bff',
                    margin: '0 0 10px 0'
                  }}
                  onClick={() => setSelectedTeamForDetail(team)}
                >
                  {team.name}
                </h3>
                <p style={{ margin: '0 0 8px 0', color: '#666' }}>{team.description}</p>
                <div style={{ fontSize: '14px', color: '#888' }}>
                  <span><strong>Members:</strong> {team.member_count}</span>
                  <span style={{ marginLeft: '15px' }}>
                    <strong>Created:</strong> {new Date(team.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {user?.role === 'volunteer' && (
                  <button 
                    className="btn btn-success"
                    onClick={() => handleJoinTeam(team.id)}
                    style={{ fontSize: '14px' }}
                  >
                    Join Team
                  </button>
                )}
                {user?.role === 'admin' && (
                  <button 
                    className="btn"
                    onClick={() => handleDeleteTeam(team.id, team.name)}
                    style={{ 
                      fontSize: '12px', 
                      padding: '6px 10px',
                      backgroundColor: '#dc3545',
                      color: 'white',
                      border: '1px solid #dc3545'
                    }}
                    title="Delete Team"
                  >
                    🗑️ Delete
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>





      {/* Team Detail Modal */}
      {selectedTeamForDetail && (
        <TeamDetail 
          team={selectedTeamForDetail}
          onClose={() => setSelectedTeamForDetail(null)}
        />
      )}
    </div>
  );
};

export default Teams;