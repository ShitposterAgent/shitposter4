'use client';

import { useState } from 'react';
import { ActionType, ActionStatus } from '@/types/automation';

export default function AutomationPanel() {
  const [initialized, setInitialized] = useState(false);
  const [url, setUrl] = useState('');
  const [selector, setSelector] = useState('');
  const [text, setText] = useState('');
  const [actionType, setActionType] = useState<ActionType>('navigate');
  const [status, setStatus] = useState<ActionStatus | null>(null);
  const [loading, setLoading] = useState(false);

  const initializePlaywright = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/init', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      
      if (data.status === 'success') {
        setInitialized(true);
        setStatus({ type: 'success', message: 'Playwright initialized' });
      } else {
        setStatus({ type: 'error', message: data.message || 'Failed to initialize Playwright' });
      }
    } catch (error) {
      setStatus({ type: 'error', message: 'Failed to connect to the server' });
    } finally {
      setLoading(false);
    }
  };

  const executeAction = async () => {
    setLoading(true);
    try {
      if (!initialized) {
        setStatus({ type: 'error', message: 'Please initialize Playwright first' });
        setLoading(false);
        return;
      }

      const payload: Record<string, any> = { action: actionType };
      
      if (actionType === 'navigate' && url) {
        payload.url = url;
      } else if (actionType === 'click' && selector) {
        payload.selector = selector;
      } else if (actionType === 'type' && selector && text) {
        payload.selector = selector;
        payload.text = text;
      } else {
        setStatus({ type: 'error', message: 'Missing required fields for this action' });
        setLoading(false);
        return;
      }

      const response = await fetch('/api/action', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      
      const data = await response.json();
      
      if (data.status === 'success') {
        setStatus({ type: 'success', message: data.message });
      } else {
        setStatus({ type: 'error', message: data.message || 'Action failed' });
      }
    } catch (error) {
      setStatus({ type: 'error', message: 'Failed to execute action' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card w-full max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Automation Control Panel</h2>
      
      <div className="mb-6">
        <button 
          className={`btn ${initialized ? 'bg-green-500' : 'btn-primary'} w-full`} 
          onClick={initializePlaywright}
          disabled={loading || initialized}
        >
          {initialized ? 'Playwright Initialized' : 'Initialize Playwright'}
        </button>
      </div>
      
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Action Type</label>
        <select 
          className="input w-full"
          value={actionType}
          onChange={(e) => setActionType(e.target.value as ActionType)}
          disabled={loading || !initialized}
        >
          <option value="navigate">Navigate</option>
          <option value="click">Click</option>
          <option value="type">Type Text</option>
        </select>
      </div>
      
      {actionType === 'navigate' && (
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">URL</label>
          <input
            type="text"
            className="input w-full"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com"
            disabled={loading || !initialized}
          />
        </div>
      )}
      
      {(actionType === 'click' || actionType === 'type') && (
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Element Selector</label>
          <input
            type="text"
            className="input w-full"
            value={selector}
            onChange={(e) => setSelector(e.target.value)}
            placeholder="CSS selector (e.g., #submit-button)"
            disabled={loading || !initialized}
          />
        </div>
      )}
      
      {actionType === 'type' && (
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Text to Type</label>
          <input
            type="text"
            className="input w-full"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Text to input"
            disabled={loading || !initialized}
          />
        </div>
      )}
      
      <div className="mb-6">
        <button 
          className="btn btn-secondary w-full" 
          onClick={executeAction}
          disabled={loading || !initialized}
        >
          {loading ? 'Executing...' : 'Execute Action'}
        </button>
      </div>
      
      {status && (
        <div className={`p-4 rounded-md ${status.type === 'success' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'}`}>
          {status.message}
        </div>
      )}
    </div>
  );
}
