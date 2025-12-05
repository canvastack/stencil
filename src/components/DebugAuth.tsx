import React, { useState } from 'react';
import { authService } from '../services/api/auth';
import { debugAuth } from '@/utils/debug';

/**
 * Debug component for testing authentication - only shown in development
 */
export const DebugAuth: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  const [authState, setAuthState] = useState<any>(null);

  // Disabled - now integrated into DevDebugger
  return null;
  
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  const handleClearAuth = () => {
    console.log('DebugAuth: Force clearing all authentication data');
    authService.forceAuthReset();
  };

  const handleForceLogout = () => {
    console.log('DebugAuth: Force logout and redirect to login');
    authService.forceLogout();
  };

  const handleDebugAuth = () => {
    const state = authService.debugAuthState();
    console.log('DebugAuth: Current auth state:', state);
    
    // Use debug utility
    debugAuth('Current Auth State', state);
    
    setAuthState(state);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setAuthState(null);
  };

  const copyToClipboard = () => {
    const text = JSON.stringify(authState, null, 2);
    navigator.clipboard.writeText(text).then(() => {
      console.log('Auth state copied to clipboard');
    }).catch(err => {
      console.error('Failed to copy to clipboard:', err);
    });
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: '10px',
      left: '10px',
      zIndex: 9999,
      background: '#333',
      color: 'white',
      padding: '8px',
      borderRadius: '5px',
      fontSize: '11px',
      opacity: 0.8,
      boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
    }}>
      <div style={{ marginBottom: '4px', fontWeight: 'bold' }}>Debug Auth</div>
      <div>
        <button 
          onClick={handleDebugAuth}
          style={{ 
            margin: '1px', 
            padding: '3px 6px', 
            fontSize: '9px',
            background: '#555',
            color: 'white',
            border: 'none',
            borderRadius: '3px',
            cursor: 'pointer'
          }}
        >
          Check State
        </button>
        <button 
          onClick={handleClearAuth}
          style={{ 
            margin: '1px', 
            padding: '3px 6px', 
            fontSize: '9px', 
            background: '#d32f2f',
            color: 'white',
            border: 'none',
            borderRadius: '3px',
            cursor: 'pointer'
          }}
        >
          Clear Auth
        </button>
        <button 
          onClick={handleForceLogout}
          style={{ 
            margin: '1px', 
            padding: '3px 6px', 
            fontSize: '9px', 
            background: '#1976d2',
            color: 'white',
            border: 'none',
            borderRadius: '3px',
            cursor: 'pointer'
          }}
        >
          Go Login
        </button>
      </div>

      {/* Modal for displaying auth state */}
      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 10000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{
            backgroundColor: 'white',
            color: 'black',
            padding: '20px',
            borderRadius: '8px',
            maxWidth: '90vw',
            maxHeight: '90vh',
            overflow: 'auto',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
            fontFamily: 'monospace',
            fontSize: '12px'
          }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '15px',
              borderBottom: '1px solid #eee',
              paddingBottom: '10px'
            }}>
              <h3 style={{ margin: 0, fontWeight: 'bold' }}>Authentication State</h3>
              <div>
                <button
                  onClick={copyToClipboard}
                  style={{
                    padding: '5px 10px',
                    marginRight: '10px',
                    background: '#4CAF50',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '11px'
                  }}
                >
                  Copy
                </button>
                <button
                  onClick={closeModal}
                  style={{
                    padding: '5px 10px',
                    background: '#f44336',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '11px'
                  }}
                >
                  Close
                </button>
              </div>
            </div>
            <pre style={{
              margin: 0,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              background: '#f5f5f5',
              padding: '15px',
              borderRadius: '4px',
              border: '1px solid #ddd',
              maxHeight: '60vh',
              overflow: 'auto'
            }}>
              {JSON.stringify(authState, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};

export default DebugAuth;