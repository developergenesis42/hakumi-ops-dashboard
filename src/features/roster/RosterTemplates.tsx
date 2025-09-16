import { memo, useState, useCallback, useEffect } from 'react';
import type { Therapist } from '@/types';

interface RosterTemplate {
  id: string;
  name: string;
  therapistIds: string[];
  createdAt: Date;
  description?: string;
}

interface RosterTemplatesProps {
  currentRoster: Therapist[];
  allTherapists: Therapist[];
  onLoadTemplate: (therapistIds: string[]) => void;
  onSaveTemplate: (template: Omit<RosterTemplate, 'id' | 'createdAt'>) => void;
  onDeleteTemplate: (templateId: string) => void;
}

/**
 * Template management component for saving and loading roster configurations
 * Allows users to save common roster setups and quickly load them
 */
const RosterTemplates = memo(function RosterTemplates({
  currentRoster,
  allTherapists,
  onLoadTemplate,
  onSaveTemplate,
  onDeleteTemplate
}: RosterTemplatesProps) {
  const [templates, setTemplates] = useState<RosterTemplate[]>([]);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');
  const [showLoadModal, setShowLoadModal] = useState(false);

  // Load templates from localStorage on mount
  useEffect(() => {
    const savedTemplates = localStorage.getItem('roster-templates');
    if (savedTemplates) {
      try {
        const parsed = JSON.parse(savedTemplates).map((t: { name: string; therapistIds: string[]; createdAt: string }) => ({
          ...t,
          createdAt: new Date(t.createdAt)
        }));
        setTemplates(parsed);
      } catch (error) {
        console.error('Failed to load templates:', error);
      }
    }
  }, []);

  // Save templates to localStorage whenever templates change
  useEffect(() => {
    localStorage.setItem('roster-templates', JSON.stringify(templates));
  }, [templates]);

  const handleSaveTemplate = useCallback(() => {
    if (!templateName.trim() || currentRoster.length === 0) return;

    const newTemplate: RosterTemplate = {
      id: Date.now().toString(),
      name: templateName.trim(),
      therapistIds: currentRoster.map(t => t.id),
      createdAt: new Date(),
      description: templateDescription.trim() || undefined
    };

    setTemplates(prev => [...prev, newTemplate]);
    onSaveTemplate(newTemplate);
    setTemplateName('');
    setTemplateDescription('');
    setShowSaveModal(false);
  }, [templateName, templateDescription, currentRoster, onSaveTemplate]);

  const handleLoadTemplate = useCallback((template: RosterTemplate) => {
    onLoadTemplate(template.therapistIds);
    setShowLoadModal(false);
  }, [onLoadTemplate]);

  const handleDeleteTemplate = useCallback((templateId: string) => {
    if (window.confirm('Are you sure you want to delete this template?')) {
      setTemplates(prev => prev.filter(t => t.id !== templateId));
      onDeleteTemplate(templateId);
    }
  }, [onDeleteTemplate]);

  const getTherapistNames = useCallback((therapistIds: string[]) => {
    return therapistIds
      .map(id => allTherapists.find(t => t.id === id)?.name)
      .filter(Boolean)
      .join(', ');
  }, [allTherapists]);

  return (
    <div className="space-y-4">
      {/* Template Actions */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setShowSaveModal(true)}
          disabled={currentRoster.length === 0}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors font-medium flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          Save Template
        </button>
        
        <button
          onClick={() => setShowLoadModal(true)}
          disabled={templates.length === 0}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors font-medium flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
          </svg>
          Load Template
        </button>
      </div>

      {/* Quick Templates */}
      {templates.length > 0 && (
        <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-600">
          <h3 className="text-sm font-medium text-gray-300 mb-3">Quick Templates</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {templates.slice(0, 4).map(template => (
              <div key={template.id} className="flex items-center justify-between p-2 bg-gray-700 rounded border border-gray-600">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-white truncate">{template.name}</div>
                  <div className="text-xs text-gray-400 truncate">
                    {template.therapistIds.length} therapist{template.therapistIds.length !== 1 ? 's' : ''}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleLoadTemplate(template)}
                    className="p-1 text-blue-400 hover:text-blue-300 transition-colors"
                    title="Load template"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDeleteTemplate(template.id)}
                    className="p-1 text-red-400 hover:text-red-300 transition-colors"
                    title="Delete template"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Save Template Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl p-6 max-w-md w-full border border-gray-600">
            <h3 className="text-lg font-semibold text-white mb-4">Save Roster Template</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Template Name</label>
                <input
                  type="text"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="e.g., Morning Shift, VIP Team"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Description (Optional)</label>
                <textarea
                  value={templateDescription}
                  onChange={(e) => setTemplateDescription(e.target.value)}
                  placeholder="Brief description of this roster configuration"
                  rows={3}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 resize-none"
                />
              </div>
              
              <div className="bg-gray-700/50 rounded-lg p-3">
                <div className="text-sm text-gray-300 mb-2">Current Roster ({currentRoster.length} therapists):</div>
                <div className="text-xs text-gray-400">
                  {currentRoster.map(t => t.name).join(', ')}
                </div>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowSaveModal(false)}
                className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveTemplate}
                disabled={!templateName.trim()}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
              >
                Save Template
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Load Template Modal */}
      {showLoadModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl p-6 max-w-2xl w-full border border-gray-600 max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-white mb-4">Load Roster Template</h3>
            
            {templates.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <svg className="w-12 h-12 mx-auto mb-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p>No templates saved yet</p>
                <p className="text-sm">Save your first template to get started</p>
              </div>
            ) : (
              <div className="space-y-3">
                {templates.map(template => (
                  <div key={template.id} className="bg-gray-700 rounded-lg p-4 border border-gray-600">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h4 className="text-white font-medium mb-1">{template.name}</h4>
                        {template.description && (
                          <p className="text-sm text-gray-400 mb-2">{template.description}</p>
                        )}
                        <div className="text-xs text-gray-500 mb-2">
                          {template.therapistIds.length} therapist{template.therapistIds.length !== 1 ? 's' : ''} • 
                          Created {template.createdAt.toLocaleDateString()}
                        </div>
                        <div className="text-xs text-gray-400">
                          {getTherapistNames(template.therapistIds)}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <button
                          onClick={() => handleLoadTemplate(template)}
                          className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
                        >
                          Load
                        </button>
                        <button
                          onClick={() => handleDeleteTemplate(template.id)}
                          className="p-1 text-red-400 hover:text-red-300 transition-colors"
                          title="Delete template"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowLoadModal(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

export default RosterTemplates;
