import { useState, useEffect } from 'react';
import { usePrintReceipt } from '@/features/hooks/usePrintReceipt';
import { printNodeService } from '@/features/services/printNodeService';

interface PrintSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PrintSettings({ isOpen, onClose }: PrintSettingsProps) {
  const { testPrintConnection, isPrintNodeConfigured } = usePrintReceipt();
  const [apiKey, setApiKey] = useState('');
  const [printerId, setPrinterId] = useState('');
  const [isTesting, setIsTesting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Load current settings from environment or localStorage
      const savedApiKey = localStorage.getItem('printnode_api_key') || '';
      const savedPrinterId = localStorage.getItem('printnode_printer_id') || '';
      setApiKey(savedApiKey);
      setPrinterId(savedPrinterId);
    }
  }, [isOpen]);

  const handleSave = () => {
    if (apiKey && printerId) {
      // Save to localStorage
      localStorage.setItem('printnode_api_key', apiKey);
      localStorage.setItem('printnode_printer_id', printerId);
      
      // Update service credentials
      printNodeService.setCredentials(apiKey, printerId);
      
      onClose();
    }
  };

  const handleTest = async () => {
    if (apiKey && printerId) {
      setIsTesting(true);
      try {
        printNodeService.setCredentials(apiKey, printerId);
        await testPrintConnection();
      } finally {
        setIsTesting(false);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Print Settings</h2>
        </div>
        
        <div className="px-6 py-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              PrintNode API Key
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your PrintNode API key"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Printer ID
            </label>
            <input
              type="text"
              value={printerId}
              onChange={(e) => setPrinterId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your printer ID"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${isPrintNodeConfigured ? 'bg-green-500' : 'bg-gray-400'}`}></div>
            <span className="text-sm text-gray-600">
              {isPrintNodeConfigured ? 'PrintNode configured' : 'PrintNode not configured'}
            </span>
          </div>
        </div>
        
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleTest}
            disabled={!apiKey || !printerId || isTesting}
            className="px-4 py-2 text-blue-600 border border-blue-300 rounded-md hover:bg-blue-50 disabled:opacity-50"
          >
            {isTesting ? 'Testing...' : 'Test Connection'}
          </button>
          <button
            onClick={handleSave}
            disabled={!apiKey || !printerId}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
