import React, { useState } from 'react';
import { 
  ShoppingBag, 
  Settings2, 
  Palette, 
  Box, 
  FileText, 
  CheckCircle2, 
  ChevronRight,
  Info,
  Layers,
  Sparkles
} from 'lucide-react';
import { cn } from '../lib/utils';

type GarmentType = 
  | 'Compression Socks' 
  | 'Arm Sleeves' 
  | 'Gloves' 
  | 'Glove With Sleeve' 
  | 'Sports Bra' 
  | 'Leggings' 
  | 'Full Body Garments' 
  | 'Burn Pressure Garments' 
  | 'Post Surgical Garments';

interface GarmentOptions {
  compressionClass: string;
  toeOption: string;
  fabricType: string;
  color: string;
  zipper: boolean;
  siliconeBand: boolean;
}

const GARMENT_TYPES: GarmentType[] = [
  'Compression Socks',
  'Arm Sleeves',
  'Gloves',
  'Glove With Sleeve',
  'Sports Bra',
  'Leggings',
  'Full Body Garments',
  'Burn Pressure Garments',
  'Post Surgical Garments'
];

const COMPRESSION_CLASSES = ['Class 1 (18-21 mmHg)', 'Class 2 (23-32 mmHg)', 'Class 3 (34-46 mmHg)', 'Class 4 (>49 mmHg)'];
const FABRIC_TYPES = ['Circular Knit', 'Flat Knit', 'Powernet', 'Lycra Blend'];
const COLORS = [
  { name: 'Beige', hex: '#F5F5DC' },
  { name: 'Black', hex: '#000000' },
  { name: 'Sand', hex: '#C2B280' },
  { name: 'Caramel', hex: '#AF6E4D' },
  { name: 'Navy', hex: '#000080' }
];

interface GarmentConfiguratorProps {
  config: { type: GarmentType; options: GarmentOptions };
  onUpdate: (data: { type: GarmentType; options: GarmentOptions }) => void;
}

const GarmentConfigurator: React.FC<GarmentConfiguratorProps> = ({ config, onUpdate }) => {
  const [showSpec, setShowSpec] = useState(false);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Selection Area */}
        <div className="space-y-6">
          <div className="medical-card p-6">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">1. Select Garment Type</h4>
            <div className="grid grid-cols-1 gap-2">
              {GARMENT_TYPES.map(type => (
                <button
                  key={type}
                  onClick={() => onUpdate({ ...config, type })}
                  className={cn(
                    "flex items-center justify-between p-4 rounded-2xl font-bold transition-all text-left border-2",
                    config.type === type 
                      ? "bg-blue-600 border-blue-600 text-white shadow-xl shadow-blue-100" 
                      : "bg-white border-slate-50 text-slate-500 hover:border-slate-100 hover:bg-slate-50"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center",
                      config.type === type ? "bg-white/20" : "bg-slate-100"
                    )}>
                      <ShoppingBag className={cn("w-4 h-4", config.type === type ? "text-white" : "text-slate-400")} />
                    </div>
                    <span className="text-xs">{type}</span>
                  </div>
                  <CheckCircle2 className={cn("w-4 h-4 transition-all", config.type === type ? "opacity-100 scale-100" : "opacity-0 scale-50")} />
                </button>
              ))}
            </div>
          </div>

          <div className="medical-card p-6 bg-slate-900 text-white border-none shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <Sparkles className="w-5 h-5 text-blue-400" />
              <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Configuration Summary</h4>
            </div>
            <div className="space-y-4">
              <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                <p className="text-[9px] font-black text-slate-500 uppercase mb-1">Target Product</p>
                <p className="text-sm font-bold">{config.type}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                  <p className="text-[9px] font-black text-slate-500 uppercase mb-1">Class</p>
                  <p className="text-xs font-bold">{config.options.compressionClass.split(' ')[1]}</p>
                </div>
                <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                  <p className="text-[9px] font-black text-slate-500 uppercase mb-1">Fabric</p>
                  <p className="text-xs font-bold">{config.options.fabricType}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Options Area */}
        <div className="space-y-6">
          <div className="medical-card p-8">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-8">2. Technical Specifications</h4>
            
            <div className="space-y-8">
              {/* Compression Class */}
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Settings2 className="w-3 h-3" />
                  Compression Class
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {COMPRESSION_CLASSES.map(cls => (
                    <button
                      key={cls}
                      onClick={() => onUpdate({ ...config, options: { ...config.options, compressionClass: cls } })}
                      className={cn(
                        "px-4 py-3 rounded-xl text-xs font-bold text-left transition-all",
                        config.options.compressionClass === cls ? "bg-blue-50 text-blue-600 ring-2 ring-blue-100" : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                      )}
                    >
                      {cls}
                    </button>
                  ))}
                </div>
              </div>

              {/* Fabric & Toe */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fabric Type</label>
                  <select 
                    value={config.options.fabricType}
                    onChange={(e) => onUpdate({ ...config, options: { ...config.options, fabricType: e.target.value } })}
                    className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-xs font-bold outline-none"
                  >
                    {FABRIC_TYPES.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Toe Style</label>
                  <div className="flex p-1 bg-slate-50 rounded-xl">
                    {['Open Toe', 'Closed Toe'].map(t => (
                      <button
                        key={t}
                        onClick={() => onUpdate({ ...config, options: { ...config.options, toeOption: t } })}
                        className={cn(
                          "flex-1 py-2 rounded-lg text-[10px] font-black uppercase transition-all",
                          config.options.toeOption === t ? "bg-white shadow-sm text-blue-600" : "text-slate-400"
                        )}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Extras */}
              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Hardware & Features</label>
                <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={() => onUpdate({ ...config, options: { ...config.options, zipper: !config.options.zipper } })}
                    className={cn(
                      "flex items-center gap-3 p-4 rounded-2xl border-2 transition-all",
                      config.options.zipper ? "bg-blue-50 border-blue-200 text-blue-700" : "bg-white border-slate-50 text-slate-400"
                    )}
                  >
                    <Box className="w-4 h-4" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Zipper</span>
                  </button>
                  <button 
                    onClick={() => onUpdate({ ...config, options: { ...config.options, siliconeBand: !config.options.siliconeBand } })}
                    className={cn(
                      "flex items-center gap-3 p-4 rounded-2xl border-2 transition-all",
                      config.options.siliconeBand ? "bg-blue-50 border-blue-200 text-blue-700" : "bg-white border-slate-50 text-slate-400"
                    )}
                  >
                    <Layers className="w-4 h-4" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Silicone</span>
                  </button>
                </div>
              </div>

              {/* Color */}
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Palette className="w-3 h-3" />
                  Fabric Color
                </label>
                <div className="flex flex-wrap gap-3">
                  {COLORS.map(c => (
                    <button
                      key={c.name}
                      onClick={() => onUpdate({ ...config, options: { ...config.options, color: c.name } })}
                      className={cn(
                        "w-10 h-10 rounded-full border-4 transition-all relative group",
                        config.options.color === c.name ? "border-blue-200 scale-110" : "border-transparent hover:scale-105"
                      )}
                      style={{ backgroundColor: c.hex }}
                      title={c.name}
                    >
                      {config.options.color === c.name && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className={cn("w-2 h-2 rounded-full", c.name === 'Black' ? 'bg-white' : 'bg-black')} />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Production Specification Display */}
      <div className="medical-card p-8 bg-white border-none shadow-xl overflow-hidden relative group">
        <div className="absolute top-0 right-0 p-8">
          <button 
            onClick={() => setShowSpec(!showSpec)}
            className="flex items-center gap-2 px-4 py-2 bg-slate-50 text-slate-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-50 hover:text-blue-600 transition-all border border-slate-100"
          >
            <FileText className="w-4 h-4" />
            {showSpec ? "Hide Spec" : "Generate Production Spec"}
          </button>
        </div>

        <div className="flex items-start gap-6">
          <div className="w-16 h-16 rounded-[2rem] bg-emerald-50 flex items-center justify-center shrink-0 shadow-lg shadow-emerald-50">
            <CheckCircle2 className="w-8 h-8 text-emerald-500" />
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-900 tracking-tight">Configuration Complete</h3>
            <p className="text-slate-400 text-xs font-bold mt-1">Ready for manufacturing validation</p>
          </div>
        </div>

        {showSpec && (
          <div className="mt-8 p-6 bg-slate-50 rounded-[2rem] border border-slate-100 animate-in slide-in-from-top-4 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div>
                <h5 className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] mb-6">Production Identity</h5>
                <div className="space-y-4">
                  <div className="flex justify-between border-b border-slate-200 pb-2">
                    <span className="text-[10px] font-black text-slate-400 uppercase">Batch ID</span>
                    <span className="text-[10px] font-mono font-bold text-slate-700">SPEC-{Math.random().toString(36).substr(2, 5).toUpperCase()}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200 pb-2">
                    <span className="text-[10px] font-black text-slate-400 uppercase">Garment Type</span>
                    <span className="text-[10px] font-black text-slate-700">{config.type.toUpperCase()}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200 pb-2">
                    <span className="text-[10px] font-black text-slate-400 uppercase">Target Compression</span>
                    <span className="text-[10px] font-black text-slate-700">{config.options.compressionClass.toUpperCase()}</span>
                  </div>
                </div>
              </div>
              <div>
                <h5 className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] mb-6">Material Requirements</h5>
                <div className="space-y-4">
                  <div className="flex justify-between border-b border-slate-200 pb-2">
                    <span className="text-[10px] font-black text-slate-400 uppercase">Base Fabric</span>
                    <span className="text-[10px] font-black text-slate-700">{config.options.fabricType.toUpperCase()}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200 pb-2">
                    <span className="text-[10px] font-black text-slate-400 uppercase">Hardware</span>
                    <span className="text-[10px] font-black text-slate-700">
                      {config.options.zipper ? 'NYLON ZIPPER, ' : ''}
                      {config.options.siliconeBand ? '3" GRIPPER BAND' : 'NONE'}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200 pb-2">
                    <span className="text-[10px] font-black text-slate-400 uppercase">Color Standard</span>
                    <span className="text-[10px] font-black text-slate-700">{config.options.color.toUpperCase()} HEX: {COLORS.find(c => c.name === config.options.color)?.hex}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GarmentConfigurator;
