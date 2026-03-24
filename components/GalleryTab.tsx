
import React from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { StoryboardItem, AspectRatio } from '../types';
import { ImageOff, Trash2, GripHorizontal } from 'lucide-react';

interface GalleryTabProps {
  items: StoryboardItem[];
  onUpdate: (items: StoryboardItem[]) => void;
  ratio: AspectRatio;
}

const SortableGalleryItem = ({ 
  item, 
  onRemove,
  ratio
}: { 
  item: StoryboardItem; 
  onRemove: () => void;
  ratio: AspectRatio;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 1,
  };

  const getAspectClass = () => {
    switch(ratio) {
      case '16:9': return 'aspect-video';
      case '4:3': return 'aspect-[4/3]';
      case '1:1': return 'aspect-square';
      case '3:4': return 'aspect-[3/4]';
      case '9:16': return 'aspect-[9/16]';
      default: return 'aspect-video';
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative flex flex-col gap-3 bg-[#1a1a1a] p-3 rounded-2xl border border-white/5 transition-all ${
        isDragging ? 'opacity-50 scale-105 shadow-2xl z-50' : 'hover:border-white/20'
      }`}
    >
      <div className={`relative ${getAspectClass()} bg-black border border-white/5 rounded-xl overflow-hidden flex items-center justify-center`}>
        {item.imageUrl ? (
          <img src={item.imageUrl} alt="Cut" className="w-full h-full object-contain" />
        ) : (
          <div className="flex flex-col items-center justify-center text-white/10">
            <ImageOff size={32} />
          </div>
        )}

        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-3">
          <div {...attributes} {...listeners} className="self-end p-2 bg-white/10 rounded-lg cursor-grab text-white hover:bg-white hover:text-black">
            <GripHorizontal size={18} />
          </div>
          <button onClick={onRemove} className="self-center bg-red-500 hover:bg-red-600 text-white p-3 rounded-2xl shadow-lg">
            <Trash2 size={20} />
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-1 px-1">
        <div className="flex justify-between items-center">
          <span className="text-sm font-black text-white">#{item.cutNumber.toString().padStart(2, '0')}</span>
          <div className="h-1.5 w-1.5 rounded-full bg-white/10 group-hover:bg-white" />
        </div>
        <p className="text-[11px] text-white/40 line-clamp-2 leading-tight h-8 font-medium italic">
          {item.context || 'Untitled Scene'}
        </p>
      </div>
    </div>
  );
};

const GalleryTab: React.FC<GalleryTabProps> = ({ items, onUpdate, ratio }) => {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);
      onUpdate(arrayMove(items, oldIndex, newIndex).map((item, idx) => ({ ...item, cutNumber: idx + 1 })));
    }
  };

  const removeItem = (id: string) => {
    onUpdate(items.filter(item => item.id !== id).map((item, idx) => ({ ...item, cutNumber: idx + 1 })));
  };

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-40 text-white/20 border-2 border-dashed border-white/5 rounded-3xl">
        <ImageOff size={48} className="mb-4" />
        <p className="text-lg font-bold text-white/40 uppercase tracking-widest">Story empty</p>
      </div>
    );
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={items} strategy={rectSortingStrategy}>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {items.map((item) => (
            <SortableGalleryItem key={item.id} item={item} onRemove={() => removeItem(item.id)} ratio={ratio} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
};

export default GalleryTab;
