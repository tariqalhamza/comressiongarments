import React from 'react';
import { Ruler, Camera, ShoppingBag, Activity } from 'lucide-react';
import { Annotation } from '../types';
import logoImg from '../assets/images/overplast_brand_logo_teal_1779021512013.png';

interface ClinicalReportProps {
  patient: { name: string; id: string };
  measurements: any;
  photos: { url: string | null; annotations: Annotation[] };
  garment: { type: string; options: any };
  date: string;
  notes: string;
  insights?: string[];
  unit: string;
}

const ClinicalReport: React.FC<ClinicalReportProps> = ({ 
  patient, 
  measurements, 
  photos, 
  garment, 
  date, 
  notes, 
  insights,
  unit 
}) => {
  return (
    <div className="bg-white p-12 text-slate-900 font-sans max-w-[210mm] mx-auto print:m-0 print:p-8" id="clinical-report">
      {/* Header */}
      <div className="flex justify-between items-start border-b-4 border-slate-900 pb-8 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 flex-shrink-0 flex items-center justify-center bg-white rounded-2xl p-1 shadow-md border border-slate-100">
            <img 
              src={logoImg} 
              alt="OVERPLAST Logo" 
              className="w-full h-full object-contain"
              referrerPolicy="no-referrer"
            />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 leading-none tracking-tight">OVERPLAST</h1>
            <p className="text-xs font-black text-blue-600 uppercase tracking-widest mt-1">Medical Compression</p>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider leading-none mt-0.5">Measurement System</p>
          </div>
        </div>
        <div className="text-right">
          <h2 className="text-md font-black tracking-tight text-slate-900 uppercase">Clinical Report</h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">{new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
      </div>

      {/* Patient Section */}
      <div className="grid grid-cols-2 gap-8 mb-12">
        <div className="p-6 bg-slate-50 rounded-2xl">
          <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Patient Identity</h2>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-[10px] font-bold text-slate-500 uppercase">Full Name</span>
              <span className="text-sm font-black">{patient.name || 'NOT SPECIFIED'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[10px] font-bold text-slate-500 uppercase">MRN</span>
              <span className="text-sm font-black">{patient.id || 'N/A'}</span>
            </div>
          </div>
        </div>
        <div className="p-6 bg-slate-50 rounded-2xl">
          <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Assessor Notes</h2>
          <p className="text-[10px] font-bold text-slate-600 italic leading-relaxed">
            {notes || "No additional clinical notes recorded for this session."}
          </p>
        </div>
      </div>

      {/* Measurements Section */}
      <div className="mb-12">
        <div className="flex items-center gap-3 mb-6">
          <Ruler className="w-5 h-5 text-slate-900" />
          <h2 className="text-sm font-black uppercase tracking-widest">Anatomical Matrix ({unit.toUpperCase()})</h2>
        </div>
        <div className="border border-slate-100 rounded-2xl overflow-hidden">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase">
                <th className="px-6 py-4 text-left">Landmark</th>
                <th className="px-6 py-4 text-center">Left Limb</th>
                <th className="px-6 py-4 text-center">Right Limb</th>
                <th className="px-6 py-4 text-center">Diff.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {Object.entries(measurements).map(([key, data]: [string, any]) => {
                if (!data.left && !data.right) return null;
                const l = parseFloat(data.left) || 0;
                const r = parseFloat(data.right) || 0;
                const diff = Math.abs(l - r).toFixed(1);
                
                return (
                  <tr key={key}>
                    <td className="px-6 py-4 text-xs font-black uppercase text-slate-700">{key}</td>
                    <td className="px-6 py-4 text-center text-xs font-bold text-slate-600">{data.left || '--'}</td>
                    <td className="px-6 py-4 text-center text-xs font-bold text-slate-600">{data.right || '--'}</td>
                    <td className="px-6 py-4 text-center text-[10px] font-black text-slate-400">{diff} {unit}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Photography Section */}
      {photos.url && (
        <div className="mb-12 break-before-page">
          <div className="flex items-center gap-3 mb-6">
            <Camera className="w-5 h-5 text-slate-900" />
            <h2 className="text-sm font-black uppercase tracking-widest">Clinical Photography & Markings</h2>
          </div>
          <div className="relative rounded-3xl overflow-hidden bg-slate-50 mb-6 border border-slate-100">
            <img src={photos.url} alt="Clinical" className="w-full h-auto" />
            {photos.annotations.map((a, i) => (
              <div 
                key={a.id} 
                className="absolute w-6 h-6 -ml-3 -mt-3 bg-red-600 text-white rounded-full flex items-center justify-center text-[10px] font-black shadow-lg border-2 border-white"
                style={{ left: `${a.x}%`, top: `${a.y}%` }}
              >
                {i + 1}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 gap-2">
            {photos.annotations.map((a, i) => (
              <div key={a.id} className="flex gap-4 p-4 bg-slate-50 rounded-xl border border-white">
                <span className="w-6 h-6 bg-red-100 text-red-600 rounded flex items-center justify-center text-[10px] font-black shrink-0">{i+1}</span>
                <p className="text-[10px] font-bold text-slate-600 italic leading-relaxed">{a.text || "Diagnostic point highlighted."}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Garment Design Section */}
      <div className="mb-12 break-before-page">
        <div className="flex items-center gap-3 mb-6">
          <ShoppingBag className="w-5 h-5 text-slate-900" />
          <h2 className="text-sm font-black uppercase tracking-widest">Manufacturing Specifications</h2>
        </div>
        <div className="grid grid-cols-2 gap-8">
          <div className="space-y-4">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Product Core</h3>
            <div className="p-6 bg-slate-900 rounded-3xl text-white">
              <p className="text-xs font-black text-slate-500 uppercase mb-2">Selected Garment</p>
              <p className="text-lg font-black tracking-tighter mb-4">{garment.type}</p>
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
                <div>
                  <p className="text-[9px] font-bold text-slate-500 uppercase">Class</p>
                  <p className="text-xs font-black">{garment.options.compressionClass}</p>
                </div>
                <div>
                  <p className="text-[9px] font-bold text-slate-500 uppercase">Fabric</p>
                  <p className="text-xs font-black">{garment.options.fabricType}</p>
                </div>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Material & Finish</h3>
            <div className="space-y-3">
              {[
                { label: 'Color Standard', value: garment.options.color },
                { label: 'Toe Configuration', value: garment.options.toeOption },
                { label: 'Zipper Support', value: garment.options.zipper ? 'Integrated' : 'Disabled' },
                { label: 'Silicone Gripper', value: garment.options.siliconeBand ? 'Integrated' : 'Disabled' }
              ].map(item => (
                <div key={item.label} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">{item.label}</span>
                  <span className="text-[10px] font-black text-slate-700">{item.value.toString().toUpperCase()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* AI Insights Section */}
      {insights && insights.length > 0 && (
        <div className="p-8 bg-blue-50/50 rounded-3xl border border-blue-100">
          <h2 className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-6">AI Assessment Insights</h2>
          <div className="grid grid-cols-2 gap-4">
            {insights.map((insight, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="w-2 h-2 rounded-full bg-blue-400 mt-1.5" />
                <p className="text-[10px] font-bold text-slate-700 leading-relaxed uppercase">{insight}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="mt-20 pt-8 border-t border-slate-100 flex justify-between items-end">
        <div className="text-[8px] font-bold text-slate-300 uppercase tracking-[0.3em]">
          End of Clinical Document<br />
          Ref: CMS-AI-2024-{Math.random().toString(36).substr(2, 6).toUpperCase()}
        </div>
        <div className="w-32 h-1 bg-slate-100 rounded-full" />
      </div>
    </div>
  );
};

export default ClinicalReport;
