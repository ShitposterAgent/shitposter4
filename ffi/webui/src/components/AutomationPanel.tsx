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
  const [history, setHistory] = useState<string[]>([]);

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
        addToHistory('Initialized Playwright');
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
        
        // Add to history based on action type
        if (actionType === 'navigate') {
          addToHistory(`Navigated to: ${url}`);
        } else if (actionType === 'click') {
          addToHistory(`Clicked: ${selector}`);
        } else if (actionType === 'type') {
          addToHistory(`Typed in ${selector}: ${text.substring(0, 15)}${text.length > 15 ? '...' : ''}`);
        }
      } else {
        setStatus({ type: 'error', message: data.message || 'Action failed' });
      }
    } catch (error) {
      setStatus({ type: 'error', message: 'Failed to execute action' });
    } finally {
      setLoading(false);
    }
  };

  const addToHistory = (entry: string) => {
    setHistory(prev => [entry, ...prev].slice(0, 10)); // Keep only last 10 actions
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
      <div className="md:col-span-2">
        <div className="card w-full">
          <h2 className="text-2xl font-bold mb-6">Automation Control Panel</h2>
          
          <div className="mb-6">
            <button 
              className={`btn ${initialized ? 'bg-green-500' : 'btn-primary'} w-full`} 
              onClick={initializePlaywright}
              disabled={loading || initialized}
            >
              {initialized ? 'Playwright Initialized ✓' : 'Initialize Playwright'}
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
      </div>
      
      <div className="md:col-span-1">
        <div className="card w-full h-full">
          <h2 className="text-xl font-bold mb-4">Action History</h2>
          {history.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 italic">No actions performed yet</p>
          ) : (
            <ul className="space-y-2 max-h-[300px] overflow-y-auto">
              {history.map((action, index) => (
                <li key={index} className="border-b border-gray-200 dark:border-gray-700 pb-2">
                  {action}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
