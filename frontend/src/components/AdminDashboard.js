import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalVolunteers: 0,
    pendingApprovals: 0,
    totalHours: 0,
    activeProjects: 0
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [teamStats, setTeamStats] = useState({});
  const [unassignedStats, setUnassignedStats] = useState({});
  const [activeTab, setActiveTab] = useState('overview');
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [newTeamData, setNewTeamData] = useState({ name: '', description: '' });

  useEffect(() => {
    fetchAdminStats();
    fetchTeams();
    fetchUnassignedStats();
  }, []);

  const fetchTeams = async () => {
    try {
      const response = await axios.get('/api/teams/');
      setTeams(response.data.teams);
      
      // Fetch detailed stats for each team (including member hours)
      const teamStatsPromises = response.data.teams.map(async (team) => {
        try {
          const [statsResponse, membersResponse] = await Promise.all([
            axios.get(`/api/teams/${team.id}/stats/`),
            axios.get(`/api/teams/${team.id}/member-hours/`)
          ]);
          return { 
            teamId: team.id, 
            stats: statsResponse.data,
            memberHours: membersResponse.data.member_hours || []
          };
        } catch (error) {
          console.error(`Error fetching stats for team ${team.id}:`, error);
          return { teamId: team.id, stats: {}, memberHours: [] };
        }
      });
      
      const allTeamStats = await Promise.all(teamStatsPromises);
      const statsMap = {};
      allTeamStats.forEach(({ teamId, stats, memberHours }) => {
        statsMap[teamId] = { ...stats, memberHours };
      });
      setTeamStats(statsMap);
    } catch (error) {
      console.error('Error fetching teams:', error);
    }
  };

  const fetchUnassignedStats = async () => {
    try {
      const [logsResponse, projectsResponse] = await Promise.all([
        axios.get('/api/admin/unassigned/work-logs/'),
        axios.get('/api/admin/unassigned/projects/')
      ]);
      
      setUnassignedStats({
        workLogs: logsResponse.data.volunteer_count || 0,
        pendingLogs: logsResponse.data.pending_count || 0,
        projects: projectsResponse.data.volunteer_count || 0,
        pendingProjects: projectsResponse.data.pending_count || 0
      });
    } catch (error) {
      console.error('Error fetching unassigned stats:', error);
      // Set default values if API fails
      setUnassignedStats({
        workLogs: 0,
        pendingLogs: 0,
        projects: 0,
        pendingProjects: 0
      });
    }
  };

  const fetchAdminStats = async () => {
    try {
      // Fetch work logs for stats
      const logsResponse = await axios.get('/api/volunteers/work-logs/');
      const logs = logsResponse.data.work_logs;
      
      const pendingApprovals = logs.filter(log => log.status === 'pending').length;
      const totalHours = logs.reduce((sum, log) => sum + log.hours_worked, 0);
      const volunteers = [...new Set(logs.map(log => log.volunteer))];
      
      // Fetch projects
      const projectsResponse = await axios.get('/api/projects/');
      const activeProjects = projectsResponse.data.projects.filter(
        p => p.status === 'in_progress' || p.status === 'approved'
      ).length;
      
      setStats({
        totalVolunteers: volunteers.length,
        pendingApprovals,
        totalHours,
        activeProjects
      });

      // Set recent activity (last 5 work logs)
      setRecentActivity(logs.slice(0, 5));
    } catch (error) {
      console.error('Error fetching admin stats:', error);
    }
  };

  const handleTeamSelect = (team) => {
    setSelectedTeam(team);
    setActiveTab('team');
  };

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/admin/teams/create/', newTeamData);
      setNewTeamData({ name: '', description: '' });
      setShowCreateTeam(false);
      fetchTeams();
      alert('Team created successfully!');
    } catch (error) {
      console.error('Error creating team:', error);
      alert('Error creating team');
    }
  };

  const handleDeleteTeam = async (teamId, teamName) => {
    if (!window.confirm(`Are you sure you want to delete "${teamName}"? This action cannot be undone.`)) {
      return;
    }
    
    try {
      await axios.delete(`/api/admin/teams/${teamId}/delete/`);
      fetchTeams();
      alert('Team deleted successfully!');
      if (selectedTeam && selectedTeam.id === teamId) {
        setSelectedTeam(null);
        setActiveTab('teams');
      }
    } catch (error) {
      console.error('Error deleting team:', error);
      alert(error.response?.data?.error || 'Error deleting team');
    }
  };

  const renderTeamOverview = () => (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Team Management</h2>
        <button 
          className="btn btn-success"
          onClick={() => setShowCreateTeam(!showCreateTeam)}
        >
          {showCreateTeam ? 'Cancel' : 'Create New Team'}
        </button>
      </div>

      {showCreateTeam && (
        <div className="card" style={{ marginBottom: '20px' }}>
          <h3>Create New Team</h3>
          <form onSubmit={handleCreateTeam}>
            <div className="form-group">
              <label>Team Name:</label>
              <input
                type="text"
                value={newTeamData.name}
                onChange={(e) => setNewTeamData({...newTeamData, name: e.target.value})}
                placeholder="e.g., Community Garden Team"
                required
              />
            </div>
            
            <div className="form-group">
              <label>Description:</label>
              <textarea
                rows="3"
                value={newTeamData.description}
                onChange={(e) => setNewTeamData({...newTeamData, description: e.target.value})}
                placeholder="Describe the team's purpose and goals"
              />
            </div>
            
            <button type="submit" className="btn btn-success">Create Team</button>
          </form>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '20px' }}>
        {teams.map(team => {
          const stats = teamStats[team.id] || {};
          const memberHours = stats.memberHours || [];
          return (
            <div key={team.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '15px' }}>
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: '0 0 5px 0', color: '#2c3e50' }}>{team.name}</h3>
                  <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#7f8c8d' }}>
                    {team.member_count} members
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '5px' }}>
                  <span style={{ 
                    padding: '4px 8px', 
                    borderRadius: '12px', 
                    fontSize: '11px',
                    fontWeight: '600',
                    backgroundColor: stats.pending_approvals > 0 ? '#fff3cd' : '#d4edda',
                    color: stats.pending_approvals > 0 ? '#856404' : '#155724'
                  }}>
                    {stats.pending_approvals || 0} pending
                  </span>
                  <button 
                    className="btn"
                    onClick={() => handleDeleteTeam(team.id, team.name)}
                    style={{ 
                      fontSize: '10px', 
                      padding: '4px 6px',
                      backgroundColor: '#dc3545',
                      color: 'white',
                      border: '1px solid #dc3545'
                    }}
                    title="Delete Team"
                  >
                    🗑️
                  </button>
                </div>
              </div>
              
              {/* Member Hours Breakdown */}
              <div style={{ marginBottom: '15px' }}>
                <div style={{ fontSize: '12px', color: '#95a5a6', marginBottom: '8px', fontWeight: '600' }}>
                  Member Hours Breakdown:
                </div>
                <div style={{ maxHeight: '120px', overflowY: 'auto', fontSize: '11px' }}>
                  {memberHours.length > 0 ? (
                    memberHours.map((member, index) => (
                      <div key={index} style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        padding: '3px 0',
                        borderBottom: index < memberHours.length - 1 ? '1px solid #f0f0f0' : 'none'
                      }}>
                        <span style={{ color: '#2c3e50' }}>
                          {member.full_name || member.username}
                        </span>
                        <span style={{ fontWeight: '600', color: '#27ae60' }}>
                          {member.total_hours}h
                        </span>
                      </div>
                    ))
                  ) : (
                    <div style={{ color: '#95a5a6', fontStyle: 'italic' }}>No work logs yet</div>
                  )}
                </div>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '12px', marginBottom: '10px' }}>
                <div>
                  <div style={{ color: '#95a5a6' }}>Total Hours</div>
                  <div style={{ fontWeight: '600', color: '#2c3e50' }}>{stats.total_hours || 0}</div>
                </div>
                <div>
                  <div style={{ color: '#95a5a6' }}>Active Projects</div>
                  <div style={{ fontWeight: '600', color: '#2c3e50' }}>{stats.active_projects || 0}</div>
                </div>
              </div>
              
              <button 
                className="btn btn-primary" 
                style={{ width: '100%', fontSize: '12px' }}
                onClick={() => handleTeamSelect(team)}
              >
                Manage Team Details →
              </button>
            </div>
          );
        })}
        
        {/* Unassigned Volunteers Card */}
        <div className="card" style={{ cursor: 'pointer' }} onClick={() => setActiveTab('unassigned')}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '15px' }}>
            <div>
              <h3 style={{ margin: '0 0 5px 0', color: '#e74c3c' }}>Unassigned Volunteers</h3>
              <p style={{ margin: '0', fontSize: '14px', color: '#7f8c8d' }}>
                {unassignedStats.workLogs || 0} volunteers without teams
              </p>
            </div>
            <span style={{ 
              padding: '4px 8px', 
              borderRadius: '12px', 
              fontSize: '11px',
              fontWeight: '600',
              backgroundColor: unassignedStats.pendingLogs > 0 ? '#fff3cd' : '#d4edda',
              color: unassignedStats.pendingLogs > 0 ? '#856404' : '#155724'
            }}>
              {unassignedStats.pendingLogs || 0} pending
            </span>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '12px' }}>
            <div>
              <div style={{ color: '#95a5a6' }}>Work Logs</div>
              <div style={{ fontWeight: '600', color: '#2c3e50' }}>{unassignedStats.workLogs || 0}</div>
            </div>
            <div>
              <div style={{ color: '#95a5a6' }}>Projects</div>
              <div style={{ fontWeight: '600', color: '#2c3e50' }}>{unassignedStats.projects || 0}</div>
            </div>
          </div>
          
          <button 
            className="btn" 
            style={{ 
              marginTop: '10px', 
              width: '100%', 
              fontSize: '12px',
              backgroundColor: '#e74c3c',
              color: 'white',
              border: '1px solid #e74c3c'
            }}
            onClick={(e) => {
              e.stopPropagation();
              setActiveTab('unassigned');
            }}
          >
            Manage Unassigned →
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="container fade-in">
      <div className="dashboard-header">
        <h1 className="dashboard-title">Akshar Paaul Admin Dashboard</h1>
        <p className="dashboard-subtitle">Manage volunteers, projects, and community impact</p>
      </div>
      
      {/* Navigation Tabs */}
      <div style={{ 
        display: 'flex', 
        gap: '10px', 
        marginBottom: '20px',
        borderBottom: '2px solid #ecf0f1',
        paddingBottom: '10px'
      }}>
        <button 
          className={`btn ${activeTab === 'overview' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('overview')}
          style={{ fontSize: '14px' }}
        >
          📊 Overview
        </button>
        <button 
          className={`btn ${activeTab === 'teams' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('teams')}
          style={{ fontSize: '14px' }}
        >
          👥 Team Management
        </button>
        <button 
          className={`btn ${activeTab === 'unassigned' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('unassigned')}
          style={{ fontSize: '14px' }}
        >
          🔍 Unassigned Volunteers
        </button>
        {selectedTeam && (
          <button 
            className={`btn ${activeTab === 'team' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('team')}
            style={{ fontSize: '14px' }}
          >
            🎯 {selectedTeam.name}
          </button>
        )}
      </div>
      
      {/* Tab Content */}
      {activeTab === 'overview' && (
        <>
          <div className="stats-grid">
        <div className="stat-card slide-up">
          <div className="stat-label">Total Volunteers</div>
          <div className="stat-number">{stats.totalVolunteers}</div>
          <div style={{ fontSize: '12px', color: '#95a5a6', marginTop: '5px' }}>
            Active community members
          </div>
        </div>
        
        <div className="stat-card slide-up" style={{ animationDelay: '0.1s' }}>
          <div className="stat-label">Pending Approvals</div>
          <div className="stat-number" style={{ 
            background: stats.pendingApprovals > 0 ? 
              'linear-gradient(135deg, #f39c12 0%, #e67e22 100%)' : 
              'linear-gradient(135deg, #27ae60 0%, #2ecc71 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            {stats.pendingApprovals}
          </div>
          <div style={{ fontSize: '12px', color: '#95a5a6', marginTop: '5px' }}>
            {stats.pendingApprovals > 0 ? 'Require your attention' : 'All caught up!'}
          </div>
        </div>
        
        <div className="stat-card slide-up" style={{ animationDelay: '0.2s' }}>
          <div className="stat-label">Total Hours Logged</div>
          <div className="stat-number" style={{ 
            background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            {stats.totalHours}
          </div>
          <div style={{ fontSize: '12px', color: '#95a5a6', marginTop: '5px' }}>
            Community service hours
          </div>
        </div>
        
        <div className="stat-card slide-up" style={{ animationDelay: '0.3s' }}>
          <div className="stat-label">Active Projects</div>
          <div className="stat-number" style={{ 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            {stats.activeProjects}
          </div>
          <div style={{ fontSize: '12px', color: '#95a5a6', marginTop: '5px' }}>
            Ongoing initiatives
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div className="card">
          <h3>Recent Activity</h3>
          <div style={{ maxHeight: '300px', overflow: 'auto' }}>
            {recentActivity.length > 0 ? (
              recentActivity.map(activity => (
                <div key={activity.id} style={{ 
                  padding: '12px 0', 
                  borderBottom: '1px solid #eee',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                      {activity.volunteer_details?.full_name || activity.volunteer}
                    </div>
                    <div style={{ fontSize: '14px', color: '#666', marginBottom: '2px' }}>
                      {activity.description.length > 50 
                        ? activity.description.substring(0, 50) + '...' 
                        : activity.description}
                    </div>
                    <small style={{ color: '#95a5a6', fontSize: '12px' }}>
                      {new Date(activity.date).toLocaleDateString()} • {activity.hours_worked}h
                    </small>
                  </div>
                  <span style={{ 
                    padding: '4px 8px', 
                    borderRadius: '12px', 
                    fontSize: '11px',
                    fontWeight: '600',
                    backgroundColor: activity.status === 'approved' ? '#d4edda' : 
                                   activity.status === 'pending' ? '#fff3cd' : '#f8d7da',
                    color: activity.status === 'approved' ? '#155724' : 
                           activity.status === 'pending' ? '#856404' : '#721c24'
                  }}>
                    {activity.status.toUpperCase()}
                  </span>
                </div>
              ))
            ) : (
              <div style={{ 
                textAlign: 'center', 
                padding: '40px 20px', 
                color: '#95a5a6',
                fontStyle: 'italic'
              }}>
                <div style={{ fontSize: '48px', marginBottom: '10px' }}>📊</div>
                <div>No recent activity</div>
                <small>Volunteer work logs will appear here</small>
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <h3>Quick Actions</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <button 
              className="btn btn-primary"
              onClick={() => navigate('/work-logs')}
              style={{ textAlign: 'left', display: 'flex', alignItems: 'center', gap: '10px' }}
            >
              <span>📊</span>
              <div>
                <div>Review Work Logs</div>
                <small style={{ opacity: 0.8, fontSize: '11px' }}>
                  {stats.pendingApprovals} pending approvals
                </small>
              </div>
            </button>
            
            <button 
              className="btn btn-success"
              onClick={() => navigate('/projects')}
              style={{ textAlign: 'left', display: 'flex', alignItems: 'center', gap: '10px' }}
            >
              <span>🚀</span>
              <div>
                <div>Manage Projects</div>
                <small style={{ opacity: 0.8, fontSize: '11px' }}>
                  Review proposals & track progress
                </small>
              </div>
            </button>
            
            <button 
              className="btn btn-primary"
              onClick={() => navigate('/documents')}
              style={{ textAlign: 'left', display: 'flex', alignItems: 'center', gap: '10px' }}
            >
              <span>📁</span>
              <div>
                <div>Document Library</div>
                <small style={{ opacity: 0.8, fontSize: '11px' }}>
                  Browse & filter shared documents
                </small>
              </div>
            </button>
            
            <button 
              className="btn btn-primary"
              onClick={() => navigate('/teams')}
              style={{ textAlign: 'left', display: 'flex', alignItems: 'center', gap: '10px' }}
            >
              <span>👥</span>
              <div>
                <div>Manage Teams</div>
                <small style={{ opacity: 0.8, fontSize: '11px' }}>
                  Oversee team activities & members
                </small>
              </div>
            </button>
          </div>
        </div>
      </div>
        </>
      )}
      
      {activeTab === 'teams' && (
        <div>
          <h2 style={{ marginBottom: '20px' }}>Team Management</h2>
          {renderTeamOverview()}
        </div>
      )}
      
      {activeTab === 'unassigned' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2>Unassigned Volunteers Management</h2>
            <div style={{ fontSize: '14px', color: '#666' }}>
              Volunteers not assigned to any team
            </div>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '30px' }}>
            <div className="card">
              <h3 style={{ color: '#e74c3c', marginBottom: '15px' }}>📊 Work Logs Overview</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                <div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#2c3e50' }}>
                    {unassignedStats.workLogs || 0}
                  </div>
                  <div style={{ fontSize: '12px', color: '#7f8c8d' }}>Volunteers with logs</div>
                </div>
                <div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#e74c3c' }}>
                    {unassignedStats.pendingLogs || 0}
                  </div>
                  <div style={{ fontSize: '12px', color: '#7f8c8d' }}>Pending approvals</div>
                </div>
              </div>
              <button 
                className="btn btn-primary"
                onClick={() => navigate('/work-logs')}
                style={{ width: '100%' }}
              >
                Review & Approve Work Logs
              </button>
            </div>
            
            <div className="card">
              <h3 style={{ color: '#3498db', marginBottom: '15px' }}>🚀 Projects Overview</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                <div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#2c3e50' }}>
                    {unassignedStats.projects || 0}
                  </div>
                  <div style={{ fontSize: '12px', color: '#7f8c8d' }}>Volunteers with projects</div>
                </div>
                <div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#f39c12' }}>
                    {unassignedStats.pendingProjects || 0}
                  </div>
                  <div style={{ fontSize: '12px', color: '#7f8c8d' }}>Pending projects</div>
                </div>
              </div>
              <button 
                className="btn btn-success"
                onClick={() => navigate('/projects')}
                style={{ width: '100%' }}
              >
                Review & Approve Projects
              </button>
            </div>
            
            <div className="card">
              <h3 style={{ color: '#9b59b6', marginBottom: '15px' }}>👥 Team Assignment</h3>
              <div style={{ marginBottom: '15px', fontSize: '14px', color: '#7f8c8d' }}>
                Help unassigned volunteers find teams or create new teams for them.
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button 
                  className="btn btn-primary"
                  onClick={() => navigate('/teams')}
                  style={{ flex: 1, fontSize: '12px' }}
                >
                  Manage Teams
                </button>
                <button 
                  className="btn btn-secondary"
                  onClick={() => setActiveTab('teams')}
                  style={{ flex: 1, fontSize: '12px' }}
                >
                  Create Team
                </button>
              </div>
            </div>
          </div>
          
          <div className="card">
            <h3>Quick Actions for Unassigned Volunteers</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginTop: '15px' }}>
              <button 
                className="btn btn-primary"
                onClick={() => navigate('/work-logs')}
                style={{ textAlign: 'left', display: 'flex', alignItems: 'center', gap: '10px' }}
              >
                <span>✅</span>
                <div>
                  <div>Approve Work Logs</div>
                  <small style={{ opacity: 0.8, fontSize: '11px' }}>
                    {unassignedStats.pendingLogs || 0} pending approvals
                  </small>
                </div>
              </button>
              
              <button 
                className="btn btn-success"
                onClick={() => navigate('/projects')}
                style={{ textAlign: 'left', display: 'flex', alignItems: 'center', gap: '10px' }}
              >
                <span>🚀</span>
                <div>
                  <div>Review Projects</div>
                  <small style={{ opacity: 0.8, fontSize: '11px' }}>
                    {unassignedStats.pendingProjects || 0} pending projects
                  </small>
                </div>
              </button>
              
              <button 
                className="btn btn-primary"
                onClick={() => navigate('/teams')}
                style={{ textAlign: 'left', display: 'flex', alignItems: 'center', gap: '10px' }}
              >
                <span>👥</span>
                <div>
                  <div>Assign to Teams</div>
                  <small style={{ opacity: 0.8, fontSize: '11px' }}>
                    Help volunteers join teams
                  </small>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
      
      {activeTab === 'team' && selectedTeam && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <h2>Team Management</h2>
              <select 
                value={selectedTeam.id} 
                onChange={(e) => {
                  const teamId = parseInt(e.target.value);
                  const team = teams.find(t => t.id === teamId);
                  setSelectedTeam(team);
                }}
                style={{ 
                  fontSize: '14px', 
                  padding: '8px 12px',
                  borderRadius: '4px',
                  border: '1px solid #ddd'
                }}
              >
                {teams.map(team => (
                  <option key={team.id} value={team.id}>
                    {team.name} ({team.member_count} members)
                  </option>
                ))}
              </select>
            </div>
            <button 
              className="btn btn-secondary"
              onClick={() => setActiveTab('teams')}
            >
              ← Back to Teams
            </button>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '20px' }}>
            <div className="card">
              <h4>Team Stats</h4>
              <p>Members: {selectedTeam.member_count}</p>
              <p>Total Hours: {teamStats[selectedTeam.id]?.total_hours || 0}</p>
              <p>Active Projects: {teamStats[selectedTeam.id]?.active_projects || 0}</p>
              <p>Pending Approvals: {teamStats[selectedTeam.id]?.pending_approvals || 0}</p>
            </div>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
            <div className="card">
              <h4>Work Log Approvals</h4>
              <p>{teamStats[selectedTeam.id]?.pending_approvals || 0} pending approvals</p>
              <button 
                className="btn btn-primary"
                onClick={() => navigate(`/work-logs?team=${selectedTeam.id}`)}
              >
                Review Work Logs
              </button>
            </div>
            
            <div className="card">
              <h4>Project Management</h4>
              <p>{teamStats[selectedTeam.id]?.total_projects || 0} total projects</p>
              <button 
                className="btn btn-success"
                onClick={() => navigate(`/projects?team=${selectedTeam.id}`)}
              >
                Manage Projects
              </button>
            </div>
            
            <div className="card">
              <h4>Team Details</h4>
              <p>View members and settings</p>
              <button 
                className="btn btn-primary"
                onClick={() => navigate(`/teams/${selectedTeam.id}`)}
              >
                Team Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;