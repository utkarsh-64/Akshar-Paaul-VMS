import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLocation } from 'react-router-dom';
import axios from 'axios';

const WorkLogs = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [workLogs, setWorkLogs] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    date: '',
    hours_worked: '',
    description: ''
  });
  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [selectedLogs, setSelectedLogs] = useState([]);
  const [teamStats, setTeamStats] = useState({});

  useEffect(() => {
    if (user?.role === 'volunteer') {
      fetchWorkLogs();
    } else if (user?.role === 'admin') {
      fetchWorkLogs(); // Fetch all work logs for admin
      fetchTeams();
    }
  }, [user]);

  useEffect(() => {
    if (selectedTeam) {
      fetchTeamWorkLogs();
    }
  }, [selectedTeam]);

  const fetchTeams = async () => {
    try {
      const response = await axios.get('/api/teams/');
      const teamsData = response.data.teams;
      
      // Fetch work log stats for each team
      const teamsWithStats = await Promise.all(
        teamsData.map(async (team) => {
          try {
            const statsResponse = await axios.get(`/api/teams/${team.id}/work-logs/`);
            const workLogs = statsResponse.data.work_logs || [];
            const pendingCount = workLogs.filter(log => log.status === 'pending').length;
            const totalHours = workLogs.filter(log => log.status === 'approved').reduce((sum, log) => sum + parseFloat(log.hours_worked || 0), 0);
            
            return {
              ...team,
              pendingLogs: pendingCount,
              totalHours: totalHours,
              totalLogs: workLogs.length
            };
          } catch (error) {
            console.error(`Error fetching stats for team ${team.id}:`, error);
            return {
              ...team,
              pendingLogs: 0,
              totalHours: 0,
              totalLogs: 0
            };
          }
        })
      );
      
      setTeams(teamsWithStats);
    } catch (error) {
      console.error('Error fetching teams:', error);
    }
  };

  const fetchWorkLogs = async () => {
    try {
      const response = await axios.get('/api/volunteers/work-logs/');
      setWorkLogs(response.data.work_logs);
    } catch (error) {
      console.error('Error fetching work logs:', error);
    }
  };

  const fetchTeamWorkLogs = async () => {
    if (!selectedTeam) return;
    
    try {
      const response = await axios.get(`/api/teams/${selectedTeam.id}/work-logs/`);
      setWorkLogs(response.data.work_logs || []);
    } catch (error) {
      console.error('Error fetching team work logs:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/volunteers/work-logs/create/', formData);
      setFormData({ date: '', hours_worked: '', description: '' });
      setShowForm(false);
      fetchWorkLogs();
    } catch (error) {
      console.error('Error creating work log:', error);
    }
  };

  const handleApproval = async (logId, status) => {
    try {
      console.log(`Attempting to ${status} work log ${logId}`);
      const response = await axios.post(`/api/volunteers/work-logs/${logId}/approve/`, { status });
      console.log('Approval response:', response.data);
      
      // Refresh work logs
      if (selectedTeam) {
        fetchTeamWorkLogs();
      } else {
        fetchWorkLogs();
      }
      
      // Refresh team stats if we're in admin mode
      if (user?.role === 'admin') {
        fetchTeams();
      }
      
      alert(`Work log ${status} successfully!`);
    } catch (error) {
      console.error('Error updating work log:', error);
      console.error('Error details:', error.response?.data);
      alert(`Error ${status === 'approved' ? 'approving' : 'rejecting'} work log: ${error.response?.data?.error || 'Unknown error'}`);
    }
  };

  const handleBatchApproval = async (action) => {
    if (selectedLogs.length === 0) {
      alert('Please select work logs to approve/reject');
      return;
    }

    const confirmMessage = `Are you sure you want to ${action} ${selectedLogs.length} work log(s)?`;
    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      // Individual approvals
      for (const logId of selectedLogs) {
        await axios.post(`/api/volunteers/work-logs/${logId}/approve/`, { status: action });
      }
      
      setSelectedLogs([]);
      fetchTeamWorkLogs();
      fetchTeams(); // Refresh team stats
      alert(`${selectedLogs.length} work logs ${action} successfully!`);
    } catch (error) {
      console.error('Error in batch approval:', error);
      alert('Error processing batch approval');
    }
  };

  const handleSelectLog = (logId) => {
    setSelectedLogs(prev => {
      if (prev.includes(logId)) {
        return prev.filter(id => id !== logId);
      } else {
        return [...prev, logId];
      }
    });
  };

  const handleSelectAll = () => {
    const pendingLogs = workLogs.filter(log => log.status === 'pending');
    if (selectedLogs.length === pendingLogs.length) {
      setSelectedLogs([]);
    } else {
      setSelectedLogs(pendingLogs.map(log => log.id));
    }
  };

  // Don't redirect to TeamWorkLogs, handle team view in this component

  // Show team selection view only if explicitly requested
  if (user?.role === 'admin' && selectedTeam === 'team-selection') {
    return (
      <div className="container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1>Work Log Management - Teams</h1>
          <button 
            className="btn btn-secondary"
            onClick={() => setSelectedTeam(null)}
          >
            ← Back to All Work Logs
          </button>
        </div>

        <div style={{ display: 'grid', gap: '20px' }}>
          {teams.map(team => (
            <div key={team.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div style={{ flex: 1 }}>
                  <h3 
                    style={{ 
                      cursor: 'pointer', 
                      color: '#2563eb',
                      margin: '0 0 10px 0'
                    }}
                    onClick={() => setSelectedTeam(team)}
                  >
                    {team.name}
                  </h3>
                  <p style={{ margin: '0 0 8px 0', color: '#666' }}>{team.description}</p>
                  <div style={{ fontSize: '14px', color: '#888' }}>
                    <span><strong>Members:</strong> {team.member_count}</span>
                    <span style={{ marginLeft: '15px' }}>
                      <strong>Total Hours:</strong> {team.totalHours}h
                    </span>
                    <span style={{ marginLeft: '15px' }}>
                      <strong>Total Logs:</strong> {team.totalLogs}
                    </span>
                  </div>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                  {team.pendingLogs > 0 ? (
                    <div style={{
                      padding: '8px 16px',
                      backgroundColor: '#fef3c7',
                      color: '#d97706',
                      borderRadius: '20px',
                      fontSize: '14px',
                      fontWeight: '600'
                    }}>
                      {team.pendingLogs} Pending Approval{team.pendingLogs > 1 ? 's' : ''}
                    </div>
                  ) : (
                    <div style={{
                      padding: '8px 16px',
                      backgroundColor: '#d1fae5',
                      color: '#047857',
                      borderRadius: '20px',
                      fontSize: '14px',
                      fontWeight: '600'
                    }}>
                      All Approved
                    </div>
                  )}
                  
                  <button 
                    className="btn btn-primary"
                    onClick={() => setSelectedTeam(team)}
                    style={{ fontSize: '14px' }}
                  >
                    Manage Work Logs
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <h1>
            Work Logs
            {selectedTeam && (
              <span style={{ fontSize: '18px', color: '#666', fontWeight: 'normal' }}>
                {' '}- {selectedTeam.name}
              </span>
            )}
          </h1>
          {user?.role === 'admin' && !selectedTeam && (
            <div style={{ display: 'flex', gap: '10px', fontSize: '12px', alignItems: 'center' }}>
              <span style={{ color: '#666', fontWeight: '500' }}>Showing:</span>
              <span style={{
                padding: '4px 8px',
                borderRadius: '12px',
                backgroundColor: '#e3f2fd',
                color: '#1976d2',
                fontWeight: '600'
              }}>
                {workLogs.filter(log => log.volunteer_details?.team_name).length} Team Members
              </span>
              <span style={{
                padding: '4px 8px',
                borderRadius: '12px',
                backgroundColor: '#fff3cd',
                color: '#856404',
                fontWeight: '600'
              }}>
                {workLogs.filter(log => !log.volunteer_details?.team_name).length} Unassigned Volunteers
              </span>
              <span style={{
                padding: '4px 8px',
                borderRadius: '12px',
                backgroundColor: '#f3f4f6',
                color: '#374151',
                fontWeight: '600'
              }}>
                {workLogs.length} Total Logs
              </span>
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {user?.role === 'admin' && !selectedTeam && (
            <button 
              className="btn btn-primary"
              onClick={() => setSelectedTeam('team-selection')}
              style={{ fontSize: '12px', padding: '6px 12px' }}
            >
              📊 Manage by Teams
            </button>
          )}
          {selectedTeam && selectedTeam !== 'team-selection' && user?.role === 'admin' && (
            <button 
              className="btn btn-secondary"
              onClick={() => {
                setSelectedTeam(null);
                setWorkLogs([]);
                setSelectedLogs([]);
                fetchWorkLogs(); // Fetch all work logs again
              }}
              style={{ fontSize: '12px', padding: '6px 12px' }}
            >
              ← Back to All Work Logs
            </button>
          )}
          {user?.role === 'volunteer' && (
            <button 
              className="btn btn-primary"
              onClick={() => setShowForm(!showForm)}
            >
              {showForm ? 'Cancel' : 'Add Work Log'}
            </button>
          )}
        </div>
      </div>

      {showForm && (
        <div className="card">
          <h3>Add New Work Log</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Date:</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({...formData, date: e.target.value})}
                required
              />
            </div>
            
            <div className="form-group">
              <label>Hours Worked:</label>
              <input
                type="number"
                step="0.5"
                value={formData.hours_worked}
                onChange={(e) => setFormData({...formData, hours_worked: e.target.value})}
                required
              />
            </div>
            
            <div className="form-group">
              <label>Description:</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                required
              />
            </div>
            
            <button type="submit" className="btn btn-success">Submit</button>
          </form>
        </div>
      )}

      {/* Batch Actions for Team View */}
      {user?.role === 'admin' && selectedTeam && (
        <div className="card" style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px' }}>
            <div>
              <strong>{selectedTeam.name} Work Logs</strong>
              {selectedLogs.length > 0 && (
                <span style={{ marginLeft: '15px', color: '#666' }}>
                  {selectedLogs.length} selected
                </span>
              )}
            </div>
            {selectedLogs.length > 0 && (
              <div style={{ display: 'flex', gap: '10px' }}>
                <button 
                  className="btn btn-success"
                  onClick={() => handleBatchApproval('approved')}
                  style={{ fontSize: '12px', padding: '6px 12px' }}
                >
                  ✓ Approve Selected
                </button>
                <button 
                  className="btn"
                  onClick={() => handleBatchApproval('rejected')}
                  style={{ 
                    fontSize: '12px', 
                    padding: '6px 12px',
                    backgroundColor: '#dc3545',
                    color: 'white',
                    border: '1px solid #dc3545'
                  }}
                >
                  ✗ Reject Selected
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="card">
        {/* Select All for Admin Team View */}
        {user?.role === 'admin' && selectedTeam && workLogs.length > 0 && (
          <div style={{ padding: '10px', borderBottom: '1px solid #eee', backgroundColor: '#f8f9fa' }}>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={selectedLogs.length === workLogs.filter(log => log.status === 'pending').length && workLogs.filter(log => log.status === 'pending').length > 0}
                onChange={handleSelectAll}
                style={{ marginRight: '8px' }}
              />
              <span style={{ fontSize: '14px', fontWeight: '600' }}>
                Select All Pending ({workLogs.filter(log => log.status === 'pending').length} logs)
              </span>
            </label>
          </div>
        )}
        
        {workLogs.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '40px 20px', 
            color: '#95a5a6',
            fontStyle: 'italic'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '10px' }}>⏰</div>
            <div>
              {selectedTeam ? `No work logs found for ${selectedTeam.name}` : 'No work logs found'}
            </div>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                {user?.role === 'admin' && selectedTeam && <th style={{ width: '40px' }}></th>}
                <th>Date</th>
                <th>Hours</th>
                <th>Description</th>
                {user?.role === 'admin' && <th>Volunteer</th>}
                <th>Status</th>
                {user?.role === 'admin' && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {workLogs.map(log => (
                <tr key={log.id} style={{ backgroundColor: selectedLogs.includes(log.id) ? '#f8f9fa' : 'white' }}>
                  {user?.role === 'admin' && selectedTeam && (
                    <td>
                      {log.status === 'pending' && (
                        <input
                          type="checkbox"
                          checked={selectedLogs.includes(log.id)}
                          onChange={() => handleSelectLog(log.id)}
                        />
                      )}
                    </td>
                  )}
                  <td>{log.date}</td>
                  <td>{log.hours_worked}h</td>
                  <td>{log.description}</td>
                  {user?.role === 'admin' && (
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div>
                          <div>{log.volunteer}</div>
                          {log.volunteer_details?.full_name && (
                            <small style={{ color: '#666' }}>{log.volunteer_details.full_name}</small>
                          )}
                        </div>
                        {!selectedTeam && (
                          <span style={{
                            padding: '2px 6px',
                            borderRadius: '10px',
                            fontSize: '10px',
                            fontWeight: '600',
                            backgroundColor: log.volunteer_details?.team_name ? '#e3f2fd' : '#fff3cd',
                            color: log.volunteer_details?.team_name ? '#1976d2' : '#856404'
                          }}>
                            {log.volunteer_details?.team_name || 'Unassigned'}
                          </span>
                        )}
                      </div>
                    </td>
                  )}
                  <td>
                    <span className={`status-${log.status}`}>
                      {log.status.charAt(0).toUpperCase() + log.status.slice(1)}
                    </span>
                  </td>
                  {user?.role === 'admin' && (
                    <td>
                      {log.status === 'pending' ? (
                        <div style={{ display: 'flex', gap: '5px' }}>
                          <button 
                            className="btn btn-success"
                            onClick={() => handleApproval(log.id, 'approved')}
                            style={{ fontSize: '12px', padding: '4px 8px' }}
                          >
                            Approve
                          </button>
                          <button 
                            className="btn btn-danger"
                            onClick={() => handleApproval(log.id, 'rejected')}
                            style={{ fontSize: '12px', padding: '4px 8px' }}
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span style={{ fontSize: '12px', color: '#666', fontStyle: 'italic' }}>
                          {log.status === 'approved' ? '✅ Approved' : '❌ Rejected'}
                        </span>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default WorkLogs;