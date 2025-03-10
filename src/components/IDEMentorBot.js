import React, { useState, useEffect } from 'react';
import './IDEMentorBot.css';

// Configure the API URL
const API_URL = 'https://ide-mentor-bot-api.onrender.com';

function IDEMentorBot() {
  const [query, setQuery] = useState('');
  const [file, setFile] = useState(null);
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [backendStatus, setBackendStatus] = useState('checking');

  // Check backend status only once on component mount
  useEffect(() => {
    const checkBackend = async () => {
      try {
        const response = await fetch(`${API_URL}/`, {
          method: 'GET',
          mode: 'cors',
          headers: {
            'Accept': 'application/json',
          },
        });
        
        if (response.ok) {
          setBackendStatus('connected');
          setError('');
        } else {
          throw new Error(`Backend returned status ${response.status}`);
        }
      } catch (err) {
        console.error('Backend connection error:', err);
        setBackendStatus('error');
      }
    };
    
    checkBackend();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResponse('');

    // ✅ Removed the backend status check - Now it will process regardless of connection
    // if (backendStatus !== 'connected') {
    //   setError('Cannot process the request, backend not connected.');
    //   setLoading(false);
    //   return;
    // }

    if (!file) {
      setError('Please select a zip file');
      setLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append('zip', file);
    formData.append('query', query);

    try {
      const response = await fetch(`${API_URL}/process`, {
        method: 'POST',
        mode: 'cors',
        body: formData,
        headers: {
          'Accept': 'application/json',
        },
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong');
      }

      setResponse(data.response);
      setBackendStatus('connected');
    } catch (err) {
      console.error('Error details:', err);
      setError(err.message || 'Failed to process the request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(response);
    alert('Response copied to clipboard!');
  };

  return (
    <div className="ide-mentor-bot">
      <div className="container-1">
        <h1>IDE Mentor Bot</h1>
        <div className="status-indicator">
          Status: {backendStatus === 'connected' ? (
            <span className="status-connected">Connected to {API_URL}</span>
          ) : (
            <span className="status-error">
              Disconnected from {API_URL}
            </span>
          )}
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label htmlFor="query">Your Query:</label>
            <textarea
              id="query"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="E.g., Test cases failed, can you help me with my mistakes?"
              required
            />
          </div>
          
          <div className="input-group">
            <label htmlFor="file">Upload Zip File:</label>
            <input
              type="file"
              id="file"
              onChange={(e) => setFile(e.target.files[0])}
              required
            />
          </div>

          <button 
            type="submit"
          >
            Run
          </button>
        </form>

        {error && <div className="error">{error}</div>}
      </div>
      <div className='container-2' style={{ position: 'relative' }}>
        <h1>Response</h1>
        {response && (
          <div style={{ position: 'relative', border: '1px solid #ccc', borderRadius: '5px', padding: '10px' }}>
            <button
              onClick={handleCopy}
              className="copy-button"
            >
              Copy
            </button>
            <pre style={{ margin: '0', whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}>
              {response}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}

export default IDEMentorBot;
