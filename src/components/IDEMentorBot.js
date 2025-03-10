import React, { useState, useEffect } from 'react';
import './IDEMentorBot.css';

const API_URL = 'https://ide-mentor-bot-api.onrender.com';

function IDEMentorBot() {
  const [query, setQuery] = useState('');
  const [file, setFile] = useState(null);
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [backendStatus, setBackendStatus] = useState('checking');

  useEffect(() => {
    const checkBackend = async () => {
      try {
        const res = await fetch(`${API_URL}/`, {
          method: 'GET',
          mode: 'cors',
          headers: { 'Accept': 'application/json' },
        });

        if (res.ok) {
          setBackendStatus('connected');
        } else {
          throw new Error(`Status ${res.status}`);
        }
      } catch (err) {
        console.error('Backend Error:', err);
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

    if (!file) {
      setError('Please select a zip file.');
      setLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append('zip', file);
    formData.append('query', query);

    try {
      const res = await fetch(`${API_URL}/process`, {
        method: 'POST',
        mode: 'cors',
        body: formData,
        headers: {
          'Accept': 'application/json',
        },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Something went wrong.');
      }

      setResponse(data.response);
      setBackendStatus('connected');
    } catch (err) {
      console.error('Error details:', err);

      if (!navigator.onLine) {
        setError('You are offline. Please check your internet connection.');
      } else if (err.message.includes('Failed to fetch')) {
        setError('Cannot connect to the server. Please check the deployment.');
        setBackendStatus('error');
      } else {
        setError(err.message || 'Failed to process the request.');
      }
    } finally {
      setLoading(false);
    }
  };

  const retryConnection = async () => {
    setBackendStatus('checking');
    try {
      const res = await fetch(`${API_URL}/`, {
        method: 'GET',
        mode: 'cors',
        headers: { 'Accept': 'application/json' },
      });

      if (res.ok) {
        setBackendStatus('connected');
      } else {
        throw new Error(`Status ${res.status}`);
      }
    } catch (err) {
      console.error('Connection Error:', err);
      setBackendStatus('error');
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
              <button 
                className="retry-button" 
                onClick={retryConnection}
                disabled={backendStatus === 'checking'}
              >
                 {backendStatus === 'checking' ? 'Checking...' : 'Retry'}
              </button>
            </span>
          )}
        </div>

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label>Your Query:</label>
            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="E.g., Test case failed. Can you help me?"
              required
            />
          </div>

          <div className="input-group">
            <label>Upload Zip File:</label>
            <input
              type="file"
              id="file"
              onChange={(e) => setFile(e.target.files[0])}
              required
            />
          </div>

          <button type="submit" disabled={loading}>
            {loading ? 'Processing...' : 'Run'}
          </button>
        </form>

        {error && <div className="error">{error}</div>}
      </div>

      <div className='container-2'>
        <h1>Response</h1>
        {response && (
          <div>
            <button onClick={handleCopy} className="copy-button">
              Copy
            </button>
            <pre>{response}</pre>
          </div>
        )}
      </div>
    </div>
  );
}

export default IDEMentorBot;
