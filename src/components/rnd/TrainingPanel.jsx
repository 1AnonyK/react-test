// components/rnd/TrainingPanel.jsx
//
// This React component provides a simple training data submission interface for
// research and development work. Team members can submit corrections,
// teach new phrases or slang, or upload an external source. It uses the
// nvidiaGpuSystems client to persist records to the AITrainingData entity.

import React, { useState } from 'react';
import nvidiaGpuSystems from '@/api/nvidiaGpuSystemsClient';

/**
 * AI Training Panel component.
 *
 * @param {Object} props
 * @param {Object} props.user The authenticated user object.
 * @param {string} props.selectedLanguage The currently selected language for submissions.
 */
export default function TrainingPanel({ user, selectedLanguage }) {
  const [activeTab, setActiveTab] = useState('correction');
  const [formData, setFormData] = useState({ original: '', correction: '', context: '', sourceUrl: '', sourceContent: '' });
  const [submissionsToday, setSubmissionsToday] = useState(0);
  const dailyLimit = 50;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submissionsToday >= dailyLimit) {
      alert('Daily submission limit reached. Please try again tomorrow.');
      return;
    }
    const payload = {
      type: activeTab === 'correction' ? 'correction' : activeTab === 'phrase' ? 'phrase' : activeTab === 'slang' ? 'slang' : 'source',
      language: selectedLanguage,
      original: formData.original,
      correction: formData.correction,
      context: formData.context,
      source_url: formData.sourceUrl,
      source_content: formData.sourceContent,
      submitted_by: user?.email || 'anonymous',
      approved: false,
    };
    try {
      await nvidiaGpuSystems.entities.AITrainingData.create(payload);
      setSubmissionsToday((prev) => prev + 1);
      setFormData({ original: '', correction: '', context: '', sourceUrl: '', sourceContent: '' });
      alert('Submission recorded. Thank you for your contribution!');
    } catch (err) {
      console.error(err);
      alert('Failed to save your submission.');
    }
  };

  const renderForm = () => {
    switch (activeTab) {
      case 'correction':
        return (
          <div className="space-y-2">
            <input
              type="text"
              placeholder="Original sentence"
              value={formData.original}
              onChange={(e) => setFormData({ ...formData, original: e.target.value })}
              className="w-full border p-2 rounded"
            />
            <input
              type="text"
              placeholder="Correction"
              value={formData.correction}
              onChange={(e) => setFormData({ ...formData, correction: e.target.value })}
              className="w-full border p-2 rounded"
            />
            <textarea
              placeholder="Context (optional)"
              value={formData.context}
              onChange={(e) => setFormData({ ...formData, context: e.target.value })}
              className="w-full border p-2 rounded h-24"
            />
          </div>
        );
      case 'phrase':
        return (
          <div className="space-y-2">
            <input
              type="text"
              placeholder="Phrase"
              value={formData.original}
              onChange={(e) => setFormData({ ...formData, original: e.target.value })}
              className="w-full border p-2 rounded"
            />
            <textarea
              placeholder="Definition / Usage"
              value={formData.correction}
              onChange={(e) => setFormData({ ...formData, correction: e.target.value })}
              className="w-full border p-2 rounded h-24"
            />
          </div>
        );
      case 'slang':
        return (
          <div className="space-y-2">
            <input
              type="text"
              placeholder="Slang word or phrase"
              value={formData.original}
              onChange={(e) => setFormData({ ...formData, original: e.target.value })}
              className="w-full border p-2 rounded"
            />
            <textarea
              placeholder="Meaning / Usage"
              value={formData.correction}
              onChange={(e) => setFormData({ ...formData, correction: e.target.value })}
              className="w-full border p-2 rounded h-24"
            />
          </div>
        );
      case 'source':
        return (
          <div className="space-y-2">
            <input
              type="url"
              placeholder="Source URL"
              value={formData.sourceUrl}
              onChange={(e) => setFormData({ ...formData, sourceUrl: e.target.value })}
              className="w-full border p-2 rounded"
            />
            <textarea
              placeholder="Relevant content excerpt"
              value={formData.sourceContent}
              onChange={(e) => setFormData({ ...formData, sourceContent: e.target.value })}
              className="w-full border p-2 rounded h-24"
            />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="p-4 bg-gray-50 dark:bg-gray-800 border rounded">
      <div className="mb-4 flex space-x-2">
        {['correction', 'phrase', 'slang', 'source'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-1 rounded ${activeTab === tab ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100'}`}
          >
            {tab === 'correction' && 'Correct AI'}
            {tab === 'phrase' && 'Teach Phrase'}
            {tab === 'slang' && 'Teach Slang'}
            {tab === 'source' && 'Submit Source'}
          </button>
        ))}
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        {renderForm()}
        <button
          type="submit"
          className="px-4 py-2 bg-green-600 text-white rounded disabled:opacity-50"
          disabled={submissionsToday >= dailyLimit}
        >
          Submit
        </button>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {submissionsToday} / {dailyLimit} submissions today
        </div>
      </form>
    </div>
  );
}
