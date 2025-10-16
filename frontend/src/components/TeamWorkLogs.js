import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const TeamWorkLogs = ({ teamId, teamName }) => {
  const { user } = useAuth();
  const [workLogs, setWorkLogs] = useState([]);
  const [selectedLogs, setSelectedLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sortBy, setSortBy] = useState('date');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    if (teamId) {
      fetchTeamWorkLogs();
    }
  }, [teamId]);

  const fetchTeamWorkLogs = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/admin/teams/${teamId}/pending-approvals/`);
      setWorkLogs(response.data.work_logs);
    } catch (error) {
      console.error('Error fetching team work logs:', error);
    } finally {
      setLoading(false);
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
    const filteredLogs = getFilteredLogs();
    if (selectedLogs.length === filteredLogs.length) {
      setSelectedLogs([]);
    } else {
      setSelectedLogs(filteredLogs.map(log => log.id));
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

    setLoading(true);
    try {
      const response = await axios.post(`/api/admin/teams/${teamId}/batch-approve/`, {
        log_ids: selectedLogs,
        action: action
      });

      if (response.data.success) {
        alert(response.data.message);
        setSelectedLogs([]);
        fetchTeamWorkLogs();
      }
    } catch (error) {
      console.error('Error in batch approval:', error);
      alert(error.response?.data?.error || 'Error processing batch approval');
    } finally {
      setLoading(false);
    }
  };

  const handleIndividualApproval = async (logId, action) => {
    setLoading(true);
    try {
      await axios.post(`/api/volunteers/work-logs/${logId}/approve/`, {
        status: action
      });
      
      fetchTeamWorkLogs();
    } catch (error) {
      console.error('Error approving work log:', error);
      alert('Error processing approval');
    } finally {
      setLoading(false);
    }
  };

  const getFilteredLogs = () => {
    let filtered = [...workLogs];

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(log => log.status === filterStatus);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.date) - new Date(a.date);
        case 'volunteer':
          return a.volunteer.localeCompare(b.volunteer);
        case 'hours':
          return b.hours_worked - a.hours_worked;
        default:
          return 0;
      }
    });

    return filtered;
  };

  const filteredLogs = getFilteredLogs();
  const pendingLogs = workLogs.filter(log => log.status === 'pending');

  if (user?.role !== 'admin') {
    return <div>Access denied. Admin privileges required.</div>;
  }

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Work Logs - {teamName}</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <span style={{ 
            padding: '6px 12px', 
            borderRadius: '15px', 
            backgroundColor: pendingLogs.length > 0 ? '#fff3cd' : '#d4edda',
            color: pendingLogs.length > 0 ? '#856404' : '#155724',
            fontSize: '12px',
            fontWeight: '600'
          }}>
            {pendingLogs.length} Pending Approvals
          </span>
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
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            
            <div>
              <label style={{ fontSize: '12px', color: '#666', marginRight: '5px' }}>Sort by:</label>
              <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value)}
                style={{ fontSize: '12px', padding: '4px 8px' }}
              >
                <option value="date">Date</option>
                <option value="volunteer">Volunteer</option>
                <option value="hours">Hours</option>
              </select>
            </div>
          </div>

          {/* Batch Actions */}
          {selectedLogs.length > 0 && (
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', color: '#666' }}>
                {selectedLogs.length} selected
              </span>
              <button 
                className="btn btn-success"
                onClick={() => handleBatchApproval('approved')}
                disabled={loading}
                style={{ fontSize: '12px', padding: '6px 12px' }}
              >
                ✓ Approve Selected
              </button>
              <button 
                className="btn"
                onClick={() => handleBatchApproval('rejected')}
                disabled={loading}
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

      {/* Work Logs Table */}
      <div className="card">
        {loading && (
          <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
            Loading work logs...
          </div>
        )}
        
        {!loading && filteredLogs.length === 0 && (
          <div style={{ 
            textAlign: 'center', 
            padding: '40px 20px', 
            color: '#95a5a6',
            fontStyle: 'italic'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '10px' }}>📊</div>
            <div>No work logs found</div>
            <small>Work logs from team members will appear here</small>
          </div>
        )}

        {!loading && filteredLogs.length > 0 && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', padding: '10px', borderBottom: '1px solid #eee' }}>
              <input
                type="checkbox"
                checked={selectedLogs.length === filteredLogs.length && filteredLogs.length > 0}
                onChange={handleSelectAll}
                style={{ marginRight: '10px' }}
              />
              <span style={{ fontSize: '12px', fontWeight: '600' }}>
                Select All ({filteredLogs.length} logs)
              </span>
            </div>
            
            <div style={{ maxHeight: '600px', overflow: 'auto' }}>
              {filteredLogs.map(log => (
                <div 
                  key={log.id} 
                  style={{ 
                    padding: '15px', 
                    borderBottom: '1px solid #eee',
                    backgroundColor: selectedLogs.includes(log.id) ? '#f8f9fa' : 'white'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'start', gap: '15px' }}>
                    <input
                      type="checkbox"
                      checked={selectedLogs.includes(log.id)}
                      onChange={() => handleSelectLog(log.id)}
                      style={{ marginTop: '5px' }}
                    />
                    
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                        <div>
                          <h4 style={{ margin: '0 0 4px 0', color: '#2c3e50' }}>
                            {log.volunteer_details?.full_name || log.volunteer}
                          </h4>
                          <div style={{ fontSize: '12px', color: '#7f8c8d' }}>
                            {log.volunteer_details?.college_name} • {log.volunteer_details?.course}
                          </div>
                        </div>
                        
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '14px', fontWeight: '600', color: '#2c3e50' }}>
                            {log.hours_worked} hours
                          </div>
                          <div style={{ fontSize: '12px', color: '#7f8c8d' }}>
                            {new Date(log.date).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      
                      <p style={{ margin: '8px 0', fontSize: '14px', color: '#34495e' }}>
                        {log.description}
                      </p>
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ 
                          padding: '4px 8px', 
                          borderRadius: '12px', 
                          fontSize: '11px',
                          fontWeight: '600',
                          backgroundColor: log.status === 'approved' ? '#d4edda' : 
                                         log.status === 'pending' ? '#fff3cd' : '#f8d7da',
                          color: log.status === 'approved' ? '#155724' : 
                                 log.status === 'pending' ? '#856404' : '#721c24'
                        }}>
                          {log.status.toUpperCase()}
                        </span>
                        
                        {log.status === 'pending' && (
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button 
                              className="btn btn-success"
                              onClick={() => handleIndividualApproval(log.id, 'approved')}
                              disabled={loading}
                              style={{ fontSize: '12px', padding: '4px 8px' }}
                            >
                              ✓ Approve
                            </button>
                            <button 
                              className="btn"
                              onClick={() => handleIndividualApproval(log.id, 'rejected')}
                              disabled={loading}
                              style={{ 
                                fontSize: '12px', 
                                padding: '4px 8px',
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
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default TeamWorkLogs;