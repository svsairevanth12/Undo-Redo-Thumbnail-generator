import React, { useState } from 'react';
import { Icons } from './Icon';
import { GalleryItem, AspectRatio } from '../types';

interface ImageDisplayProps {
  gallery: GalleryItem[];
  onDownload: (imageUrl: string) => void;
  onRemove: (id: string) => void;
  onClearAll: () => void;
}

// Sub-component for individual cards
const ImageCard: React.FC<{ item: GalleryItem; onClick: () => void; onDownload: (url: string) => void; onRemove: (id: string) => void }> = ({ item, onClick, onDownload, onRemove }) => {
    // Determine aspect ratio class
    const arClass = item.settings.aspectRatio === AspectRatio.PORTRAIT ? 'aspect-[9/16]' : 'aspect-video';

    return (
        <div 
            className={`group relative overflow-hidden bg-[#121212]/50 border border-white/10 hover:border-[#FFEA00]/50 transition-all duration-300 ${arClass} backdrop-blur-sm`}
        >
            {/* Tech Corners */}
            <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-white/20 group-hover:border-[#FFEA00] transition-colors z-20"></div>
            <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-white/20 group-hover:border-[#FFEA00] transition-colors z-20"></div>

            {/* Status: Generating / Queued */}
            {(item.status === 'generating' || item.status === 'queued') && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#050505] z-10 overflow-hidden">
                    
                    {/* HOLOGRAPHIC SCAN ANIMATION */}
                    <div className="absolute inset-0 bg-grid-pattern opacity-20"></div>
                    {item.status === 'generating' && (
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#FFEA00]/10 to-transparent h-[50%] animate-scan border-b border-[#FFEA00]/30 z-0"></div>
                    )}

                    <div className="z-10 flex flex-col items-center">
                        <div className="text-[#FFEA00] mb-2 font-mono text-xs tracking-widest animate-pulse">
                            {item.status === 'queued' ? '> AWAITING_CORE' : '> NEURAL_RENDERING'}
                        </div>
                        
                        {/* Data Numbers Visualization */}
                        <div className="font-mono text-[10px] text-[#444] flex flex-col items-center gap-1">
                             <span>buffer: {Math.round(item.progress)}%</span>
                             <div className="flex gap-0.5">
                                 {[...Array(10)].map((_, i) => (
                                     <div key={i} className={`w-1 h-3 ${i < (item.progress / 10) ? 'bg-[#FFEA00]' : 'bg-[#222]'}`}></div>
                                 ))}
                             </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Status: Error */}
            {item.status === 'error' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-4 bg-[#050505] z-10 text-center border border-[#EE4035]/30">
                    <div className="w-full h-full absolute inset-0 bg-[#EE4035]/5 animate-pulse"></div>
                    <Icons.Alert className="w-8 h-8 text-[#EE4035] mb-2 relative z-10" />
                    <span className="text-xs font-mono text-[#EE4035] uppercase tracking-wider px-2 relative z-10">SYSTEM FAILURE</span>
                    <span className="text-[9px] text-[#666] mt-1 line-clamp-2 relative z-10 max-w-[80%] font-mono">{item.error || 'Unknown Error'}</span>
                    <button onClick={() => onRemove(item.id)} className="mt-4 p-2 border border-[#EE4035] text-[#EE4035] hover:bg-[#EE4035] hover:text-white transition-colors relative z-10">
                        <Icons.Trash className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Status: Success (Image) */}
            {item.status === 'success' && item.imageUrl && (
                <>
                    <img 
                        src={item.imageUrl} 
                        alt="Generated" 
                        className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform duration-700"
                        onClick={onClick}
                    />
                    
                    {/* Overlay Actions */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-0 pointer-events-none">
                         <div className="flex justify-between items-end pointer-events-auto border-t border-white/10 bg-black/60 backdrop-blur-md p-2">
                            <div className="flex flex-col">
                                <span className="text-[9px] font-mono text-[#FFEA00]">
                                    {item.settings.imageResolution}
                                </span>
                                <span className="text-[9px] font-mono text-white/70">
                                    {item.settings.modelId.includes('2.5') ? 'FAST' : 'PRO'}
                                </span>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={(e) => { e.stopPropagation(); onDownload(item.imageUrl!); }} className="p-1.5 text-white hover:text-[#FFEA00] transition-colors">
                                    <Icons.Download className="w-4 h-4" />
                                </button>
                                <button onClick={(e) => { e.stopPropagation(); onRemove(item.id); }} className="p-1.5 text-white hover:text-[#EE4035] transition-colors">
                                    <Icons.Trash className="w-4 h-4" />
                                </button>
                            </div>
                         </div>
                    </div>
                </>
            )}
        </div>
    );
};

const ImageDisplay: React.FC<ImageDisplayProps> = ({ gallery, onDownload, onRemove, onClearAll }) => {
  const [lightboxItem, setLightboxItem] = useState<GalleryItem | null>(null);

  return (
    <div className="flex-1 h-full bg-transparent overflow-hidden relative flex flex-col font-brand z-10">
      
      {/* Header / Stats */}
      <div className="h-[90px] bg-transparent flex items-center justify-between px-8 shrink-0 z-20 pt-4">
         <div className="flex flex-col gap-1">
            <h2 className="text-xl font-black text-white uppercase tracking-tighter flex items-center gap-2 drop-shadow-md">
                <Icons.Grid className="w-5 h-5 text-[#FFEA00]" />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-[#888]">OUTPUT_GALLERY</span>
            </h2>
            <div className="flex gap-4 text-[9px] font-mono text-[#666] tracking-widest uppercase">
                <span className="flex items-center gap-2">
                    <span className={`w-1.5 h-1.5 rounded-sm ${gallery.some(i => i.status === 'generating') ? 'bg-[#FFEA00] animate-pulse shadow-[0_0_8px_#FFEA00]' : 'bg-[#333]'}`}></span>
                    PROCESSING: {gallery.filter(i => i.status === 'generating' || i.status === 'queued').length}
                </span>
                <span className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-[#444] rounded-sm"></span>
                    ARCHIVED: {gallery.filter(i => i.status === 'success').length}
                </span>
            </div>
         </div>

         {/* Actions */}
         <div className="flex items-center">
            {gallery.length > 0 && (
                <button 
                    onClick={onClearAll}
                    className="flex items-center gap-2 px-4 py-2 text-[10px] font-mono text-[#EE4035] border border-[#EE4035]/30 hover:bg-[#EE4035] hover:text-white transition-colors bg-[#EE4035]/5 backdrop-blur-md"
                >
                    <Icons.Trash className="w-3 h-3" />
                    PURGE_DATABASE
                </button>
            )}
         </div>
      </div>

      {/* Main Grid Area */}
      <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
        
        {gallery.length === 0 ? (
           <div className="h-full flex flex-col items-center justify-center text-white/20 space-y-6">
              <div className="w-32 h-32 border border-white/5 flex items-center justify-center bg-white/5 backdrop-blur-sm rounded-full animate-pulse-glow">
                 <Icons.Image className="w-12 h-12 opacity-50" />
              </div>
              <div className="text-center">
                  <h3 className="text-2xl font-black text-white/30 tracking-widest uppercase">SYSTEM_IDLE</h3>
                  <p className="text-xs font-mono text-white/20 mt-2 bg-black/40 px-3 py-1 rounded-full border border-white/5 inline-block">AWAITING INPUT PARAMETERS</p>
              </div>
           </div>
        ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-6 pb-20">
                {gallery.map((item) => (
                    <ImageCard 
                        key={item.id} 
                        item={item} 
                        onClick={() => item.status === 'success' && setLightboxItem(item)}
                        onDownload={onDownload}
                        onRemove={onRemove}
                    />
                ))}
            </div>
        )}
      </div>

      {/* Futuristic Lightbox Modal */}
      {lightboxItem && lightboxItem.imageUrl && (
          <div className="fixed inset-0 z-[100] bg-[#050505]/95 backdrop-blur-lg flex items-center justify-center p-8 animate-in fade-in duration-300">
              
              {/* Close Button */}
              <button 
                  onClick={() => setLightboxItem(null)}
                  className="absolute top-6 right-6 group flex items-center gap-2 text-[#666] hover:text-white transition-colors"
              >
                  <span className="text-[10px] font-mono opacity-0 group-hover:opacity-100 transition-opacity">CLOSE_VIEW</span>
                  <div className="p-2 border border-white/20 group-hover:border-[#FFEA00] transition-colors">
                     <Icons.Close className="w-6 h-6" />
                  </div>
              </button>

              <div className="relative max-w-[95vw] max-h-[90vh] flex flex-col items-center justify-center">
                  
                  {/* Main Image with Tech Border */}
                  <div className="relative p-1 border border-white/10 bg-[#121212] shadow-[0_0_100px_rgba(0,0,0,1)]">
                      <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-[#FFEA00] -translate-x-1 -translate-y-1"></div>
                      <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-[#FFEA00] translate-x-1 -translate-y-1"></div>
                      <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-[#FFEA00] -translate-x-1 translate-y-1"></div>
                      <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-[#FFEA00] translate-x-1 translate-y-1"></div>
                      
                      <img 
                          src={lightboxItem.imageUrl} 
                          alt="Full View" 
                          className="max-w-full max-h-[75vh] object-contain"
                      />
                  </div>
                  
                  {/* Lightbox Controls HUD */}
                  <div className="mt-8 flex items-stretch gap-0 border border-white/10 bg-black/80 backdrop-blur-md">
                      <button 
                         onClick={() => onDownload(lightboxItem.imageUrl!)}
                         className="flex items-center gap-2 px-8 py-4 bg-[#FFEA00] hover:bg-white text-black font-black text-sm tracking-widest transition-colors hover:shadow-[0_0_20px_rgba(255,255,255,0.5)]"
                      >
                          <Icons.Download className="w-4 h-4" /> DOWNLOAD
                      </button>
                      <div className="px-6 py-4 flex flex-col justify-center border-l border-white/10">
                          <span className="text-[9px] font-mono text-[#666] uppercase">Job ID</span>
                          <span className="text-xs font-mono text-white">{lightboxItem.id}</span>
                      </div>
                      <div className="px-6 py-4 flex flex-col justify-center border-l border-white/10 max-w-lg">
                           <span className="text-[9px] font-mono text-[#666] uppercase">Prompt Data</span>
                           <span className="text-xs font-mono text-white truncate">{lightboxItem.settings.mainPrompt}</span>
                      </div>
                  </div>
              </div>
          </div>
      )}

    </div>
  );
};

export default ImageDisplay;