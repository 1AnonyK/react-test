// pages/Chat.jsx
//
// This component implements a minimal chat interface for interacting with the
// underlying language model via the nvidiaGpuSystems SDK. It demonstrates
// conversation management, message persistence and on‑the‑fly register
// detection and prompt generation. The UI is intentionally simple so your
// team can focus on building a great user experience on top of it.

import React, { useEffect, useState, useRef } from 'react';
import nvidiaGpuSystems from '@/api/nvidiaGpuSystemsClient';
import { buildLanguageSystemBlock, detectRegister } from '@/components/chat/languagePrompt';
import LIMITS from '@/components/chat/chatLimits';

export default function Chat() {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [language, setLanguage] = useState('English');
  const messageEndRef = useRef(null);

  // Load conversations on mount
  useEffect(() => {
    async function fetchConversations() {
      const list = await nvidiaGpuSystems.entities.Conversation.list();
      setConversations(list || []);
      if (list && list.length > 0) {
        setSelectedConversation(list[0]);
      }
    }
    fetchConversations();
  }, []);

  // Load messages when selected conversation changes
  useEffect(() => {
    if (!selectedConversation) return;
    async function fetchMessages() {
      const msgs = await nvidiaGpuSystems.entities.Message.filter({
        conversation_id: selectedConversation.id,
      }, { created_at: 'asc' }, LIMITS.MAX_MESSAGES_PER_CONVERSATION);
      setMessages(msgs || []);
      scrollToBottom();
    }
    fetchMessages();
  }, [selectedConversation]);

  const scrollToBottom = () => {
    if (messageEndRef.current) {
      messageEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const startNewConversation = async () => {
    const newConv = await nvidiaGpuSystems.entities.Conversation.create({ title: 'New Chat', language });
    setConversations((prev) => [newConv, ...prev]);
    setSelectedConversation(newConv);
    setMessages([]);
  };

  const sendMessage = async () => {
    if (!input.trim()) return;
    if (!selectedConversation) {
      await startNewConversation();
    }
    const message = { conversation_id: selectedConversation.id, role: 'user', content: input, language };
    // Persist user message
    await nvidiaGpuSystems.entities.Message.create(message);
    setMessages((prev) => [...prev, { ...message, id: Date.now().toString() }]);
    setInput('');
    // Determine register and build system prompt
    const register = detectRegister(input);
    const summary = '';
    const systemPrompt = buildLanguageSystemBlock(language, register, summary);
    // Invoke LLM through SDK
    const response = await nvidiaGpuSystems.integrations.Core.InvokeLLM({
      system_prompt: systemPrompt,
      messages: messages.slice(-LIMITS.CONTEXT_LAST_K_MESSAGES).concat([{ role: 'user', content: input }]),
      language,
    });
    const aiContent = response?.content || '…';
    const aiMsg = { conversation_id: selectedConversation.id, role: 'assistant', content: aiContent, language };
    await nvidiaGpuSystems.entities.Message.create(aiMsg);
    setMessages((prev) => [...prev, aiMsg]);
    scrollToBottom();
  };

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <aside className="w-64 border-r p-4 overflow-y-auto">
        <button onClick={startNewConversation} className="w-full mb-4 py-2 bg-blue-600 text-white rounded">
          New Conversation
        </button>
        <div className="space-y-2">
          {conversations.map((conv) => (
            <div
              key={conv.id}
              onClick={() => setSelectedConversation(conv)}
              className={`p-2 rounded cursor-pointer ${selectedConversation?.id === conv.id ? 'bg-blue-100 dark:bg-blue-700' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}
            >
              {conv.title || 'Untitled Chat'}
            </div>
          ))}
        </div>
      </aside>
      {/* Main chat area */}
      <section className="flex-1 flex flex-col">
        <header className="p-4 border-b">
          <h2 className="text-lg font-semibold">{selectedConversation?.title || 'New Chat'}</h2>
          <select value={language} onChange={(e) => setLanguage(e.target.value)} className="mt-2 border p-1 rounded">
            {['English','isiZulu','isiXhosa','Afrikaans','Sesotho','Setswana','Sepedi','siSwati','Tshivenda','Xitsonga','isiNdebele','SASL'].map((lang) => (
              <option key={lang} value={lang}>{lang}</option>
            ))}
          </select>
        </header>
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {messages.map((msg, idx) => (
            <div key={idx} className={`p-2 rounded ${msg.role === 'user' ? 'bg-blue-50 dark:bg-blue-900 text-right' : 'bg-gray-100 dark:bg-gray-700'}`}>
              <div className="whitespace-pre-wrap">{msg.content}</div>
            </div>
          ))}
          <div ref={messageEndRef}></div>
        </div>
        <footer className="p-4 border-t flex space-x-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 border p-2 rounded h-20 resize-none"
            placeholder="Type your message…"
          />
          <button onClick={sendMessage} className="px-4 py-2 bg-green-600 text-white rounded">
            Send
          </button>
        </footer>
      </section>
    </div>
  );
}
