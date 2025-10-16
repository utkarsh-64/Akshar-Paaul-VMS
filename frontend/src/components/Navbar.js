import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();

  return (
    <nav className="navbar">
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <Link to="/dashboard" style={{ 
          fontSize: '20px', 
          fontWeight: '800', 
          marginRight: '40px',
          color: '#f1f5f9',
          textDecoration: 'none',
          background: 'linear-gradient(135deg, #f1f5f9 0%, #cbd5e1 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}>
          📚 Akshar Paaul VMS
        </Link>
        
        {user?.role === 'volunteer' && (
          <>
            <Link to="/work-logs">📊 Work Logs</Link>
            <Link to="/projects">🚀 Projects</Link>
            <Link to="/documents">📁 Documents</Link>
            <Link to="/teams">👥 Teams</Link>
          </>
        )}
        {user?.role === 'admin' && (
          <>
            <Link to="/admin">⚡ Admin Dashboard</Link>
            <Link to="/work-logs">📊 All Work Logs</Link>
            <Link to="/projects">🚀 All Projects</Link>
            <Link to="/documents">📁 All Documents</Link>
            <Link to="/teams">👥 All Teams</Link>
          </>
        )}
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
        <div style={{ 
          padding: '12px 20px', 
          background: 'linear-gradient(135deg, rgba(71, 85, 105, 0.3), rgba(51, 65, 85, 0.3))', 
          borderRadius: '12px',
          fontSize: '14px',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(71, 85, 105, 0.3)'
        }}>
          <span style={{ color: '#cbd5e1' }}>Welcome, </span>
          <strong style={{ color: '#f1f5f9' }}>{user?.username}</strong>
          <span style={{ 
            marginLeft: '12px',
            padding: '4px 12px',
            background: user?.role === 'admin' ? 
              'linear-gradient(135deg, #dc2626, #b91c1c)' : 
              'linear-gradient(135deg, #059669, #047857)',
            borderRadius: '20px',
            fontSize: '10px',
            textTransform: 'uppercase',
            fontWeight: '600',
            color: 'white',
            letterSpacing: '0.5px'
          }}>
            {user?.role}
          </span>
        </div>
        
        <button 
          className="btn btn-danger" 
          onClick={logout}
          style={{ 
            padding: '8px 16px',
            fontSize: '12px'
          }}
        >
          Sign Out
        </button>
      </div>
    </nav>
  );
};

export default Navbar;