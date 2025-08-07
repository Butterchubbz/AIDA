import React, { useState, useEffect } from 'react';

function StatusDashboard() {
  const [pbStatus, setPbStatus] = useState('Checking...');
  const [pbMessage, setPbMessage] = useState('');

  useEffect(() => {
    // Listen for status updates from the main process
    window.api.onPocketbaseStatus((data) => {
      console.log('Received status from main:', data);
      setPbStatus(data.status);
      setPbMessage(data.message);
    });
  }, []);

  const handleRestart = () => {
    setPbStatus('Restarting...');
    setPbMessage('');
    window.api.restartPocketbase();
  };

  const handleOpenAida = () => {
    // This tells the main process to open the PocketBase admin URL
    // in the user's default system browser.
    window.api.openAidaInBrowser();
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>AIDA Controller</h1>
      
      <h2>Status</h2>
      <p><strong>PocketBase:</strong> <span style={{ color: pbStatus === 'running' ? 'green' : 'red' }}>{pbStatus.toUpperCase()}</span></p>
      <p><strong>AIDA UI:</strong> <span style={{ color: 'green' }}>RUNNING</span> (This panel)</p>

      <h2>Actions</h2>
      <button onClick={handleRestart}>Reboot PocketBase</button>
      <button onClick={handleOpenAida} disabled={pbStatus !== 'running'}>
        Open AIDA in Browser
      </button>

      <pre style={{ marginTop: '20px', background: '#f0f0f0', padding: '10px', maxHeight: '200px', overflowY: 'auto', whiteSpace: 'pre-wrap' }}>
        {pbMessage || 'Waiting for PocketBase logs...'}
      </pre>
    </div>
  );
}

export default StatusDashboard;
