import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Layout, Grid, Edit3, Key, Cpu, Maximize, Save, Upload, FileSpreadsheet, Eye, EyeOff, X } from 'lucide-react';
import { AppTab, StoryboardItem, AspectRatio, GeminiModel } from './types';
import EditorTab from './components/EditorTab';
import GalleryTab from './components/GalleryTab';

const STORAGE_KEY = 'gemini_api_key';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.EDITOR);
  const [items, setItems] = useState<StoryboardItem[]>([
    { id: '1', cutNumber: 1, context: '', isGenerating: false }
  ]);
  const [selectedModel, setSelectedModel] = useState<GeminiModel>('gemini-3-pro-image-preview');
  const [selectedRatio, setSelectedRatio] = useState<AspectRatio>('4:3');
  const [apiKey, setApiKey] = useState<string>('');
  const [apiKeyInput, setApiKeyInput] = useState<string>('');
  const [showKeyModal, setShowKeyModal] = useState<boolean>(false);
  const [showKeyValue, setShowKeyValue] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load API key from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      setApiKey(stored);
      // Inject into process.env equivalent for geminiService
      (window as any).__GEMINI_API_KEY__ = stored;
    }
  }, []);

  const handleSaveKey = () => {
    const trimmed = apiKeyInput.trim();
    if (!trimmed) return;
    localStorage.setItem(STORAGE_KEY, trimmed);
    setApiKey(trimmed);
    (window as any).__GEMINI_API_KEY__ = trimmed;
    setShowKeyModal(false);
    setApiKeyInput('');
  };

  const handleRemoveKey = () => {
    localStorage.removeItem(STORAGE_KEY);
    setApiKey('');
    (window as any).__GEMINI_API_KEY__ = '';
    setShowKeyModal(false);
  };

  const handleUpdateItems = (newItems: StoryboardItem[]) => {
    setItems(newItems);
  };

  const exportProject = () => {
    const projectData = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      model: selectedModel,
      ratio: selectedRatio,
      items: items
    };
    const blob = new Blob([JSON.stringify(projectData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `storyboard_project_${new Date().getTime()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportCSV = () => {
    const headers = ['Cut Number', 'Narration/Context', 'Has Image'];
    const rows = items.map(item => [
      item.cutNumber,
      `"${item.context.replace(/"/g, '""')}"`,
      item.imageUrl ? 'Yes' : 'No'
    ]);
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `storyboard_list_${new Date().getTime()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const importProject = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.items && Array.isArray(data.items)) {
          setItems(data.items);
          if (data.model) setSelectedModel(data.model);
          if (data.ratio) setSelectedRatio(data.ratio);
          alert('Project loaded successfully!');
        }
      } catch (err) {
        alert('Failed to parse project file.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // ── No API Key Screen ─────────────────────────────────────────────────────
  if (!apiKey) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0a0a0a] p-6">
        <div className="bg-[#1a1a1a] p-10 rounded-3xl shadow-2xl max-w-md w-full text-center border border-white/5">
          <div className="bg-white p-5 rounded-3xl w-20 h-20 flex items-center justify-center mx-auto mb-8">
            <Key className="text-black w-10 h-10" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-4 tracking-tight">System Locked</h1>
          <p className="text-white/40 mb-2 leading-relaxed text-sm">
            Enter your Gemini API key to generate AI storyboard sketches.
          </p>
          <p className="text-white/20 mb-8 text-xs">
            Key is stored locally in your browser only.
          </p>

          <div className="relative mb-4">
            <input
              type={showKeyValue ? 'text' : 'password'}
              placeholder="AIza..."
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSaveKey()}
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white text-sm placeholder-white/20 outline-none focus:border-white/30 pr-12"
            />
            <button
              onClick={() => setShowKeyValue(v => !v)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white"
            >
              {showKeyValue ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          <button
            onClick={handleSaveKey}
            disabled={!apiKeyInput.trim()}
            className="w-full bg-white text-black font-black py-4 px-8 rounded-2xl transition-all shadow-xl hover:bg-white/90 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            CONNECT
          </button>

          <a
            href="https://aistudio.google.com/apikey"
            target="_blank"
            rel="noopener noreferrer"
            className="block mt-4 text-xs text-white/20 hover:text-white/50 transition-colors"
          >
            Get a free API key →
          </a>
        </div>
      </div>
    );
  }

  // ── API Key Edit Modal ─────────────────────────────────────────────────────
  const KeyModal = () => (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-6">
      <div className="bg-[#1a1a1a] p-8 rounded-3xl border border-white/10 w-full max-w-sm shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-white font-black uppercase tracking-widest text-sm">API Key</h3>
          <button onClick={() => setShowKeyModal(false)} className="text-white/30 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div className="relative mb-4">
          <input
            type={showKeyValue ? 'text' : 'password'}
            placeholder="AIza..."
            value={apiKeyInput}
            onChange={(e) => setApiKeyInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSaveKey()}
            className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white text-sm placeholder-white/20 outline-none focus:border-white/30 pr-12"
          />
          <button
            onClick={() => setShowKeyValue(v => !v)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white"
          >
            {showKeyValue ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleRemoveKey}
            className="flex-1 py-3 border border-red-500/30 text-red-400 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-red-500/10 transition-all"
          >
            Remove
          </button>
          <button
            onClick={handleSaveKey}
            disabled={!apiKeyInput.trim()}
            className="flex-1 py-3 bg-white text-black rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-white/90 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            Update
          </button>
        </div>
      </div>
    </div>
  );

  // ── Main App ───────────────────────────────────────────────────────────────
  return (
    <div className="flex min-h-screen bg-[#121212] text-white">
      {showKeyModal && <KeyModal />}

      <input
        type="file"
        ref={fileInputRef}
        onChange={importProject}
        accept=".json"
        className="hidden"
      />

      {/* Sidebar */}
      <nav className="w-20 bg-[#0a0a0a] flex flex-col border-r border-white/5 sticky top-0 h-screen shrink-0 items-center py-8 z-30">
        <div className="mb-12 bg-white/10 p-2.5 rounded-xl flex items-center justify-center">
          <Layout className="text-white" size={20} />
        </div>

        <div className="flex-1 flex flex-col items-center space-y-8">
          <button
            onClick={() => setActiveTab(AppTab.EDITOR)}
            title="Editor Mode"
            className={`p-3 rounded-xl transition-all duration-200 flex items-center justify-center ${
              activeTab === AppTab.EDITOR
                ? 'bg-white text-black shadow-lg scale-110'
                : 'text-white/40 hover:bg-white/5 hover:text-white'
            }`}
          >
            <Edit3 size={20} strokeWidth={2.5} />
          </button>

          <button
            onClick={() => setActiveTab(AppTab.GALLERY)}
            title="Gallery Mode"
            className={`p-3 rounded-xl transition-all duration-200 flex items-center justify-center ${
              activeTab === AppTab.GALLERY
                ? 'bg-white text-black shadow-lg scale-110'
                : 'text-white/40 hover:bg-white/5 hover:text-white'
            }`}
          >
            <Grid size={20} strokeWidth={2.5} />
          </button>
        </div>

        <div className="mt-auto flex flex-col items-center gap-4">
          <button
            onClick={() => { setApiKeyInput(''); setShowKeyModal(true); }}
            title="API Key Settings"
            className="p-2 text-white/20 hover:text-white hover:bg-white/5 rounded-xl transition-all"
          >
            <Key size={16} />
          </button>
          <div className="h-1.5 w-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-[#121212]">
        <header className="bg-[#121212]/90 backdrop-blur-xl border-b border-white/5 px-10 py-5 sticky top-0 z-20 flex flex-col xl:flex-row gap-6 justify-between items-center">
          <div className="flex items-center gap-6 w-full xl:w-auto">
            <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
              {activeTab === AppTab.EDITOR ? 'Editor' : 'Visuals'}
              <span className="text-[10px] bg-white/5 text-white/40 px-2 py-1 rounded-md uppercase tracking-widest">{items.length} Cuts</span>
            </h2>

            <div className="flex items-center gap-2 ml-4">
              <button
                onClick={handleImportClick}
                className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl text-xs font-bold transition-all text-white/80"
              >
                <Upload size={14} /> Open
              </button>
              <button
                onClick={exportProject}
                className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl text-xs font-bold transition-all text-white/80"
              >
                <Save size={14} /> Save Project
              </button>
              <button
                onClick={exportCSV}
                title="Export as CSV"
                className="flex items-center justify-center w-10 h-10 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl text-white/40 hover:text-green-400 transition-all"
              >
                <FileSpreadsheet size={16} />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-white/5 p-1.5 rounded-2xl border border-white/5 ml-auto">
            <div className="flex items-center gap-2 px-3 border-r border-white/10">
              <Cpu size={16} className="text-white/40" />
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value as GeminiModel)}
                className="bg-transparent text-white text-xs font-bold focus:outline-none cursor-pointer"
              >
                <option value="gemini-3-pro-image-preview" className="bg-[#1a1a1a] text-white">Gemini 3 Pro</option>
                <option value="gemini-2.5-flash-image" className="bg-[#1a1a1a] text-white">Gemini 2.5 Flash</option>
              </select>
            </div>
            <div className="flex items-center gap-2 px-3">
              <Maximize size={16} className="text-white/40" />
              <select
                value={selectedRatio}
                onChange={(e) => setSelectedRatio(e.target.value as AspectRatio)}
                className="bg-transparent text-white text-xs font-bold focus:outline-none cursor-pointer"
              >
                <option value="16:9" className="bg-[#1a1a1a] text-white">16:9 Wide</option>
                <option value="4:3" className="bg-[#1a1a1a] text-white">4:3 TV</option>
                <option value="1:1" className="bg-[#1a1a1a] text-white">1:1 Square</option>
                <option value="3:4" className="bg-[#1a1a1a] text-white">3:4 Portrait</option>
                <option value="9:16" className="bg-[#1a1a1a] text-white">9:16 Vertical</option>
              </select>
            </div>
          </div>
        </header>

        <div className="p-10 max-w-7xl mx-auto pb-32">
          {activeTab === AppTab.EDITOR ? (
            <EditorTab
              items={items}
              onUpdate={handleUpdateItems}
              model={selectedModel}
              ratio={selectedRatio}
            />
          ) : (
            <GalleryTab
              items={items}
              onUpdate={handleUpdateItems}
              ratio={selectedRatio}
            />
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
