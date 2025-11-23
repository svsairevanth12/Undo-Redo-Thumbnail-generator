
import React, { useState } from 'react';
import { UploadedImage, Actor, GeneratorState, AspectRatio } from '../types';
import { Icons } from './Icon';
import { STYLE_PRESETS, AVAILABLE_MODELS } from '../constants';

interface InputControlsProps {
  state: GeneratorState;
  setState: React.Dispatch<React.SetStateAction<GeneratorState>>;
  isGenerating: boolean;
  onGenerate: () => void;
  activeJobs: number;
}

const InputControls: React.FC<InputControlsProps> = ({ state, setState, isGenerating, onGenerate, activeJobs }) => {
  const [infiniteMode, setInfiniteMode] = useState(false);

  const handleTextChange = (field: keyof GeneratorState, value: string | number) => {
    setState(prev => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'actor' | 'reference') => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        const base64Data = result.split(',')[1];
        const mimeType = result.split(';')[0].split(':')[1];

        const newImage: UploadedImage = {
          id: Math.random().toString(36).substr(2, 9),
          file,
          previewUrl: result,
          base64Data,
          mimeType
        };

        if (type === 'actor') {
          const newActor: Actor = { ...newImage, emotion: '' };
          setState(prev => ({ ...prev, actors: [...prev.actors, newActor] }));
        } else {
          setState(prev => ({ ...prev, references: [...prev.references, newImage] }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = (id: string, type: 'actor' | 'reference') => {
    if (type === 'actor') {
      setState(prev => ({ ...prev, actors: prev.actors.filter(a => a.id !== id) }));
    } else {
      setState(prev => ({ ...prev, references: prev.references.filter(r => r.id !== id) }));
    }
  };

  const isProModel = state.modelId === 'gemini-3-pro-image-preview';

  return (
    <div className="flex flex-col h-full bg-[#050505]/80 backdrop-blur-xl border-r border-white/5 text-slate-300 w-full md:w-[480px] shrink-0 z-30 shadow-[4px_0_30px_rgba(0,0,0,0.8)] overflow-hidden relative">
      
      {/* Decorative Tech Line */}
      <div className="absolute top-0 right-0 w-[1px] h-full bg-gradient-to-b from-transparent via-[#FFEA00]/20 to-transparent pointer-events-none"></div>

      {/* 1. Sticky Header */}
      <div className="shrink-0 bg-[#050505]/95 border-b border-white/5 px-6 py-5 z-50 flex items-center justify-between relative backdrop-blur-md">
         {/* Logo */}
         <div className="flex items-center group cursor-pointer active:scale-95 transition-transform" onClick={() => window.location.reload()}>
           <img 
             src="https://iamishir.com/wp-content/uploads/2025/11/undo-redo-ai.png" 
             alt="UnReDO." 
             className="h-[32px] w-auto object-contain select-none drop-shadow-[0_0_10px_rgba(255,234,0,0.3)]"
             onError={(e) => {
               e.currentTarget.src = 'https://placehold.co/180x50/050505/FFEA00/png?text=UnReDO.&font=montserrat';
             }}
           />
         </div>
         <div className="flex items-center gap-2">
             <div className={`w-2 h-2 rounded-full ${activeJobs > 0 ? 'bg-[#FFEA00] animate-pulse' : 'bg-green-900'}`}></div>
             <span className="text-[9px] font-mono text-[#666]">SYS_ONLINE</span>
         </div>
      </div>

      {/* 2. Scrollable Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8 relative z-0 pb-10">
        
        {/* SECTION: SYSTEM CORE */}
        <div className="space-y-2">
           <label className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#666] block">SYSTEM CORE</label>
           <div className="relative group">
              <select
                  className="w-full bg-[#080808] border border-white/10 rounded-none p-3 text-xs text-white focus:border-[#FFEA00] outline-none appearance-none font-mono tracking-wide transition-all shadow-inner hover:bg-[#121212]"
                  value={state.modelId}
                  onChange={(e) => setState(prev => ({ ...prev, modelId: e.target.value }))}
              >
                  {AVAILABLE_MODELS.map(model => (
                      <option key={model.id} value={model.id}>{model.name}</option>
                  ))}
              </select>
              <div className="absolute right-3 top-3 pointer-events-none text-[#FFEA00]">
                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 9l-7 7-7-7"></path></svg>
              </div>
           </div>
        </div>

        {/* SECTION: ACTION (References) - Moved Up */}
        <div className="space-y-4">
             <div className="flex justify-between items-center">
                <label className="text-[10px] font-black font-mono uppercase tracking-widest text-white">ACTION ({state.references.length + state.actors.length}/5)</label>
             </div>
             
             <div className="grid grid-cols-3 gap-3">
                 {/* Upload Slot 1 (Actor) */}
                 <div className="aspect-square bg-[#121212] border border-dashed border-white/10 hover:border-[#FFEA00] transition-colors relative group">
                     {state.actors[0] ? (
                        <>
                            <img src={state.actors[0].previewUrl} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all" alt="actor" />
                            <button onClick={() => removeImage(state.actors[0].id, 'actor')} className="absolute top-1 right-1 bg-black text-white p-1 hover:text-[#EE4035]"><Icons.Close className="w-3 h-3" /></button>
                        </>
                    ) : (
                        <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer text-[#444] hover:text-[#FFEA00]">
                            <Icons.User className="w-4 h-4 mb-1" />
                            <span className="text-[8px] font-mono text-center leading-tight">UPLOAD<br/>ACTOR</span>
                            <input type="file" className="hidden" onChange={(e) => handleFileUpload(e, 'actor')} />
                        </label>
                    )}
                 </div>

                 {/* Upload Slot 2 (Reference Thumbnail) */}
                 <div className="aspect-square bg-[#121212] border border-dashed border-white/10 hover:border-[#FFEA00] transition-colors relative group">
                    {state.references[0] ? (
                        <>
                            <img src={state.references[0].previewUrl} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all" alt="ref" />
                            <button onClick={() => removeImage(state.references[0].id, 'reference')} className="absolute top-1 right-1 bg-black text-white p-1 hover:text-[#EE4035]"><Icons.Close className="w-3 h-3" /></button>
                        </>
                    ) : (
                        <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer text-[#444] hover:text-[#FFEA00]">
                            <Icons.Image className="w-4 h-4 mb-1" />
                            <span className="text-[8px] font-mono text-center leading-tight">REF<br/>THUMBNAIL</span>
                            <input type="file" className="hidden" onChange={(e) => handleFileUpload(e, 'reference')} />
                        </label>
                    )}
                 </div>

                 {/* Upload Slot 3 (Logo) */}
                 <div className="aspect-square bg-[#121212] border border-dashed border-white/10 hover:border-[#FFEA00] transition-colors relative group">
                     {state.references[1] ? (
                        <>
                            <img src={state.references[1].previewUrl} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all" alt="ref2" />
                            <button onClick={() => removeImage(state.references[1].id, 'reference')} className="absolute top-1 right-1 bg-black text-white p-1 hover:text-[#EE4035]"><Icons.Close className="w-3 h-3" /></button>
                        </>
                    ) : (
                        <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer text-[#444] hover:text-[#FFEA00]">
                            <Icons.Star className="w-4 h-4 mb-1" />
                            <span className="text-[8px] font-mono text-center leading-tight">LOGO</span>
                            <input type="file" className="hidden" onChange={(e) => handleFileUpload(e, 'reference')} />
                        </label>
                    )}
                 </div>
             </div>
        </div>

        {/* SECTION: JOB_PARAMETERS */}
        <div className="space-y-4">
            <div className="flex items-center gap-2 text-[#FFEA00]">
                <Icons.Wand2 className="w-4 h-4" />
                <label className="text-sm font-black font-mono uppercase tracking-widest text-white">JOB_PARAMETERS</label>
            </div>
            
            <div className="border-t border-white/10"></div>

            {/* SCENE DESCRIPTION */}
            <div className="space-y-2 pl-2 border-l-2 border-white/5 hover:border-[#FFEA00]/50 transition-colors">
                <label className="text-[9px] text-[#666] font-mono uppercase tracking-widest">SCENE_DESCRIPTION</label>
                <textarea
                    className="w-full bg-transparent p-0 text-sm text-white placeholder-[#333] outline-none min-h-[80px] resize-none font-mono custom-scrollbar"
                    placeholder="> INPUT SCENE DATA..."
                    value={state.mainPrompt}
                    onChange={(e) => handleTextChange('mainPrompt', e.target.value)}
                />
            </div>

            {/* ENVIRONMENT CONFIG */}
            <div className="space-y-2 pl-2 border-l-2 border-white/5 hover:border-[#FFEA00]/50 transition-colors">
                <label className="text-[9px] text-[#666] font-mono uppercase tracking-widest">ENVIRONMENT_CONFIG</label>
                <input 
                    type="text" 
                    className="w-full bg-transparent p-0 text-xs text-white placeholder-[#333] outline-none font-mono"
                    placeholder="> INPUT ENV DATA..."
                    value={state.backgroundPrompt}
                    onChange={(e) => handleTextChange('backgroundPrompt', e.target.value)}
                />
            </div>

            {/* OVERLAY TEXT */}
            <div className="space-y-2 pl-2 border-l-2 border-white/5 hover:border-[#FFEA00]/50 transition-colors">
                <label className="text-[9px] text-[#666] font-mono uppercase tracking-widest">OVERLAY_TEXT</label>
                <input 
                    type="text" 
                    className="w-full bg-transparent p-0 text-sm text-[#555] font-black placeholder-[#333] outline-none uppercase font-brand focus:text-[#FFEA00] transition-colors"
                    placeholder="HEADLINE GOES HERE"
                    value={state.headlineText}
                    onChange={(e) => handleTextChange('headlineText', e.target.value)}
                />
            </div>
        </div>

        {/* SECTION: OUTPUT_FORMAT */}
        <div className="space-y-4">
            <div className="flex items-center gap-2 text-[#FFEA00]">
                <Icons.Grid className="w-4 h-4" />
                <label className="text-sm font-black font-mono uppercase tracking-widest text-white">OUTPUT_FORMAT</label>
            </div>
            
            <div className="border-t border-white/10"></div>

            <div className="grid grid-cols-2 gap-4">
                
                {/* Resolution */}
                <div className="space-y-1">
                    <div className="flex justify-between">
                         <label className="text-[9px] text-[#666] font-mono uppercase">RES</label>
                         {isProModel && <span className="text-[8px] bg-[#333] text-[#888] px-1 rounded">PRO</span>}
                    </div>
                    <select
                        className={`w-full bg-[#121212] border border-white/10 p-2 text-xs font-mono outline-none ${!isProModel && 'opacity-50 cursor-not-allowed'}`}
                        value={state.imageResolution}
                        onChange={(e) => handleTextChange('imageResolution', e.target.value)}
                        disabled={!isProModel}
                    >
                        <option value="1K">1024px (1K)</option>
                        <option value="2K">2048px (2K)</option>
                        <option value="4K">4096px (4K)</option>
                    </select>
                </div>

                {/* Batch Size */}
                <div className="space-y-1">
                    <label className="text-[9px] text-[#666] font-mono uppercase">BATCH_SIZE</label>
                    <div className="flex items-center h-[34px] bg-[#121212] border border-white/10">
                        <button 
                            className="w-10 h-full hover:bg-white/5 text-[#666] hover:text-white"
                            onClick={() => handleTextChange('generationCount', Math.max(1, state.generationCount - 1))}
                        >-</button>
                        <div className="flex-1 text-center text-[#FFEA00] font-mono font-bold text-xs">{state.generationCount}</div>
                        <button 
                            className="w-10 h-full hover:bg-white/5 text-[#666] hover:text-white"
                            onClick={() => handleTextChange('generationCount', Math.min(4, state.generationCount + 1))}
                        >+</button>
                    </div>
                </div>

                {/* Aspect Ratio Buttons - Full Width Row */}
                <div className="col-span-2 grid grid-cols-2 gap-4 mt-2">
                    <button
                        onClick={() => handleTextChange('aspectRatio', AspectRatio.LANDSCAPE)}
                        className={`h-[45px] flex items-center justify-center text-xs font-mono transition-all duration-300 relative group overflow-hidden
                            ${state.aspectRatio === AspectRatio.LANDSCAPE 
                                ? 'text-[#FFEA00] font-bold shadow-[inset_0_0_20px_rgba(255,234,0,0.1)]' 
                                : 'text-[#444] border border-white/5 hover:bg-white/5'
                            }
                        `}
                    >
                        {/* Custom Yellow Corners for Active State */}
                        {state.aspectRatio === AspectRatio.LANDSCAPE && (
                            <>
                                <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-[#FFEA00]"></div>
                                <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-[#FFEA00]"></div>
                                <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-[#FFEA00]"></div>
                                <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-[#FFEA00]"></div>
                                <div className="absolute inset-0 border border-[#FFEA00]/30"></div>
                            </>
                        )}
                        16:9
                    </button>

                    <button
                        onClick={() => handleTextChange('aspectRatio', AspectRatio.PORTRAIT)}
                        className={`h-[45px] flex items-center justify-center text-xs font-mono transition-all duration-300 relative group overflow-hidden
                            ${state.aspectRatio === AspectRatio.PORTRAIT 
                                ? 'text-[#FFEA00] font-bold shadow-[inset_0_0_20px_rgba(255,234,0,0.1)]' 
                                : 'text-[#444] border border-white/5 hover:bg-white/5'
                            }
                        `}
                    >
                         {state.aspectRatio === AspectRatio.PORTRAIT && (
                            <>
                                <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-[#FFEA00]"></div>
                                <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-[#FFEA00]"></div>
                                <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-[#FFEA00]"></div>
                                <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-[#FFEA00]"></div>
                                <div className="absolute inset-0 border border-[#FFEA00]/30"></div>
                            </>
                        )}
                        9:16
                    </button>
                </div>
            </div>
        </div>

        {/* SECTION: STYLE MATRIX */}
        <div className="space-y-2">
            <label className="text-[9px] text-[#666] font-mono uppercase tracking-widest">STYLE_MATRIX</label>
            <div className="relative">
                <select
                    className="w-full bg-[#121212] border border-white/10 p-3 text-xs text-white font-mono outline-none appearance-none hover:border-[#FFEA00]/50 transition-colors"
                    value={state.stylePreset}
                    onChange={(e) => handleTextChange('stylePreset', e.target.value)}
                >
                    {STYLE_PRESETS.map((style, i) => (
                        <option key={i} value={style}>{style}</option>
                    ))}
                </select>
                <Icons.Wand2 className="absolute right-3 top-3 w-3 h-3 text-[#FFEA00] pointer-events-none" />
            </div>
        </div>

      </div>

      {/* 3. Sticky Footer Button */}
      <div className="shrink-0 p-4 bg-[#050505]/95 border-t border-white/10 z-50 relative backdrop-blur-md">
        <button
          onClick={onGenerate}
          disabled={!state.mainPrompt}
          className={`w-full h-[50px] flex items-center justify-center gap-2 font-black text-sm uppercase tracking-[0.15em] transition-all transform active:scale-[0.98] border border-transparent
            ${!state.mainPrompt 
              ? 'bg-[#121212] text-[#333] cursor-not-allowed border-white/5' 
              : 'bg-[#121212] text-white border-[#FFEA00]/30 hover:border-[#FFEA00] hover:text-[#FFEA00] hover:shadow-[0_0_20px_rgba(255,234,0,0.2)]'
            }`}
        >
          {activeJobs > 0 ? (
             <>
               <Icons.Refresh className="w-4 h-4 animate-spin text-[#FFEA00]" />
               <span className="font-mono text-[#FFEA00]">PROCESSING...</span>
             </>
          ) : (
            <>
              <Icons.Wand2 className="w-4 h-4" />
              <span>INITIATE_GENERATE</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default InputControls;
