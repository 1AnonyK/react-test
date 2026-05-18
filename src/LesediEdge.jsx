import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Search, Bell, Settings, ChevronDown, ChevronRight, Grid2X2, Share2, Archive,
  Clock3, Flower2, Sun, Moon, Fingerprint, Heart, Briefcase, Lightbulb, Soup,
  TrendingUp, ShieldPlus, BookOpen, Trash2, Target, Mic, MicOff, Camera, Upload,
  Plus, Square, Wifi, WifiOff, Paperclip, SendHorizontal, Sparkles, ArrowLeft,
  X, Volume2, Check, FileText, Image as ImageIcon, AlertCircle, LogOut
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import ReactMarkdown from 'react-markdown';
import { buildLanguageSystemBlock, detectRegister } from './components/chat/languagePrompt';

// Local stub implementing the SDK features used in this component. This object
// provides dummy implementations of the auth and integrations APIs referenced
// throughout the code. The naming uses professional NVIDIA GPU system
// terminology to decouple this UI from the original platform. Feel free to
// extend or replace these methods with real implementations as needed.
const nvidiaGpuSystems = {
  auth: {
    // Returns a mock user. Replace this with your own authentication logic if
    // integrating with a real backend or identity provider. The returned
    // object should at least include full_name, email and optionally
    // avatar_url fields to match the structure expected by the UI.
    me: async () => {
      return {
        full_name: 'Guest User',
        email: 'guest@example.com',
        avatar_url: null,
      };
    },
    // Stub for logging out. This simply redirects to the root path. You can
    // replace this with more sophisticated session termination logic.
    logout: () => {
      window.location.href = '/';
    },
  },
  integrations: {
    Core: {
      // Simulate uploading a file by returning a locally scoped object URL.
      // This allows the uploaded file to be previewed in the chat without
      // depending on any remote storage or API.
      UploadFile: async ({ file }) => {
        const url = URL.createObjectURL(file);
        return { file_url: url };
      },
      // Return a placeholder response for AI prompts. In a real application
      // you would call an LLM or other service here. The returned string
      // includes part of the prompt so it’s clear what input was received.
      InvokeLLM: async ({ prompt }) => {
        const preview = typeof prompt === 'string' ? prompt.slice(0, 200) : '';
        return `[[NVIDIA GPU System AI Placeholder Response]]\n\nYou said: ${preview}`;
      },
    },
  },
};

const SA_LANGUAGES = [
  'isiZulu', 'isiXhosa', 'Afrikaans', 'English', 'Sesotho', 'Setswana',
  'Sepedi', 'siSwati', 'Tshivenda', 'Xitsonga', 'isiNdebele', 'SASL'
];

const modules = [
  { title: 'Ancestry Gate', subtitle: 'Explore. Remember. Belong.', body: 'Discover your roots, family history, and cultural legacy.', tag: 'ROOTS', side: 'left', topPct: 13, icon: Fingerprint, mini: Trash2, prompt: 'Tell me about South African ancestry and family history research. Help me trace my roots.' },
  { title: 'Ubuntu Self', subtitle: 'Be seen. Be heard. Be you.', body: 'A safe space for your thoughts, feelings, and personal growth.', tag: 'WENA', side: 'left', topPct: 38, icon: Heart, mini: Flower2, prompt: 'I want to talk about personal growth and the Ubuntu philosophy — I am because we are.' },
  { title: 'Career', subtitle: 'Build. Grow. Lead.', body: 'Navigate your professional path, upskill, and unlock opportunities.', tag: 'FUTURE', side: 'left', topPct: 64, icon: Briefcase, mini: TrendingUp, prompt: 'Help me with career development and professional growth in South Africa. What opportunities exist?' },
  { title: 'Research Empowerment', subtitle: 'Ask better questions. Learn deeper.', body: 'AI that challenges your thinking and guides your growth.', tag: 'MIND', side: 'right', topPct: 13, icon: Lightbulb, mini: BookOpen, prompt: 'I want to research and learn something new today. Challenge my thinking and guide my growth.' },
  { title: 'Culinary Growth', subtitle: 'Cook. Create. Celebrate.', body: 'Discover recipes, explore flavors, and honor food traditions.', tag: 'FLAVOR', side: 'right', topPct: 38, icon: Soup, mini: Flower2, prompt: 'Tell me about South African cuisine — recipes, flavors, braai culture and traditional food.' },
  { title: 'Business Development', subtitle: 'Plan. Launch. Scale.', body: 'Turn ideas into impact with AI support for every step.', tag: 'IMPACTS', side: 'right', topPct: 64, icon: TrendingUp, mini: Target, prompt: 'Help me develop a business idea or plan in the South African context. From idea to impact.' },
  { title: 'Doctor AI', subtitle: 'Health. Guidance. Peace of mind.', body: 'Get general health insights and wellness support.', tag: 'WELLNESS', side: 'bottom', topPct: 76, icon: ShieldPlus, mini: Sparkles, prompt: 'I need general health and wellness guidance. Please provide information for educational purposes.' },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function BrandMark() {
  return (
    <div className="relative h-14 w-14 flex-shrink-0">
      <div className="absolute left-2 top-1 h-12 w-9 -rotate-45 rounded-full bg-red-600" />
      <div className="absolute left-4 top-1 h-12 w-4 -rotate-45 rounded-full border-r-[9px] border-white" />
    </div>
  );
}

function SidebarItem({ icon: Icon, label, active, onClick }) {
  return (
    <div onClick={onClick} className={`flex items-center gap-4 rounded-xl px-4 py-3 text-[13px] transition cursor-pointer select-none ${active ? 'bg-red-600 text-white shadow-xl shadow-red-200' : 'text-zinc-700 hover:bg-white'}`}>
      <Icon size={18} strokeWidth={active ? 2.8 : 2.2} />
      <span className="font-semibold">{label}</span>
    </div>
  );
}

function ModuleCard({ item, onClick }) {
  const Icon = item.icon;
  const Mini = item.mini;
  const isLeft = item.side === 'left';
  const isRight = item.side === 'right';

  const iconPos = isLeft 
    ? '-right-[20px] xl:-right-[36px] top-1/2 -translate-y-1/2' 
    : isRight 
      ? '-left-[20px] xl:-left-[36px] top-1/2 -translate-y-1/2' 
      : 'left-1/2 -top-[28px] xl:-top-[36px] -translate-x-1/2';

  return (
    <div
      onClick={() => onClick(item)}
      className="relative w-full rounded-[24px] border border-zinc-200/80 bg-white/92 p-4 xl:p-5 shadow-[0_14px_40px_rgba(0,0,0,0.11)] backdrop-blur cursor-pointer hover:shadow-[0_18px_50px_rgba(239,35,60,0.18)] hover:border-red-200 transition-all z-10"
    >
      <div className={`absolute ${iconPos} flex h-[56px] w-[56px] xl:h-[72px] xl:w-[72px] items-center justify-center rounded-full border border-zinc-200 bg-white shadow-[0_10px_28px_rgba(0,0,0,0.16)] transition-all`}>
        <div className="flex h-[40px] w-[40px] xl:h-[54px] xl:w-[54px] items-center justify-center rounded-full bg-red-50 text-red-600 shadow-inner transition-all">
          <Icon size={24} strokeWidth={2.2} className="xl:w-8 xl:h-8" />
        </div>
      </div>
      {!isLeft && <ChevronRight className="absolute right-3 top-4 text-zinc-300" size={16} />}
      <h3 className="mb-1 pr-6 text-sm xl:text-base font-bold text-zinc-900 leading-tight">{item.title}</h3>
      <p className="mb-2 text-[11px] xl:text-xs font-extrabold text-zinc-950">{item.subtitle}</p>
      <p className="text-[11px] xl:text-xs leading-relaxed text-zinc-600 line-clamp-2">{item.body}</p>
      <div className="mt-3 flex items-end justify-between">
        <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-[9px] xl:text-[10px] font-bold text-red-400 shadow-inner">{item.tag}</span>
        <Mini className="text-zinc-400" size={20} strokeWidth={1.4} />
      </div>
    </div>
  );
}

function RingConnector() {
  const dots = [
    [50,26],[40,31],[33,43],[33,56],[40,69],[50,73],[60,69],[67,56],[67,43],[60,31],
    [28,31],[25,56],[28,73],[72,31],[75,56],[72,73]
  ];
  return (
    <div className="pointer-events-none absolute inset-0 -z-10 hidden lg:flex items-center justify-center">
      <div className="relative w-full h-full">
        <div className="absolute left-1/2 top-1/2 h-[68%] w-[68%] max-h-[680px] max-w-[680px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-zinc-200" />
        <div className="absolute left-1/2 top-1/2 h-[51%] w-[51%] max-h-[510px] max-w-[510px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-red-200" />
        <div className="absolute left-1/2 top-1/2 h-[35%] w-[35%] max-h-[350px] max-w-[350px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-zinc-200" />
        <div className="absolute left-1/2 top-1/2 h-[21%] w-[21%] max-h-[210px] max-w-[210px] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-red-500" />
        <div className="absolute left-1/2 top-1/2 h-[18%] w-[18%] max-h-[178px] max-w-[178px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-red-300" />
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <path d="M50 50 C42 38, 36 34, 31 28" fill="none" stroke="#ef233c" strokeWidth="0.25" vectorEffect="non-scaling-stroke" />
          <path d="M50 50 C43 50, 36 50, 30 50" fill="none" stroke="#ef233c" strokeWidth="0.25" vectorEffect="non-scaling-stroke" />
          <path d="M50 50 C42 62, 36 66, 31 72" fill="none" stroke="#ef233c" strokeWidth="0.25" vectorEffect="non-scaling-stroke" />
          <path d="M50 50 C58 38, 64 34, 69 28" fill="none" stroke="#ef233c" strokeWidth="0.25" vectorEffect="non-scaling-stroke" />
          <path d="M50 50 C57 50, 64 50, 70 50" fill="none" stroke="#ef233c" strokeWidth="0.25" vectorEffect="non-scaling-stroke" />
          <path d="M50 50 C58 62, 64 66, 69 72" fill="none" stroke="#ef233c" strokeWidth="0.25" vectorEffect="non-scaling-stroke" />
          <path d="M50 50 L50 75" fill="none" stroke="#ef233c" strokeWidth="0.25" vectorEffect="non-scaling-stroke" />
        </svg>
        {dots.map(([x, y], i) => (
          <div key={i} className="absolute flex h-5 w-5 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-red-500/15 shadow-[0_0_10px_rgba(239,35,60,0.4)]" style={{ left: `${x}%`, top: `${y}%` }}>
            <div className="h-2.5 w-2.5 rounded-full border-2 border-red-500 bg-white" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Toast notification ────────────────────────────────────────────────────────
function Toast({ toast, onDismiss }) {
  useEffect(() => {
    const t = setTimeout(() => onDismiss(toast.id), toast.duration || 4000);
    return () => clearTimeout(t);
  }, [toast.id]);

  const icons = { success: Check, error: AlertCircle, info: Sparkles };
  const colors = { success: 'text-green-500', error: 'text-red-500', info: 'text-blue-500' };
  const Icon = icons[toast.type] || Sparkles;

  return (
    <div className="flex items-start gap-3 rounded-2xl border border-zinc-100 bg-white px-5 py-4 shadow-[0_20px_60px_rgba(0,0,0,0.18)] animate-in slide-in-from-right-5 duration-300 max-w-sm">
      <Icon size={18} className={`mt-0.5 flex-shrink-0 ${colors[toast.type] || 'text-zinc-500'}`} />
      <div className="flex-1 min-w-0">
        {toast.title && <p className="text-sm font-bold text-zinc-900 mb-0.5">{toast.title}</p>}
        <p className="text-xs text-zinc-500 leading-relaxed">{toast.message}</p>
      </div>
      <button onClick={() => onDismiss(toast.id)} className="flex-shrink-0 text-zinc-300 hover:text-zinc-500 transition-colors">
        <X size={14} />
      </button>
    </div>
  );
}

// ─── Chat overlay ──────────────────────────────────────────────────────────────
function ChatOverlay({ messages, input, setInput, isLoading, onSend, onClose, selectedLanguage, setSelectedLanguage, userName, messagesEndRef, onFileUpload, uploadedFile, clearUpload }) {
  const [langOpen, setLangOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 160) + 'px';
  }, [input]);

  const handleSpeak = (text) => {
    window.speechSynthesis?.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = selectedLanguage === 'isiZulu' ? 'zu-ZA' : selectedLanguage === 'Afrikaans' ? 'af-ZA' : selectedLanguage === 'Sesotho' ? 'st-ZA' : 'en-ZA';
    window.speechSynthesis?.speak(utterance);
  };

  const handleMic = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      return;
    }
    const rec = new SR();
    recognitionRef.current = rec;
    rec.lang = selectedLanguage === 'Afrikaans' ? 'af-ZA' : 'en-ZA';
    rec.continuous = false;
    rec.interimResults = false;
    rec.onresult = (e) => { setInput(prev => prev + e.results[0][0].transcript); };
    rec.onend = () => setIsRecording(false);
    rec.start();
    setIsRecording(true);
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    onFileUpload(file);
    e.target.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-2xl h-[85vh] rounded-[28px] bg-white shadow-[0_40px_100px_rgba(0,0,0,0.25)] flex flex-col overflow-hidden border border-zinc-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 bg-white flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-red-500 to-red-700 shadow-lg shadow-red-200 flex-shrink-0">
              <span className="text-xl font-black text-white">∞</span>
            </div>
            <div>
              <h2 className="text-base font-black text-zinc-900">Lesedi Chat</h2>
              <p className="text-xs text-zinc-400">Your AI Partner · {selectedLanguage}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <button onClick={() => setLangOpen(!langOpen)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-red-200 bg-red-50 text-red-600 text-xs font-semibold hover:bg-red-100 transition-all">
                {selectedLanguage} <ChevronDown size={12} />
              </button>
              {langOpen && (
                <div className="absolute right-0 top-9 z-50 rounded-xl border border-zinc-100 shadow-2xl overflow-y-auto w-44 bg-white" style={{ maxHeight: '240px' }}>
                  {SA_LANGUAGES.map(lang => (
                    <button key={lang} onClick={() => { setSelectedLanguage(lang); setLangOpen(false); }} className={`w-full px-4 py-2.5 text-left text-sm transition-all ${selectedLanguage === lang ? 'bg-red-50 text-red-600 font-semibold' : 'text-zinc-700 hover:bg-zinc-50'}`}>
                      {lang}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center hover:bg-red-100 hover:text-red-600 transition-all">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {messages.length === 0 && (
            <div className="text-center mt-10">
              <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center bg-gradient-to-br from-red-500 to-red-700 shadow-[0_16px_40px_rgba(239,35,60,0.35)]">
                <span className="text-2xl font-black text-white">∞</span>
              </div>
              <h3 className="text-lg font-black text-zinc-900 mb-1.5">Sawubona, {userName}!</h3>
              <p className="text-zinc-500 text-sm">Ask Lesedi anything in <span className="text-red-600 font-semibold">{selectedLanguage}</span></p>
              <p className="text-zinc-400 text-xs mt-1">Click a module card to start a focused conversation</p>
            </div>
          )}
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className="max-w-[78%]">
                <div className={`rounded-2xl px-4 py-3 ${msg.sender === 'user' ? 'bg-gradient-to-br from-red-500 to-red-700 text-white' : 'bg-zinc-50 border border-zinc-100 text-zinc-900'}`}>
                  {msg.filePreview && (
                    <div className="mb-2 flex items-center gap-2 rounded-lg bg-white/20 px-3 py-2">
                      <FileText size={14} />
                      <span className="text-xs font-medium truncate">{msg.fileName}</span>
                    </div>
                  )}
                  {msg.sender === 'user' ? (
                    <p className="text-sm leading-relaxed">{msg.text}</p>
                  ) : (
                    <ReactMarkdown className="text-sm leading-relaxed prose prose-sm max-w-none prose-p:my-1.5 prose-headings:font-bold prose-code:bg-zinc-100 prose-code:rounded prose-code:px-1">
                      {msg.text}
                    </ReactMarkdown>
                  )}
                </div>
                {msg.sender === 'ai' && (
                  <button onClick={() => handleSpeak(msg.text)} className="mt-1 text-xs text-zinc-400 hover:text-red-500 flex items-center gap-1 transition-colors">
                    <Volume2 size={11} /> Listen
                  </button>
                )}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="rounded-2xl px-5 py-4 bg-zinc-50 border border-zinc-100">
                <div className="flex gap-1.5">
                  {[0, 0.15, 0.3].map((d, i) => (
                    <div key={i} className="w-2 h-2 rounded-full bg-red-400 animate-bounce" style={{ animationDelay: `${d}s` }} />
                  ))}
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Uploaded file preview */}
        {uploadedFile && (
          <div className="mx-6 mb-2 flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 px-4 py-2.5">
            <FileText size={16} className="text-red-500 flex-shrink-0" />
            <span className="text-xs text-red-700 font-medium flex-1 truncate">{uploadedFile.name}</span>
            <button onClick={clearUpload} className="text-red-400 hover:text-red-600 transition-colors"><X size={14} /></button>
          </div>
        )}

        {/* Input */}
        <div className="px-5 py-4 border-t border-zinc-100 flex-shrink-0">
          <div className="flex items-end gap-2 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3">
            <button onClick={() => fileInputRef.current?.click()} className="flex-shrink-0 mb-0.5 text-zinc-400 hover:text-red-500 transition-colors" title="Attach file">
              <Paperclip size={19} />
            </button>
            <input ref={fileInputRef} type="file" className="hidden" accept=".pdf,.txt,.csv,.xlsx,.png,.jpg,.jpeg" onChange={handleFileSelect} />
            <textarea
              ref={textareaRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSend(); } }}
              placeholder={`Ask Lesedi in ${selectedLanguage}...`}
              rows={1}
              style={{ resize: 'none', maxHeight: '160px' }}
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-zinc-400 leading-relaxed"
            />
            <button onClick={handleMic} className={`flex-shrink-0 mb-0.5 transition-colors ${isRecording ? 'text-red-600 animate-pulse' : 'text-zinc-400 hover:text-red-500'}`} title={isRecording ? 'Stop recording' : 'Voice input'}>
              {isRecording ? <MicOff size={20} /> : <Mic size={20} />}
            </button>
            <button
              onClick={onSend}
              disabled={!input.trim() || isLoading}
              className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-red-600 text-white shadow-lg shadow-red-200 disabled:opacity-40 transition-all hover:bg-red-700"
            >
              <SendHorizontal size={18} fill="currentColor" />
            </button>
          </div>
        </div>
      </div>
      {langOpen && <div className="fixed inset-0 z-40" onClick={() => setLangOpen(false)} />}
    </div>
  );
}

// ─── Search overlay ────────────────────────────────────────────────────────────
function SearchOverlay({ onClose, onSearch }) {
  const [q, setQ] = useState('');
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 backdrop-blur-sm pt-24 px-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-[0_30px_80px_rgba(0,0,0,0.2)] overflow-hidden border border-zinc-100">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-zinc-100">
          <Search size={18} className="text-zinc-400 flex-shrink-0" />
          <input
            autoFocus
            value={q}
            onChange={e => setQ(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && q.trim()) { onSearch(q); onClose(); } if (e.key === 'Escape') onClose(); }}
            placeholder="Search or ask Lesedi..."
            className="flex-1 text-sm outline-none text-zinc-900 placeholder:text-zinc-400"
          />
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 transition-colors"><X size={16} /></button>
        </div>
        {q && (
          <div className="p-4">
            <button onClick={() => { onSearch(q); onClose(); }} className="w-full flex items-center gap-3 rounded-xl px-4 py-3 bg-red-50 hover:bg-red-100 transition-colors text-left">
              <Sparkles size={16} className="text-red-500 flex-shrink-0" />
              <span className="text-sm text-zinc-700">Ask Lesedi: <span className="font-semibold text-zinc-900">"{q}"</span></span>
              <ChevronRight size={15} className="ml-auto text-zinc-400" />
            </button>
          </div>
        )}
        {!q && (
          <div className="p-4 text-center text-xs text-zinc-400 py-6">
            Type to search modules or ask Lesedi anything
          </div>
        )}
      </div>
    </div>
  );
}

// ─── New Path modal ────────────────────────────────────────────────────────────
function NewPathModal({ onClose, onAdd }) {
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-[0_30px_80px_rgba(0,0,0,0.2)] p-7 border border-zinc-100">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-black text-zinc-900">Add New Path</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center hover:bg-red-100 hover:text-red-600 transition-all"><X size={16} /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-500 mb-1.5">Path Name</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Language Learning" className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-red-300 transition-colors" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-zinc-500 mb-1.5">Description</label>
            <textarea value={desc} onChange={e => setDesc(e.target.value)} placeholder="What do you want to explore?" rows={3} className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-red-300 transition-colors resize-none" />
          </div>
          <button
            onClick={() => { if (name.trim()) { onAdd(name, desc); onClose(); } }}
            disabled={!name.trim()}
            className="w-full rounded-xl bg-red-600 py-3 text-sm font-bold text-white shadow-lg shadow-red-200 hover:bg-red-700 transition-colors disabled:opacity-40"
          >
            Create Path
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Notifications panel ───────────────────────────────────────────────────────
function NotificationsPanel({ onClose }) {
  const notifs = [
    { id: 1, title: 'Lesedi is ready', msg: 'Your AI partner is fully loaded and ready to assist.', time: 'Just now', type: 'success' },
    { id: 2, title: 'New module available', msg: 'Doctor AI is now available for health guidance.', time: '2 min ago', type: 'info' },
    { id: 3, title: 'Language updated', msg: 'isiZulu mode activated with enhanced fluency.', time: '5 min ago', type: 'info' },
  ];
  return (
    <div className="absolute right-0 top-14 z-50 w-80 rounded-2xl border border-zinc-100 bg-white shadow-[0_20px_60px_rgba(0,0,0,0.18)] overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100">
        <span className="font-extrabold text-zinc-900 text-sm">Notifications</span>
        <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 transition-colors"><X size={15} /></button>
      </div>
      {notifs.map(n => (
        <div key={n.id} className="flex gap-3 px-5 py-4 border-b border-zinc-50 hover:bg-zinc-50 transition-colors">
          <div className={`mt-0.5 h-2 w-2 rounded-full flex-shrink-0 ${n.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`} />
          <div>
            <p className="text-xs font-bold text-zinc-900">{n.title}</p>
            <p className="text-xs text-zinc-500 mt-0.5 leading-relaxed">{n.msg}</p>
            <p className="text-[10px] text-zinc-400 mt-1">{n.time}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Settings panel ─────────────────────────────────────────────────────────── 
function SettingsPanel({ onClose, darkMode, setDarkMode, onLogout }) {
  return (
    <div className="absolute right-0 top-14 z-50 w-72 rounded-2xl border border-zinc-100 bg-white shadow-[0_20px_60px_rgba(0,0,0,0.18)] overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100">
        <span className="font-extrabold text-zinc-900 text-sm">Settings</span>
        <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 transition-colors"><X size={15} /></button>
      </div>
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between px-3 py-3 rounded-xl bg-zinc-50">
          <span className="text-sm font-medium text-zinc-700">Dark mode</span>
          <button onClick={() => setDarkMode(!darkMode)} className={`relative w-11 h-6 rounded-full transition-colors ${darkMode ? 'bg-red-600' : 'bg-zinc-200'}`}>
            <div className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-transform ${darkMode ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>
        <Link to={createPageUrl('Settings')}>
          <div className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-zinc-50 cursor-pointer transition-colors" onClick={onClose}>
            <Settings size={16} className="text-zinc-500" />
            <span className="text-sm font-medium text-zinc-700">App Settings</span>
            <ChevronRight size={14} className="ml-auto text-zinc-300" />
          </div>
        </Link>
        <button onClick={onLogout} className="flex w-full items-center gap-3 px-3 py-3 rounded-xl hover:bg-red-50 cursor-pointer transition-colors text-left">
          <LogOut size={16} className="text-red-500" />
          <span className="text-sm font-medium text-red-500">Sign out</span>
        </button>
      </div>
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────
export default function LesediEdge() {
  const [user, setUser] = useState(null);
  const [selectedLanguage, setSelectedLanguage] = useState('isiZulu');
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [activeNav, setActiveNav] = useState('Dashboard');
  const [darkMode, setDarkMode] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showNewPath, setShowNewPath] = useState(false);
  const [customPaths, setCustomPaths] = useState([]);
  const [toasts, setToasts] = useState([]);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [uploadedFileUrl, setUploadedFileUrl] = useState(null);
  const [quickAccessOpen, setQuickAccessOpen] = useState(false);
  const [todaysFocusOpen, setTodaysFocusOpen] = useState(false);
  
  const messagesEndRef = useRef(null);
  const bellRef = useRef(null);
  const settingsRef = useRef(null);

  useEffect(() => {
    nvidiaGpuSystems.auth.me().then(u => setUser(u)).catch(() => {});
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const addToast = useCallback((type, title, message, duration = 4000) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, type, title, message, duration }]);
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const userName = user?.full_name?.split(' ')[0] || 'Nomvula';
  const userInitial = user?.full_name?.[0] || 'N';

  const handleFileUpload = async (file) => {
    setUploadedFile(file);
    addToast('info', 'Uploading file...', `${file.name} is being processed.`, 3000);
    try {
      const { file_url } = await nvidiaGpuSystems.integrations.Core.UploadFile({ file });
      setUploadedFileUrl(file_url);
      addToast('success', 'File ready', `${file.name} attached successfully.`);
    } catch {
      addToast('error', 'Upload failed', 'Could not upload the file. Please try again.');
      setUploadedFile(null);
    }
  };

  const clearUpload = () => { setUploadedFile(null); setUploadedFileUrl(null); };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const userText = input.trim();
    setInput('');
    const detectedReg = detectRegister(userText);
    const userMsg = {
      id: Date.now(),
      text: userText,
      sender: 'user',
      fileName: uploadedFile?.name,
      filePreview: !!uploadedFile,
    };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setIsLoading(true);
    setIsThinking(true);
    const fileUrl = uploadedFileUrl;
    clearUpload();

    const contextText = newMessages.slice(-12).map(m => `${m.sender === 'user' ? 'User' : 'Assistant'}: ${m.text}`).join('\n');
    const langBlock = buildLanguageSystemBlock(selectedLanguage, detectedReg !== 'neutral' ? detectedReg : 'neutral', null);
    const now = new Date();
    const currentDateTime = now.toLocaleString('en-ZA', { timeZone: 'Africa/Johannesburg', dateStyle: 'full', timeStyle: 'long' });

    const prompt = `You are Lesedi, UmkhoAI's advanced AI assistant — fluent in all 12 South African official languages. You are warm, culturally aware, and deeply knowledgeable about South African life, culture, business, health, food, history, and current affairs.

CURRENT DATE & TIME (SAST): ${currentDateTime}

${langBlock}

CONVERSATION HISTORY:
${contextText}

USER MESSAGE: ${userText}

Respond naturally as a native ${selectedLanguage} speaker with warmth and deep cultural understanding:`;

    try {
      const needsWeb = /time|date|today|now|weather|news|price|score|current|latest/i.test(userText);
      const response = await nvidiaGpuSystems.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: needsWeb,
        ...(fileUrl ? { file_urls: [fileUrl] } : {}),
      });
      const aiText = typeof response === 'string' ? response : 'Could not generate a response.';
      setMessages([...newMessages, { id: Date.now() + 1, text: aiText, sender: 'ai' }]);
    } catch {
      setMessages([...newMessages, { id: Date.now() + 1, text: 'Error generating response. Please try again.', sender: 'ai' }]);
      addToast('error', 'Error', 'Failed to get a response. Please try again.');
    } finally {
      setIsLoading(false);
      setIsThinking(false);
    }
  };

  const handleModuleClick = (item) => {
    setInput(item.prompt);
    setChatOpen(true);
  };

  const handleSearchSubmit = (query) => {
    setInput(query);
    setChatOpen(true);
  };

  const handleQuickAction = (action) => {
    if (action === 'new') {
      setMessages([]);
      setInput('');
      clearUpload();
      setChatOpen(true);
    } else if (action === 'upload') {
      setChatOpen(true);
      setTimeout(() => {
        document.querySelector('input[type="file"]')?.click();
      }, 300);
    } else {
      setChatOpen(true);
    }
  };

  const handleAddPath = (name, desc) => {
    setCustomPaths(prev => [...prev, { id: Date.now(), name, desc }]);
    addToast('success', 'Path created!', `"${name}" has been added to your paths.`);
  };

  // Note: `isOwner` was used to conditionally show a code download button in the
  // original implementation. Since the download feature and Base44 dependency
  // have been removed to make this component self-contained, this flag is no
  // longer used.

  const handleLogout = () => nvidiaGpuSystems.auth.logout();

  const closeAll = () => { setShowNotifs(false); setShowSettings(false); setLangMenuOpen(false); };

  const navViews = {
    'Dashboard': null,
    'My Paths': (
      <div className="absolute left-1/2 top-1/3 z-10 -translate-x-1/2 -translate-y-1/2 text-center">
        <h2 className="text-2xl font-black text-zinc-900 mb-4">My Paths</h2>
        {customPaths.length === 0 ? (
          <p className="text-zinc-400 text-sm">No paths yet. Click "Add New Path" to create one.</p>
        ) : (
          <div className="grid gap-3 mt-4">
            {customPaths.map(p => (
              <div key={p.id} onClick={() => { setInput(`Tell me about ${p.name}: ${p.desc}`); setChatOpen(true); }} className="rounded-2xl border border-zinc-200 bg-white/90 p-5 text-left cursor-pointer hover:border-red-200 hover:shadow-md transition-all">
                <h3 className="font-bold text-zinc-900">{p.name}</h3>
                {p.desc && <p className="text-xs text-zinc-500 mt-1">{p.desc}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    ),
    'Archives': (
      <div className="absolute left-1/2 top-1/3 z-10 -translate-x-1/2 -translate-y-1/2 text-center">
        <h2 className="text-2xl font-black text-zinc-900 mb-2">Archives</h2>
        <p className="text-zinc-400 text-sm max-w-sm">Your past conversations are saved in the main Chat page.</p>
        <Link to={createPageUrl('Chat')} className="mt-4 inline-block rounded-xl bg-red-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-red-200 hover:bg-red-700 transition-colors">Open Chat History</Link>
      </div>
    ),
    'Timeline': (
      <div className="absolute left-1/2 top-1/3 z-10 -translate-x-1/2 -translate-y-1/2 text-center">
        <h2 className="text-2xl font-black text-zinc-900 mb-2">Timeline</h2>
        <p className="text-zinc-400 text-sm">Your journey timeline — coming soon.</p>
      </div>
    ),
    'Lesedi Vault': (
      <div className="absolute left-1/2 top-1/3 z-10 -translate-x-1/2 -translate-y-1/2 text-center">
        <h2 className="text-2xl font-black text-zinc-900 mb-2">Lesedi Vault</h2>
        <p className="text-zinc-400 text-sm max-w-sm">Secure storage for your important insights and saved responses — coming soon.</p>
      </div>
    ),
  };

  return (
    <div
      className={`flex h-screen w-screen overflow-hidden font-sans ${darkMode ? 'bg-zinc-950 text-zinc-100' : 'bg-[#fbfbfb] text-zinc-900'}`}
      onClick={() => { if (showNotifs || showSettings) closeAll(); }}
    >
      {/* Background */}
      <div className={`pointer-events-none absolute inset-0 ${darkMode
        ? 'bg-[radial-gradient(circle_at_50%_50%,rgba(239,35,60,0.1),transparent_42%)]'
        : 'bg-[radial-gradient(circle_at_50%_50%,rgba(239,35,60,0.07),transparent_42%),linear-gradient(90deg,rgba(0,0,0,0.03)_1px,transparent_1px),linear-gradient(rgba(0,0,0,0.025)_1px,transparent_1px)] bg-[length:auto,120px_120px,120px_120px]'}`}
      />

      {/* ── Sidebar ── */}
      <aside className={`relative z-20 flex w-[180px] flex-shrink-0 flex-col border-r ${darkMode ? 'border-zinc-800 bg-zinc-900/80' : 'border-zinc-100 bg-white/75'} px-3 pb-6 pt-[108px] backdrop-blur-xl`}>
        <nav className="space-y-2">
          {Object.keys(navViews).map((label, i) => {
            const icons = [Grid2X2, Share2, Archive, Clock3, Flower2];
            return <SidebarItem key={label} icon={icons[i]} label={label} active={activeNav === label} onClick={() => setActiveNav(label)} />;
          })}
        </nav>
        <div className="mt-auto space-y-3 px-1">
          {/* Theme toggle */}
          <div className={`flex items-center justify-around rounded-full p-2.5 shadow-lg ${darkMode ? 'bg-zinc-800' : 'bg-white'}`}>
            <button onClick={(e) => { e.stopPropagation(); setDarkMode(false); }} className={`p-1.5 rounded-full transition-colors ${!darkMode ? 'text-red-500 bg-red-50' : 'text-zinc-500 hover:text-red-400'}`}><Sun size={17} /></button>
            <button onClick={(e) => { e.stopPropagation(); setDarkMode(true); }} className={`p-1.5 rounded-full transition-colors ${darkMode ? 'text-zinc-200 bg-zinc-700' : 'text-zinc-400 hover:text-zinc-600'}`}><Moon size={16} /></button>
          </div>
          {/* Language selector */}
          <div className="relative">
            <button
              onClick={(e) => { e.stopPropagation(); setLangMenuOpen(!langMenuOpen); }}
              className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-xs font-semibold shadow-lg transition-all ${darkMode ? 'bg-zinc-800 text-zinc-300' : 'bg-white text-zinc-600 hover:bg-zinc-50'}`}
            >
              <span className="truncate">{selectedLanguage}</span>
              <ChevronDown size={14} />
            </button>
            {langMenuOpen && (
              <div className={`absolute bottom-11 left-0 z-50 rounded-xl border shadow-2xl overflow-y-auto w-48 ${darkMode ? 'bg-zinc-900 border-zinc-700' : 'bg-white border-zinc-100'}`} style={{ maxHeight: '220px' }}>
                {SA_LANGUAGES.map(lang => (
                  <button key={lang} onClick={(e) => { e.stopPropagation(); setSelectedLanguage(lang); setLangMenuOpen(false); }}
                    className={`w-full px-4 py-2.5 text-left text-sm transition-all ${selectedLanguage === lang ? 'bg-red-50 text-red-600 font-semibold' : darkMode ? 'text-zinc-300 hover:bg-zinc-800' : 'text-zinc-700 hover:bg-zinc-50'}`}>
                    {lang}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* ── Right side (header + main) ── */}
      <div className="flex flex-1 flex-col min-w-0">

        {/* ── Header ── */}
        <header className={`relative z-30 flex h-[108px] flex-shrink-0 items-center justify-between px-6 border-b ${darkMode ? 'border-zinc-800 bg-zinc-900/80' : 'border-zinc-100/50 bg-white/60'} backdrop-blur-xl`}>
          {/* Left — brand */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <Link to={createPageUrl('Home')}>
              <button className={`mr-1 flex h-8 w-8 items-center justify-center rounded-full border shadow-sm transition-all ${darkMode ? 'border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-red-900 hover:text-red-400' : 'border-zinc-200 bg-white/80 text-zinc-600 hover:bg-red-50 hover:text-red-600'}`}>
                <ArrowLeft size={15} />
              </button>
            </Link>
            <BrandMark />
            <div className="flex items-end gap-1.5 flex-wrap">
              <span className="text-3xl font-black tracking-tight text-red-600 leading-none">Lesedi</span>
              <span className={`text-3xl font-light tracking-tight leading-none ${darkMode ? 'text-zinc-100' : 'text-zinc-900'}`}>Edge</span>
              <span className="text-lg text-red-600 leading-none pb-0.5">v.1</span>
              <span className={`text-xs pb-1 ml-0.5 ${darkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>powered by <b className="text-red-700">UmkhoAI</b></span>
            </div>
          </div>

          {/* Center — status pill */}
          <div className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-3 rounded-full border py-2 pl-3 pr-5 shadow-[0_6px_18px_rgba(0,0,0,0.1)] ${darkMode ? 'border-zinc-700 bg-zinc-800' : 'border-zinc-200 bg-white/95'}`}>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100 flex-shrink-0">
              <span className="h-4 w-4 rounded-full bg-red-600 shadow-[0_0_14px_rgba(239,35,60,0.7)]" />
            </div>
            <div>
              <div className={`text-xs font-extrabold tracking-wide ${darkMode ? 'text-zinc-100' : 'text-zinc-900'}`}>LESEDI EDGE v1</div>
              <div className="text-[10px] text-zinc-400">All systems ready</div>
            </div>
            <Wifi className="text-red-400" size={17} />
          </div>

          {/* Right — controls */}
          <div className="flex items-center gap-5 flex-shrink-0">

            <button onClick={(e) => { e.stopPropagation(); setShowSearch(true); }} className={`transition-colors ${darkMode ? 'text-zinc-400 hover:text-red-400' : 'text-zinc-500 hover:text-red-600'}`}>
              <Search size={22} />
            </button>
            <div ref={bellRef} className="relative" onClick={e => e.stopPropagation()}>
              <button onClick={() => { setShowNotifs(!showNotifs); setShowSettings(false); }} className={`transition-colors ${darkMode ? 'text-zinc-400 hover:text-red-400' : 'text-zinc-500 hover:text-red-600'}`}>
                <Bell size={21} />
              </button>
              <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-red-600" />
              {showNotifs && <NotificationsPanel onClose={() => setShowNotifs(false)} />}
            </div>
            <div ref={settingsRef} className="relative" onClick={e => e.stopPropagation()}>
              <button onClick={() => { setShowSettings(!showSettings); setShowNotifs(false); }} className={`transition-colors ${darkMode ? 'text-zinc-400 hover:text-red-400' : 'text-zinc-500 hover:text-red-600'}`}>
                <Settings size={22} />
              </button>
              {showSettings && <SettingsPanel onClose={() => setShowSettings(false)} darkMode={darkMode} setDarkMode={setDarkMode} onLogout={handleLogout} />}
            </div>
            <div className={`flex items-center gap-3 rounded-2xl border py-1.5 pl-2 pr-4 shadow-lg ${darkMode ? 'border-zinc-700 bg-zinc-800' : 'border-zinc-200 bg-white/80'}`}>
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-red-400 to-red-700 text-white text-lg font-black shadow-md overflow-hidden flex-shrink-0">
                {user?.avatar_url ? <img src={user.avatar_url} alt="Profile" className="h-full w-full object-cover" /> : <span>{userInitial}</span>}
              </div>
              <div>
                <div className={`text-sm font-extrabold leading-tight ${darkMode ? 'text-zinc-100' : 'text-zinc-900'}`}>Sawubona, {userName}</div>
                <div className="text-[10px] text-zinc-400">Lesedi ID: ZULU-7G3X</div>
              </div>
              <ChevronDown size={15} className="text-zinc-400" />
            </div>
          </div>
        </header>

        {/* ── Main canvas ── */}
        <main className="relative flex-1 overflow-y-auto overflow-x-hidden flex flex-col items-center py-8">
          {activeNav === 'Dashboard' ? (
            <>
              <RingConnector />

              {/* Welcome */}
              <div className="z-10 text-center flex-shrink-0 mb-6 mt-4">
                <h1 className={`text-2xl font-black tracking-tight ${darkMode ? 'text-zinc-100' : 'text-zinc-900'}`}>Welcome back, {userName}</h1>
                <div className="mx-auto my-3 h-1 w-10 rounded-full bg-red-600" />
                <p className={`text-sm font-medium ${darkMode ? 'text-zinc-300' : 'text-zinc-700'}`}>Where shall we explore today?</p>
                <p className={`mt-1 text-sm ${darkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>Your journey, your pace.</p>
              </div>

              <div className="z-10 flex flex-col lg:flex-row w-full max-w-[1400px] items-center lg:items-stretch justify-center gap-6 lg:gap-x-6 xl:gap-x-12 flex-1 px-4 lg:px-8 py-4">
                
                <div className="order-2 lg:order-1 flex flex-col gap-y-6 lg:gap-y-8 w-full flex-1 min-w-[200px] max-w-[320px]">
                  {modules.filter(m => m.side === 'left').map(item => (
                    <ModuleCard key={item.title} item={item} onClick={handleModuleClick} />
                  ))}
                </div>

                {/* Center orb */}
                <div className="order-1 lg:order-2 flex flex-col items-center justify-center flex-shrink-0 gap-y-8 lg:gap-y-12">
                  <button
                    onClick={() => setChatOpen(true)}
                    className="flex h-[150px] w-[150px] xl:h-[180px] xl:w-[180px] items-center justify-center rounded-full bg-gradient-to-br from-red-500 to-red-700 shadow-[0_16px_55px_rgba(239,35,60,0.45)] ring-[14px] ring-red-100/60 hover:scale-105 transition-transform cursor-pointer relative z-20"
                  >
                    <div className="text-center text-white px-2">
                      <div className="mx-auto mb-2 flex items-center justify-center rounded-full bg-white/20 px-2 py-1 w-fit">
                        <span className="rounded-full bg-white px-2 py-0.5 text-base font-black text-red-600">∞</span>
                      </div>
                      <h2 className="text-lg font-black leading-tight">Lesedi Chat</h2>
                      <p className="mt-0.5 text-xs font-semibold opacity-90">Your AI Partner</p>
                      <div className="mt-2 text-base tracking-widest opacity-60">··〰〰··</div>
                    </div>
                  </button>

                  <div className="w-full flex-1 min-w-[200px] max-w-[320px]">
                    {modules.filter(m => m.side === 'bottom').map(item => (
                      <ModuleCard key={item.title} item={item} onClick={handleModuleClick} />
                    ))}
                  </div>
                </div>

                {/* Module cards */}
                <div className="order-3 flex flex-col gap-y-6 lg:gap-y-8 w-full flex-1 min-w-[200px] max-w-[320px]">
                  {modules.filter(m => m.side === 'right').map(item => (
                    <ModuleCard key={item.title} item={item} onClick={handleModuleClick} />
                  ))}
                </div>

              </div>

              <div className="z-20 w-full max-w-xl px-4 flex-shrink-0 relative flex flex-col items-center mt-8 lg:mt-6">
                
                {/* Bottom thinking */}
                <div className={`absolute -top-12 left-6 lg:left-4 flex h-10 items-center gap-2 rounded-full px-4 text-xs font-semibold shadow-md ${darkMode ? 'bg-zinc-800 text-zinc-300' : 'bg-white text-zinc-600'}`}>
                  <Sparkles size={13} className={isThinking ? 'text-red-500 animate-pulse' : 'text-zinc-400'} />
                  {isThinking ? 'Lesedi is thinking...' : 'Lesedi is ready...'}
                </div>

                {/* Bottom input bar */}
                <div
                  onClick={() => setChatOpen(true)}
                  className={`flex h-14 w-full items-center rounded-full border px-4 shadow-[0_10px_35px_rgba(0,0,0,0.12)] cursor-text hover:shadow-[0_10px_35px_rgba(239,35,60,0.14)] transition-shadow ${darkMode ? 'border-zinc-700 bg-zinc-800' : 'border-zinc-200 bg-white'}`}
                >
                  <Paperclip className="mr-4 text-zinc-400 flex-shrink-0" size={20} />
                  <span className="flex-1 text-base text-zinc-400 select-none truncate">Ask Lesedi anything...</span>
                  <Mic className="mx-4 text-zinc-400 flex-shrink-0" size={22} />
                  <button
                    onClick={e => { e.stopPropagation(); setChatOpen(true); }}
                    className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-red-600 text-white shadow-lg shadow-red-200 hover:bg-red-700 transition-colors"
                  >
                    <SendHorizontal size={22} fill="currentColor" />
                  </button>
                </div>

              </div>

              {/* Right panel */}
              <div className="absolute right-6 top-1/2 -translate-y-1/2 z-30 w-[200px] hidden 2xl:block">
                <div className={`rounded-2xl border p-4 shadow-[0_12px_40px_rgba(0,0,0,0.1)] mb-5 ${darkMode ? 'border-zinc-700 bg-zinc-800/90' : 'border-zinc-200 bg-white/90'}`}>
                  <div className="flex items-center justify-between cursor-pointer" onClick={() => setQuickAccessOpen(!quickAccessOpen)}>
                    <h3 className={`text-sm font-extrabold select-none ${darkMode ? 'text-zinc-100' : 'text-zinc-900'}`}>Quick Access</h3>
                    <Sparkles className={`text-red-500 transition-transform ${quickAccessOpen ? 'rotate-180' : ''}`} size={15} />
                  </div>
                  {quickAccessOpen && (
                    <div className={`mt-3 overflow-hidden rounded-xl border ${darkMode ? 'border-zinc-700' : 'border-zinc-100'}`}>
                      {[
                        [Square, 'New Chat', 'new'],
                        [Upload, 'Upload File', 'upload'],
                        [Mic, 'Voice Note', 'voice'],
                        [Camera, 'Camera Scan', 'camera'],
                      ].map(([Icon, label, action], idx, arr) => (
                        <div key={label} onClick={() => handleQuickAction(action)}
                          className={`flex items-center justify-between px-3 py-3 cursor-pointer hover:bg-red-50 transition-colors ${idx !== arr.length - 1 ? `border-b ${darkMode ? 'border-zinc-700' : 'border-zinc-100'}` : ''}`}>
                          <div className={`flex items-center gap-2.5 text-xs font-medium ${darkMode ? 'text-zinc-300' : 'text-zinc-700'}`}>
                            <span className={`flex h-7 w-7 items-center justify-center rounded-lg text-red-600 shadow-sm ${darkMode ? 'bg-zinc-700' : 'bg-white'}`}><Icon size={15} /></span>
                            {label}
                          </div>
                          <Plus className="text-red-600" size={16} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className={`rounded-2xl border p-4 shadow-[0_12px_40px_rgba(0,0,0,0.08)] ${darkMode ? 'border-zinc-700 bg-zinc-800/90' : 'border-zinc-200 bg-white/90'}`}>
                  <div className="flex items-center justify-between cursor-pointer" onClick={() => setTodaysFocusOpen(!todaysFocusOpen)}>
                    <h3 className={`text-sm font-extrabold select-none ${darkMode ? 'text-zinc-100' : 'text-zinc-900'}`}>Today's Focus</h3>
                    <Target className={`text-red-500 transition-transform ${todaysFocusOpen ? 'rotate-180' : ''}`} size={14} />
                  </div>
                  {todaysFocusOpen && (
                    <div className={`mt-3 overflow-hidden rounded-xl border ${darkMode ? 'border-zinc-700' : 'border-zinc-100'}`}>
                      {[
                        [Grid2X2, 'Active Paths', 'text-cyan-500'],
                        [Lightbulb, 'New Insights', 'text-amber-500'],
                        [Archive, 'Goal Set', 'text-orange-500'],
                      ].map(([Icon, label, color], idx, arr) => (
                        <div key={label} onClick={() => { setInput(`Help me with: ${label}`); setChatOpen(true); }}
                          className={`flex items-center gap-3 px-3 py-3 text-xs font-medium cursor-pointer hover:bg-red-50 transition-colors ${idx !== arr.length - 1 ? `border-b ${darkMode ? 'border-zinc-700' : 'border-zinc-100'}` : ''} ${darkMode ? 'text-zinc-300' : 'text-zinc-700'}`}>
                          <Icon className={color} size={17} />
                          {label}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            /* Non-dashboard views */
            <div className="absolute inset-0 flex items-center justify-center">
              {navViews[activeNav]}
              {activeNav === 'My Paths' && (
                <button
                  onClick={() => setShowNewPath(true)}
                  className={`absolute bottom-5 right-4 flex items-center gap-2 rounded-full px-5 py-3 text-xs font-bold shadow-lg hover:bg-red-50 transition-colors ${darkMode ? 'bg-zinc-800 text-zinc-200' : 'bg-white text-zinc-700'}`}
                >
                  <Plus className="text-red-600" size={18} /> Add New Path
                </button>
              )}
            </div>
          )}
        </main>
      </div>

      {/* ── Overlays ── */}
      {chatOpen && (
        <ChatOverlay
          messages={messages}
          input={input}
          setInput={setInput}
          isLoading={isLoading}
          onSend={handleSend}
          onClose={() => setChatOpen(false)}
          selectedLanguage={selectedLanguage}
          setSelectedLanguage={setSelectedLanguage}
          userName={userName}
          messagesEndRef={messagesEndRef}
          onFileUpload={handleFileUpload}
          uploadedFile={uploadedFile}
          clearUpload={clearUpload}
        />
      )}

      {showSearch && <SearchOverlay onClose={() => setShowSearch(false)} onSearch={handleSearchSubmit} />}
      {showNewPath && <NewPathModal onClose={() => setShowNewPath(false)} onAdd={handleAddPath} />}

      {/* Toast container */}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
        {toasts.map(t => (
          <div key={t.id} className="pointer-events-auto">
            <Toast toast={t} onDismiss={dismissToast} />
          </div>
        ))}
      </div>
    </div>
  );
}