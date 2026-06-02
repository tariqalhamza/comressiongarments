import React, { useState, useRef, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  Image as ImageIcon, 
  X, 
  Check,
  Type,
  Maximize2,
  MousePointer2,
  Camera
} from 'lucide-react';
import { cn } from '../lib/utils';
import { compressImage } from '../lib/imageUtils';
import { Annotation } from '../types';

interface ImageAnnotatorProps {
  photo: { url: string | null; annotations: Annotation[] };
  onUpdate: (data: { url: string | null; annotations: Annotation[] }) => void;
}

const ImageAnnotator: React.FC<ImageAnnotatorProps> = ({ photo, onUpdate }) => {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressedBase64 = await compressImage(file);
        onUpdate({ url: compressedBase64, annotations: [] });
      } catch (err) {
        console.error("Image compression failed:", err);
      }
    }
  };

  const clearImage = () => {
    onUpdate({ url: null, annotations: [] });
    setActiveId(null);
  };

  const handleContainerClick = (e: React.MouseEvent) => {
    if (!isAdding || !photo.url || !imageRef.current) return;

    const rect = imageRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    const newAnnotation: Annotation = {
      id: Math.random().toString(36).substr(2, 9),
      x,
      y,
      text: ''
    };

    onUpdate({ ...photo, annotations: [...photo.annotations, newAnnotation] });
    setActiveId(newAnnotation.id);
    setIsAdding(false);
  };

  const updateAnnotationText = (id: string, text: string) => {
    onUpdate({
      ...photo,
      annotations: photo.annotations.map(a => a.id === id ? { ...a, text } : a)
    });
  };

  const removeAnnotation = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = photo.annotations.filter(a => a.id !== id);
    onUpdate({ ...photo, annotations: updated });
    if (activeId === id) setActiveId(null);
  };

  return (
    <div className="medical-card p-6 overflow-hidden flex flex-col h-full bg-white">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Clinical Annotations</h4>
          <p className="text-[10px] font-bold text-slate-400 mt-1">Mark anatomical points on clinical photos</p>
        </div>
        <div className="flex gap-2">
          {photo.url && (
            <>
              <button 
                onClick={() => setIsAdding(!isAdding)}
                className={cn(
                  "p-2 rounded-xl transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-tighter",
                  isAdding ? "bg-blue-600 text-white shadow-lg" : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                )}
              >
                {isAdding ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                {isAdding ? "Cancel" : "Add Marker"}
              </button>
              <button 
                onClick={clearImage}
                className="p-2 bg-slate-50 text-slate-500 rounded-xl hover:bg-red-50 hover:text-red-500 transition-all"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>

      <div className="flex-1 relative min-h-[400px] bg-slate-50 rounded-3xl overflow-hidden border-2 border-dashed border-slate-100 group">
        {!photo.url ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
            <div className="w-20 h-20 bg-slate-100 rounded-[2.5rem] flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-blue-50 transition-all duration-500">
              <Camera className="w-10 h-10 text-slate-400 group-hover:text-blue-500 transition-colors" />
            </div>
            <h5 className="font-black text-slate-900 mb-2">Upload Clinical Photo</h5>
            <p className="text-xs font-bold text-slate-400 max-w-[200px] mb-6">
              Clear photos help in precise garment customization
            </p>
            <label className="btn-primary cursor-pointer flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Select Photo
              <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
            </label>
          </div>
        ) : (
          <div 
            ref={containerRef}
            className={cn(
              "relative w-full h-full flex items-center justify-center overflow-hidden cursor-crosshair",
              !isAdding && "cursor-default"
            )}
            onClick={handleContainerClick}
          >
            <img 
              ref={imageRef}
              src={photo.url} 
              alt="Clinical" 
              className="max-w-full max-h-full object-contain pointer-events-none select-none shadow-2xl rounded-xl"
            />
            
            {photo.annotations.map((a) => (
              <div 
                key={a.id}
                className="absolute"
                style={{ left: `${a.x}%`, top: `${a.y}%` }}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveId(activeId === a.id ? null : a.id);
                  }}
                  className={cn(
                    "w-6 h-6 -ml-3 -mt-3 rounded-full flex items-center justify-center text-[10px] font-black transition-all transform hover:scale-110",
                    activeId === a.id 
                      ? "bg-blue-600 text-white ring-4 ring-blue-100 scale-125 z-20" 
                      : "bg-white text-blue-600 shadow-lg border-2 border-blue-600 z-10"
                  )}
                >
                  {photo.annotations.indexOf(a) + 1}
                </button>

                {activeId === a.id && (
                  <div className="absolute left-8 top-1/2 -translate-y-1/2 w-64 bg-white rounded-2xl shadow-2xl border border-slate-100 p-4 z-30 animate-in fade-in zoom-in-95 duration-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Marker #{photo.annotations.indexOf(a) + 1}</span>
                      <button 
                        onClick={(e) => removeAnnotation(a.id, e)}
                        className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <textarea 
                      autoFocus
                      placeholder="Enter clinical note..."
                      value={a.text}
                      onChange={(e) => updateAnnotationText(a.id, e.target.value)}
                      className="w-full bg-slate-50 border-none rounded-xl p-3 text-xs font-bold focus:ring-2 focus:ring-blue-100 outline-none transition-all resize-none min-h-[80px]"
                    />
                    <div className="mt-3 flex justify-end">
                      <button 
                        onClick={(e) => { e.stopPropagation(); setActiveId(null); }}
                        className="px-4 py-2 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all"
                      >
                        Done
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {photo.url && photo.annotations.length > 0 && (
        <div className="mt-6 p-4 bg-slate-50 rounded-2xl border border-slate-100">
          <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Annotation Summary</h5>
          <div className="space-y-2">
            {photo.annotations.map((a, i) => (
              <div key={a.id} className="flex items-start gap-3">
                <span className="w-5 h-5 rounded bg-blue-100 text-blue-600 text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                <p className="text-[11px] font-bold text-slate-600 italic">
                  {a.text || "No notes added..."}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageAnnotator;
