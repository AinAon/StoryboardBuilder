import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Wand2, Trash2, Download, ChevronUp, ChevronDown, Loader2, Image as ImageIcon } from 'lucide-react';
import { StoryboardItem, AspectRatio, GeminiModel } from '../types';
import { generateSketchImage } from '../services/geminiService';

interface StoryboardRowProps {
  item: StoryboardItem;
  index: number;
  total: number;
  onUpdate: (updates: Partial<StoryboardItem>) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  model: GeminiModel;
  ratio: AspectRatio;
  allItems: StoryboardItem[];
}

const StoryboardRow: React.FC<StoryboardRowProps> = ({
  item, index, total, onUpdate, onRemove, onMoveUp, onMoveDown, model, ratio, allItems
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 1,
  };

  const getPreviewHeight = () => {
    const width = 320;
    switch (ratio) {
      case '16:9': return (9 / 16) * width;
      case '4:3': return (3 / 4) * width;
      case '1:1': return width;
      case '3:4': return (4 / 3) * width;
      case '9:16': return (16 / 9) * width;
      default: return 240;
    }
  };

  const handleGenerate = async () => {
    if (!item.context.trim()) return;
    onUpdate({ isGenerating: true });
    try {
      const previousContext = allItems.slice(0, index);
      const url = await generateSketchImage(item.context, model, ratio, previousContext);
      onUpdate({ imageUrl: url, isGenerating: false });
    } catch (error: any) {
      onUpdate({ isGenerating: false });
      if (error.message === 'API_KEY_INVALID' || error.message === 'No API key configured') {
        alert("Invalid or missing API key. Please update your key via the key icon in the sidebar.");
      } else {
        alert("Failed to generate sketch. Please check your connection and try again.");
      }
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group grid grid-cols-[80px_320px_1fr] gap-6 p-6 bg-[#1a1a1a] border rounded-3xl transition-all duration-300 ${
        isDragging ? 'opacity-40 shadow-2xl scale-[1.01] border-white/20' : 'shadow-sm border-white/5 hover:border-white/10 hover:shadow-xl'
      }`}
    >
      {/* Col 1: Number & Reorder */}
      <div className="flex flex-col items-center justify-between py-2 border-r border-white/5 pr-4">
        <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-2 text-white/10 hover:text-white hover:bg-white/5 rounded-xl">
          <GripVertical size={24} />
        </div>
        <div className="text-3xl font-black text-white tabular-nums tracking-tighter">
          {item.cutNumber.toString().padStart(2, '0')}
        </div>
        <div className="flex flex-col gap-1">
          <button onClick={onMoveUp} disabled={index === 0} className={`p-1 rounded-lg ${index === 0 ? 'text-white/5' : 'text-white/20 hover:text-white'}`}>
            <ChevronUp size={24} />
          </button>
          <button onClick={onMoveDown} disabled={index === total - 1} className={`p-1 rounded-lg ${index === total - 1 ? 'text-white/5' : 'text-white/20 hover:text-white'}`}>
            <ChevronDown size={24} />
          </button>
        </div>
      </div>

      {/* Col 2: Image Preview */}
      <div
        className="relative bg-black rounded-2xl overflow-hidden shadow-inner border border-white/5 group/image transition-all"
        style={{ width: '320px', height: `${getPreviewHeight()}px` }}
      >
        {item.imageUrl ? (
          <>
            <img src={item.imageUrl} alt="Cut Visual" className="w-full h-full object-contain" />
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/image:opacity-100 flex items-center justify-center gap-4 transition-all duration-300 backdrop-blur-sm">
              <button
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = item.imageUrl!;
                  link.download = `cut_${item.cutNumber}.png`;
                  link.click();
                }}
                className="bg-white p-3 rounded-2xl text-black hover:scale-110 active:scale-95 transition-transform"
              >
                <Download size={20} />
              </button>
              <button onClick={() => onUpdate({ imageUrl: undefined })} className="bg-white p-3 rounded-2xl text-red-600 hover:scale-110 active:scale-95 transition-transform">
                <Trash2 size={20} />
              </button>
            </div>
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-white/5">
            {item.isGenerating ? (
              <div className="flex flex-col items-center">
                <Loader2 className="animate-spin text-white mb-3" size={32} />
                <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Synthesizing...</span>
              </div>
            ) : (
              <ImageIcon size={48} strokeWidth={1} />
            )}
          </div>
        )}
      </div>

      {/* Col 3: Description & Generation */}
      <div className="flex flex-col gap-4">
        <div className="flex-1 flex flex-col gap-2">
          <label className="text-[10px] font-black text-white/20 uppercase tracking-widest px-1">Cut Narration / Action</label>
          <textarea
            placeholder="Type your story beats here..."
            value={item.context}
            onChange={(e) => onUpdate({ context: e.target.value })}
            className="flex-1 w-full p-6 bg-white/[0.02] border border-white/5 rounded-2xl resize-none focus:bg-white/[0.05] focus:border-white/20 outline-none text-white leading-relaxed font-medium transition-all"
          />
        </div>

        <div className="flex justify-between items-center px-1">
          <button onClick={onRemove} className="flex items-center gap-2 text-white/10 hover:text-red-500 text-xs font-black uppercase tracking-widest transition-colors">
            <Trash2 size={16} /> Discard
          </button>

          <button
            onClick={handleGenerate}
            disabled={item.isGenerating || !item.context.trim()}
            className="flex items-center gap-3 bg-white hover:bg-white/90 disabled:bg-white/10 disabled:text-white/20 text-black px-8 py-3.5 rounded-2xl font-black uppercase tracking-tighter text-sm transition-all shadow-xl active:scale-[0.98]"
          >
            {item.isGenerating ? <Loader2 className="animate-spin" size={20} /> : <Wand2 size={20} />}
            {item.imageUrl ? 'Redesign' : 'Generate'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default StoryboardRow;
