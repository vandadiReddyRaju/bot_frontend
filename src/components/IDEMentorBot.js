import React, { useState, useEffect } from 'react';
import './IDEMentorBot.css';

// Configure the API URL from environment variables
const API_URL = process.env.REACT_APP_API_URL || 'https://ide-mentor-bot-api.onrender.com';
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB limit

function IDEMentorBot() {
  const [query, setQuery] = useState('');
  const [file, setFile] = useState(null);
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [backendStatus, setBackendStatus] = useState('checking');
  const [uploadProgress, setUploadProgress] = useState(0);

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

  const validateFile = (file) => {
    if (!file.name.endsWith('.zip')) {
      throw new Error('Please upload a zip file');
    }
    if (file.size > MAX_FILE_SIZE) {
      throw new Error('File size exceeds 50MB limit');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResponse('');
    setUploadProgress(0);

    // Keep the old code commented
    // if (backendStatus !== 'connected') {
    //   setError('Cannot process the request, backend not connected.');
    //   setLoading(false);
    //   return;
    // }

    // New implementation with backend check
    if (backendStatus !== 'connected') {
      const confirmProcess = window.confirm('Backend connection issues detected. Do you want to try processing anyway?');
      if (!confirmProcess) {
        setLoading(false);
        return;
      }
    }

    if (!file) {
      setError('Please select a zip file');
      setLoading(false);
      return;
    }

    try {
      validateFile(file);
      
      const formData = new FormData();
      formData.append('zip', file);
      formData.append('query', query);

      const response = await fetch(`${API_URL}/process`, {
        method: 'POST',
        mode: 'cors',
        body: formData,
        headers: {
          'Accept': 'application/json',
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        },
      });
      console.log(response)
      const data = await response.json();
      console.log(data)
      
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
      setUploadProgress(0);
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
            <label htmlFor="file">Upload Zip File (Max 50MB):</label>
            <input
              type="file"
              id="file"
              accept=".zip"
              onChange={(e) => setFile(e.target.files[0])}
              required
            />
          </div>

          <button 
            type="submit"
            disabled={loading}
            className={loading ? 'loading' : ''}
          >
            {loading ? 'Processing...' : 'Run'}
          </button>
          
          {loading && uploadProgress > 0 && (
            <div className="progress-bar">
              <div 
                className="progress" 
                style={{width: `${uploadProgress}%`}}
              ></div>
              <span>{uploadProgress}%</span>
            </div>
          )}
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
