import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const TeamDetail = ({ team, onClose }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('members');
  const [teamMembers, setTeamMembers] = useState([]);
  const [teamDocuments, setTeamDocuments] = useState([]);
  const [teamWorkLogs, setTeamWorkLogs] = useState([]);
  const [showDocumentForm, setShowDocumentForm] = useState(false);
  const [documentData, setDocumentData] = useState({
    title: '',
    document_type: 'signed',
    drive_link: ''
  });
  const [showAddMemberForm, setShowAddMemberForm] = useState(false);
  const [addMemberData, setAddMemberData] = useState({
    username_or_email: ''
  });
  const [searchResults, setSearchResults] = useState([]);

  useEffect(() => {
    if (team) {
      fetchTeamData();
    }
  }, [team]);

  const fetchTeamData = async () => {
    try {
      // Fetch team members, documents, and work logs
      const [membersRes, docsRes, workLogsRes] = await Promise.all([
        axios.get(`/api/teams/${team.id}/members/`),
        axios.get(`/api/teams/${team.id}/documents/`),
        axios.get(`/api/teams/${team.id}/work-logs/`)
      ]);

      setTeamMembers(membersRes.data.members);
      setTeamDocuments(docsRes.data.documents);
      setTeamWorkLogs(workLogsRes.data.work_logs || []);
    } catch (error) {
      console.error('Error fetching team data:', error);
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    
    try {
      const response = await axios.post(`/api/teams/${team.id}/add-member/`, addMemberData);
      
      if (response.data.success) {
        alert(response.data.message);
        setAddMemberData({ username_or_email: '' });
        setShowAddMemberForm(false);
        setSearchResults([]);
        fetchTeamData(); // Refresh team data
      }
    } catch (error) {
      console.error('Error adding member:', error);
      alert(error.response?.data?.error || 'Error adding member');
    }
  };

  const handleRemoveMember = async (memberId, memberName) => {
    if (!window.confirm(`Are you sure you want to remove ${memberName} from the team?`)) {
      return;
    }
    
    try {
      const response = await axios.post(`/api/teams/${team.id}/remove-member/`, {
        member_id: memberId
      });
      
      if (response.data.success) {
        alert(response.data.message);
        fetchTeamData(); // Refresh team data
      }
    } catch (error) {
      console.error('Error removing member:', error);
      alert(error.response?.data?.error || 'Error removing member');
    }
  };

  const searchUsers = async (query) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    
    try {
      const response = await axios.get(`/api/users/search/?q=${encodeURIComponent(query)}`);
      setSearchResults(response.data.users || []);
    } catch (error) {
      console.error('Error searching users:', error);
      setSearchResults([]);
    }
  };

  const handleDocumentSubmit = async (e) => {
    e.preventDefault();

    try {
      const uploadData = {
        ...documentData,
        team_ids: [team.id]
      };
      
      const response = await axios.post('/api/volunteers/documents/upload/', uploadData);
      
      if (response.data.success) {
        alert(`Document added successfully to ${team.name}!`);
        setDocumentData({ title: '', document_type: 'signed', drive_link: '' });
        setShowDocumentForm(false);
        fetchTeamData(); // Refresh documents
      }
    } catch (error) {
      console.error('Error adding document:', error);
      alert(error.response?.data?.error || 'Error adding document');
    }
  };

  const handleDeleteDocument = async (document) => {
    const confirmMessage = `Are you sure you want to delete "${document.title}"?\n\nThis action cannot be undone.`;
    
    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      const response = await axios.delete(`/api/volunteers/documents/${document.id}/delete/`);
      
      if (response.data.success) {
        alert(response.data.message);
        fetchTeamData(); // Refresh documents
      }
    } catch (error) {
      console.error('Error deleting document:', error);
      alert(error.response?.data?.error || 'Error deleting document');
    }
  };



  const renderMembers = () => {
    // Calculate total hours for each member
    const memberHours = {};
    teamWorkLogs.forEach(log => {
      if (log.status === 'approved') {
        const memberId = log.volunteer_id || log.volunteer;
        memberHours[memberId] = (memberHours[memberId] || 0) + parseFloat(log.hours_worked || 0);
      }
    });

    // Check if user can add members (team leader or admin)
    const canAddMembers = user?.role === 'admin' || 
      teamMembers.some(member => member.username === user?.username && member.role === 'leader');

    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h4>Team Members ({teamMembers.length})</h4>
          {canAddMembers && (
            <button 
              className="btn btn-success"
              onClick={() => setShowAddMemberForm(!showAddMemberForm)}
              style={{ fontSize: '14px' }}
            >
              {showAddMemberForm ? 'Cancel' : '+ Add Member'}
            </button>
          )}
        </div>

        {/* Add Member Form */}
        {showAddMemberForm && canAddMembers && (
          <div className="card" style={{ marginBottom: '20px', backgroundColor: '#f8f9fa' }}>
            <h5>Add New Member</h5>
            <form onSubmit={handleAddMember}>
              <div className="form-group">
                <label>Search by Username or Email:</label>
                <input
                  type="text"
                  value={addMemberData.username_or_email}
                  onChange={(e) => {
                    setAddMemberData({...addMemberData, username_or_email: e.target.value});
                    searchUsers(e.target.value);
                  }}
                  placeholder="Enter username or email address"
                  required
                />
                
                {/* Search Results */}
                {searchResults.length > 0 && (
                  <div style={{ 
                    border: '1px solid #ddd', 
                    borderRadius: '4px', 
                    marginTop: '5px',
                    maxHeight: '200px',
                    overflowY: 'auto',
                    backgroundColor: 'white'
                  }}>
                    {searchResults.map(searchUser => (
                      <div 
                        key={searchUser.id}
                        style={{ 
                          padding: '10px', 
                          borderBottom: '1px solid #eee',
                          cursor: 'pointer',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}
                        onClick={() => {
                          setAddMemberData({username_or_email: searchUser.username});
                          setSearchResults([]);
                        }}
                      >
                        <div>
                          <div><strong>{searchUser.full_name || searchUser.username}</strong></div>
                          <small style={{ color: '#666' }}>
                            {searchUser.email} • {searchUser.college_name}
                          </small>
                        </div>
                        <button 
                          type="button"
                          className="btn btn-primary"
                          style={{ fontSize: '12px', padding: '4px 8px' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setAddMemberData({username_or_email: searchUser.username});
                            setSearchResults([]);
                          }}
                        >
                          Select
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="submit" className="btn btn-success">
                  Add Member
                </button>
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowAddMemberForm(false);
                    setAddMemberData({username_or_email: ''});
                    setSearchResults([]);
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}
        {teamMembers.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '40px 20px', 
            color: '#95a5a6',
            fontStyle: 'italic'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '10px' }}>👥</div>
            <div>No members in this team yet</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '10px' }}>
            {teamMembers.map(member => (
              <div key={member.id} style={{ 
                padding: '15px', 
                border: '1px solid #eee', 
                borderRadius: '4px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <strong>{member.full_name || member.username}</strong>
                  <br />
                  <small style={{ color: '#666' }}>
                    {member.college_name} • {member.course}
                  </small>
                  <br />
                  <small style={{ color: '#888' }}>
                    {member.email}
                  </small>
                  <br />
                  <small style={{ color: '#2563eb', fontWeight: 'bold' }}>
                    Total Hours: {memberHours[member.username] || 0}h
                  </small>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
                  <span style={{ 
                    padding: '4px 8px', 
                    borderRadius: '4px', 
                    backgroundColor: member.role === 'leader' ? '#059669' : '#2563eb',
                    color: 'white',
                    fontSize: '12px'
                  }}>
                    {member.role.toUpperCase()}
                  </span>
                  {canAddMembers && member.role !== 'leader' && (
                    <button 
                      className="btn"
                      onClick={() => handleRemoveMember(member.id, member.full_name || member.username)}
                      style={{ 
                        fontSize: '10px', 
                        padding: '2px 6px',
                        backgroundColor: '#dc3545',
                        color: 'white',
                        border: '1px solid #dc3545'
                      }}
                      title="Remove Member"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderWorkHours = () => {
    const getStatusColor = (status) => {
      const colors = {
        'pending': '#d97706',
        'approved': '#059669',
        'rejected': '#dc2626'
      };
      return colors[status] || '#64748b';
    };

    return (
      <div>
        <h4>Team Work Hours ({teamWorkLogs.length})</h4>
        {teamWorkLogs.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '40px 20px', 
            color: '#95a5a6',
            fontStyle: 'italic'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '10px' }}>⏰</div>
            <div>No work hours logged by team members yet</div>
          </div>
        ) : (
          <div style={{ maxHeight: '400px', overflow: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8f9fa' }}>
                  <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Date</th>
                  <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Member</th>
                  <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Hours</th>
                  <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Project</th>
                  <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Status</th>
                  <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Description</th>
                </tr>
              </thead>
              <tbody>
                {teamWorkLogs.map(log => (
                  <tr key={log.id} style={{ borderBottom: '1px solid #dee2e6' }}>
                    <td style={{ padding: '10px' }}>{new Date(log.date).toLocaleDateString()}</td>
                    <td style={{ padding: '10px' }}>
                      <strong>{log.volunteer_details?.full_name || log.volunteer}</strong>
                      <br />
                      <small style={{ color: '#666' }}>{log.volunteer_details?.college_name}</small>
                    </td>
                    <td style={{ padding: '10px', fontWeight: 'bold', color: '#2563eb' }}>{log.hours_worked}h</td>
                    <td style={{ padding: '10px' }}>
                      <small>{log.project_title || 'No project'}</small>
                    </td>
                    <td style={{ padding: '10px' }}>
                      <span style={{ 
                        padding: '2px 6px', 
                        borderRadius: '3px', 
                        color: 'white',
                        backgroundColor: getStatusColor(log.status),
                        fontSize: '11px'
                      }}>
                        {log.status.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: '10px', maxWidth: '200px' }}>
                      <small style={{ color: '#666' }}>{log.description}</small>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };



  const renderDocuments = () => (
    <div>
      {/* Admin Document Management */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <h4>Team Documents ({teamDocuments.length})</h4>
          <button 
            className="btn btn-primary"
            onClick={() => setShowDocumentForm(!showDocumentForm)}
          >
            {showDocumentForm ? 'Cancel' : 'Add Document'}
          </button>
        </div>
          
          {showDocumentForm && (
            <div style={{ border: '1px solid #ddd', padding: '15px', borderRadius: '4px', backgroundColor: '#f9f9f9', marginBottom: '20px' }}>
              <h5>Add Document to {team.name}</h5>
              <form onSubmit={handleDocumentSubmit}>
                <div className="form-group">
                  <label>Document Title:</label>
                  <input
                    type="text"
                    value={documentData.title}
                    onChange={(e) => setDocumentData({...documentData, title: e.target.value})}
                    placeholder="e.g., Team Guidelines, Project Resources"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>Document Type:</label>
                  <select
                    value={documentData.document_type}
                    onChange={(e) => setDocumentData({...documentData, document_type: e.target.value})}
                  >
                    <option value="signed">NGO Signed Document</option>
                    <option value="proposal">Project Proposal</option>
                    <option value="update">Project Update</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label>Google Drive Link:</label>
                  <input
                    type="url"
                    value={documentData.drive_link}
                    onChange={(e) => setDocumentData({...documentData, drive_link: e.target.value})}
                    placeholder="https://drive.google.com/file/d/..."
                    required
                  />
                  <small style={{ color: '#666', fontSize: '12px' }}>
                    Make sure the link is publicly accessible or shared with team members
                  </small>
                </div>
                
                <button type="submit" className="btn btn-success">
                  Add Document
                </button>
              </form>
            </div>
          )}
        </div>
      )}
      
      {!user?.role === 'admin' && (
        <h4>Team Documents ({teamDocuments.length})</h4>
      )}
      
      {/* Documents List */}
      {teamDocuments.length === 0 ? (
        <div style={{ 
          textAlign: 'center', 
          padding: '40px 20px', 
          color: '#95a5a6',
          fontStyle: 'italic'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '10px' }}>📄</div>
          <div>No documents shared with this team</div>
          <small>Use the "Add Document" button above to share documents with your team</small>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '15px' }}>
          {teamDocuments.map(doc => (
            <div key={doc.id} style={{ 
              padding: '15px', 
              border: '1px solid #ddd', 
              borderRadius: '4px',
              backgroundColor: '#f9f9f9'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div style={{ flex: 1 }}>
                  <h5 style={{ margin: '0 0 8px 0' }}>{doc.title}</h5>
                  <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>
                    <span style={{ 
                      padding: '2px 6px', 
                      borderRadius: '3px', 
                      backgroundColor: '#2563eb',
                      color: 'white',
                      marginRight: '8px'
                    }}>
                      {doc.document_type.toUpperCase()}
                    </span>
                    Uploaded by: {doc.uploaded_by} • {new Date(doc.created_at).toLocaleDateString()}
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: '8px' }}>
                  <a 
                    href={doc.drive_link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="btn btn-primary"
                    style={{ fontSize: '12px', padding: '6px 12px' }}
                  >
                    Open Link
                  </a>
                  {(user?.role === 'admin' || doc.uploaded_by === user?.username) && (
                    <button 
                      className="btn"
                      onClick={() => handleDeleteDocument(doc)}
                      style={{ 
                        fontSize: '12px', 
                        padding: '6px 12px',
                        backgroundColor: '#dc3545',
                        color: 'white',
                        border: '1px solid #dc3545'
                      }}
                    >
                      🗑️ Delete
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
  )

  // Main component return
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
        maxWidth: '90vw', 
        maxHeight: '90vh', 
        overflow: 'auto',
        width: '800px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2>{team.name}</h2>
          <button className="btn btn-danger" onClick={onClose}>×</button>
        </div>
        
        <div style={{ marginBottom: '20px' }}>
          <p><strong>Description:</strong> {team.description}</p>
          <p><strong>Created:</strong> {new Date(team.created_at).toLocaleDateString()}</p>
          <p><strong>Members:</strong> {team.member_count}</p>
        </div>
        
        {/* Tabs */}
        <div className="tab-nav">
          <button 
            className={`tab-button ${activeTab === 'members' ? 'active' : ''}`}
            onClick={() => setActiveTab('members')}
          >
            👥 Members ({teamMembers.length})
          </button>
          <button 
            className={`tab-button ${activeTab === 'workhours' ? 'active' : ''}`}
            onClick={() => setActiveTab('workhours')}
          >
            ⏰ Work Hours ({teamWorkLogs.length})
          </button>
          <button 
            className={`tab-button ${activeTab === 'documents' ? 'active' : ''}`}
            onClick={() => setActiveTab('documents')}
          >
            📄 Documents ({teamDocuments.length})
          </button>
            📄 Documents ({teamDocuments.length})
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'members' && renderMembers()}
        {activeTab === 'workhours' && renderWorkHours()}
        {activeTab === 'documents' && renderDocuments()}
      </div>
    </div>
  );
};

export default TeamDetail;