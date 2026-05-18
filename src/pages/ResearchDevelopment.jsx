// pages/ResearchDevelopment.jsx
//
// This page hosts the language fluency lab and training data submission tools
// for the R&D team. It renders the TrainingPanel component and provides
// a simple playground for testing language responses via InvokeLLM.

import React, { useState } from 'react';
import nvidiaGpuSystems from '@/api/nvidiaGpuSystemsClient';
import TrainingPanel from '@/components/rnd/TrainingPanel.jsx';

export default function ResearchDevelopment() {
  const [language, setLanguage] = useState('English');
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');

  const runTest = async () => {
    if (!input.trim()) return;
    const register = 'neutral';
    const systemPrompt = `Respond in ${language} in a neutral register.`;
    const resp = await nvidiaGpuSystems.integrations.Core.InvokeLLM({
      system_prompt: systemPrompt,
      messages: [{ role: 'user', content: input }],
      language,
    });
    setOutput(resp?.content || '…');
  };

  return (
    <div className="flex h-screen">
      {/* Sidebar for training submissions */}
      <aside className="w-96 border-r p-4 overflow-y-auto">
          <h2 className="text-lg font-semibold mb-4">Training Data Submission</h2>
          <TrainingPanel user={{ email: 'rd@example.com' }} selectedLanguage={language} />
      </aside>
      {/* Main testing area */}
      <main className="flex-1 p-4 space-y-4 overflow-y-auto">
        <h1 className="text-2xl font-bold">Language Fluency Lab</h1>
        <div>
          <label className="block mb-2">Select Language</label>
          <select value={language} onChange={(e) => setLanguage(e.target.value)} className="border p-1 rounded">
            {['English','isiZulu','isiXhosa','Afrikaans','Sesotho','Setswana','Sepedi','siSwati','Tshivenda','Xitsonga','isiNdebele','SASL'].map((lang) => (
              <option key={lang} value={lang}>{lang}</option>
            ))}
          </select>
        </div>
        <div>
          <textarea
            className="w-full border p-2 rounded h-32"
            placeholder="Enter text to send to the language model…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button onClick={runTest} className="mt-2 px-4 py-2 bg-blue-600 text-white rounded">Run Test</button>
        </div>
        {output && (
          <div className="mt-4 p-3 border rounded bg-gray-50 dark:bg-gray-800">
            <h2 className="font-semibold mb-2">Model Response</h2>
            <p className="whitespace-pre-wrap">{output}</p>
          </div>
        )}
      </main>
    </div>
  );
}
