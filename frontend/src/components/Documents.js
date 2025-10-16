import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const Documents = () => {
  const { user } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState('all');
  const [documentType, setDocumentType] = useState('all');

  useEffect(() => {
    fetchDocuments();
    fetchTeams();
  }, [user]);

  const fetchTeams = async () => {
    try {
      const response = await axios.get('/api/teams/');
      setTeams(response.data.teams);
    } catch (error) {
      console.error('Error fetching teams:', error);
    }
  };

  const fetchDocuments = async () => {
    try {
      const response = await axios.get('/api/volunteers/documents/');
      setDocuments(response.data.documents);
    } catch (error) {
      console.error('Error fetching documents:', error);
    }
  };

  // Filter documents based on selected team and type
  const filteredDocuments = documents.filter(doc => {
    const teamMatch = selectedTeam === 'all' || 
      (selectedTeam === 'global' && (!doc.team_access || doc.team_access.length === 0)) ||
      (selectedTeam !== 'global' && doc.team_access && doc.team_access.some(access => access.team_id === parseInt(selectedTeam)));
    
    const typeMatch = documentType === 'all' || doc.document_type === documentType;
    
    return teamMatch && typeMatch;
  });

  const handleDeleteDocument = async (document) => {
    const confirmMessage = `Are you sure you want to delete "${document.title}"?\n\nThis action cannot be undone.`;
    
    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      const response = await axios.delete(`/api/volunteers/documents/${document.id}/delete/`);
      
      if (response.data.success) {
        alert(response.data.message);
        fetchDocuments(); // Refresh the document list
      }
    } catch (error) {
      console.error('Error deleting document:', error);
      
      if (error.response?.data?.error) {
        alert(`Cannot delete document: ${error.response.data.error}`);
      } else {
        alert('Error deleting document. Please try again.');
      }
    }
  };

  const canDeleteDocument = (document) => {
    // Users can delete their own documents, admins can delete any document
    return document.uploaded_by === user?.username || user?.role === 'admin';
  };

  const getDocumentTypeLabel = (type) => {
    const labels = {
      'submission': 'Volunteer Submission',
      'signed': 'NGO Signed Document',
      'proposal': 'Project Proposal',
      'update': 'Project Update'
    };
    return labels[type] || type;
  };

  const getDocumentTypeColor = (type) => {
    const colors = {
      'submission': '#007bff',
      'signed': '#28a745',
      'proposal': '#ffc107',
      'update': '#6c757d'
    };
    return colors[type] || '#6c757d';
  };

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>Document Library</h1>
        <div style={{ fontSize: '14px', color: '#666' }}>
          📁 Centralized document access - Upload and manage documents through team pages
        </div>
      </div>

      {/* Info Card */}
      <div className="card" style={{ backgroundColor: '#f8f9fa', border: '1px solid #e9ecef', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{ fontSize: '32px' }}>📋</div>
          <div>
            <h3 style={{ margin: '0 0 5px 0', color: '#495057' }}>Document Management</h3>
            <p style={{ margin: '0', fontSize: '14px', color: '#6c757d' }}>
              Documents are now managed through team pages for better organization. 
              Use the filters below to browse existing documents, or visit team pages to upload new ones.
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label>Filter by Team:</label>
            <select
              value={selectedTeam}
              onChange={(e) => setSelectedTeam(e.target.value)}
              style={{ fontSize: '14px' }}
            >
              <option value="all">All Documents</option>
              <option value="global">Global Documents</option>
              {teams.map(team => (
                <option key={team.id} value={team.id}>
                  {team.name} ({team.member_count} members)
                </option>
              ))}
            </select>
          </div>
          
          <div className="form-group" style={{ margin: 0 }}>
            <label>Filter by Type:</label>
            <select
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value)}
              style={{ fontSize: '14px' }}
            >
              <option value="all">All Types</option>
              <option value="submission">Volunteer Submissions</option>
              <option value="proposal">Project Proposals</option>
              <option value="update">Project Updates</option>
              <option value="signed">NGO Signed Documents</option>
            </select>
          </div>
        </div>
        
        <div style={{ marginTop: '10px', fontSize: '12px', color: '#6c757d' }}>
          Showing {filteredDocuments.length} of {documents.length} documents
        </div>
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Type</th>
              <th>Uploaded By</th>
              <th>Team Access</th>
              <th>Upload Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredDocuments.map(doc => (
              <tr key={doc.id}>
                <td>
                  <div>{doc.title}</div>
                  {doc.is_global && (
                    <small style={{ color: '#28a745', fontSize: '11px' }}>
                      🌐 Global Access
                    </small>
                  )}
                </td>
                <td>
                  <span 
                    style={{ 
                      padding: '2px 6px', 
                      borderRadius: '3px', 
                      color: 'white',
                      backgroundColor: getDocumentTypeColor(doc.document_type),
                      fontSize: '11px'
                    }}
                  >
                    {getDocumentTypeLabel(doc.document_type)}
                  </span>
                </td>
                <td>
                  <div>{doc.uploaded_by}</div>
                  {doc.uploaded_by_details?.full_name && (
                    <small style={{ color: '#666', fontSize: '11px' }}>
                      {doc.uploaded_by_details.full_name}
                    </small>
                  )}
                </td>
                <td>
                  {doc.team_access && doc.team_access.length > 0 ? (
                    <div>
                      {doc.team_access.map((access, index) => (
                        <span 
                          key={access.team_id}
                          style={{ 
                            display: 'inline-block',
                            padding: '2px 6px', 
                            margin: '1px',
                            borderRadius: '10px', 
                            backgroundColor: '#e3f2fd',
                            color: '#1976d2',
                            fontSize: '10px',
                            border: '1px solid #bbdefb'
                          }}
                        >
                          👥 {access.team_name}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span style={{ 
                      fontSize: '11px', 
                      color: '#28a745',
                      fontWeight: '600'
                    }}>
                      🌐 All Users
                    </span>
                  )}
                </td>
                <td>{new Date(doc.created_at).toLocaleDateString()}</td>
                <td>
                  <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                    {doc.drive_link && (
                      <a 
                        href={doc.drive_link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="btn btn-primary"
                        style={{ fontSize: '12px', padding: '4px 8px' }}
                      >
                        Open Link
                      </a>
                    )}
                    {canDeleteDocument(doc) && (
                      <button 
                        className="btn"
                        onClick={() => handleDeleteDocument(doc)}
                        style={{ 
                          fontSize: '12px', 
                          padding: '4px 8px',
                          backgroundColor: '#dc3545',
                          color: 'white',
                          border: '1px solid #dc3545'
                        }}
                        onMouseOver={(e) => {
                          e.target.style.backgroundColor = '#c82333';
                          e.target.style.borderColor = '#bd2130';
                        }}
                        onMouseOut={(e) => {
                          e.target.style.backgroundColor = '#dc3545';
                          e.target.style.borderColor = '#dc3545';
                        }}
                      >
                        🗑️ Delete
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {filteredDocuments.length === 0 && documents.length > 0 && (
          <div style={{ 
            textAlign: 'center', 
            padding: '40px 20px', 
            color: '#95a5a6',
            fontStyle: 'italic'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '10px' }}>🔍</div>
            <div>No documents match your filters</div>
            <small>Try adjusting the team or type filters above</small>
          </div>
        )}
        
        {documents.length === 0 && (
          <div style={{ 
            textAlign: 'center', 
            padding: '40px 20px', 
            color: '#95a5a6',
            fontStyle: 'italic'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '10px' }}>📄</div>
            <div>No documents available</div>
            <small>Documents will appear here once uploaded through team pages</small>
          </div>
        )}
      </div>
    </div>
  );
};

export default Documents;