import React, { useState, useEffect, useRef } from 'react';
import InputControls from './components/InputControls';
import ImageDisplay from './components/ImageDisplay';
import { GeneratorState, AspectRatio, GalleryItem } from './types';
import { STYLE_PRESETS, AVAILABLE_MODELS } from './constants';
import { generateSingleImage } from './services/geminiService';
import { getGalleryItems, saveGalleryItem, deleteGalleryItem, clearGalleryDB } from './services/storageService';

const App: React.FC = () => {
  // --- State ---
  const [state, setState] = useState<GeneratorState>({
    modelId: AVAILABLE_MODELS[0].id,
    mainPrompt: '',
    backgroundPrompt: '',
    headlineText: '',
    aspectRatio: AspectRatio.LANDSCAPE,
    stylePreset: STYLE_PRESETS[0],
    actors: [],
    references: [],
    imageResolution: '1K',
    generationCount: 1
  });

  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [activeJobs, setActiveJobs] = useState(0);
  const [hasApiKey, setHasApiKey] = useState(true);

  // Interval Ref for updating progress bars
  const progressInterval = useRef<number | null>(null);

  // --- Effects ---

  // 1. Check API Key - For Vercel deployment, we assume API key is configured via environment variables
  useEffect(() => {
      const checkKey = async () => {
          // Check if running in Google AI Studio environment
          const win = window as any;
          if (win.aistudio && win.aistudio.hasSelectedApiKey) {
              const selected = await win.aistudio.hasSelectedApiKey();
              setHasApiKey(selected);
          } else {
              // For standalone deployment (Vercel), API key is set via environment variables
              // We assume it's configured - errors will be caught during generation
              setHasApiKey(true);
          }
      };
      checkKey();
  }, []);

  // 2. Load History from DB on Mount
  useEffect(() => {
    const loadHistory = async () => {
      const items = await getGalleryItems();
      
      // Clean up interrupted jobs: if status was 'generating' or 'queued' during a reload/crash, set to error
      const cleanedItems = items.map(item => {
        if (item.status === 'generating' || item.status === 'queued') {
          return {
            ...item,
            status: 'error' as const,
            error: 'Session Interrupted',
            progress: 0
          };
        }
        return item;
      });

      // Save any corrected items back to DB
      cleanedItems.forEach(item => {
        if (item.status === 'error' && item.error === 'Session Interrupted') {
          saveGalleryItem(item);
        }
      });

      setGallery(cleanedItems);
    };
    loadHistory();
  }, []);

  const handleSelectKey = async () => {
      const win = window as any;
      if (win.aistudio) {
          await win.aistudio.openSelectKey();
          const selected = await win.aistudio.hasSelectedApiKey();
          setHasApiKey(selected);
      }
  };

  // 3. Progress Bar Simulation
  useEffect(() => {
      // Run an interval that updates progress of any 'generating' items (Visual only, not saved to DB)
      progressInterval.current = window.setInterval(() => {
          setGallery(prev => prev.map(item => {
              if (item.status === 'generating' && item.progress < 90) {
                  // Increment randomly between 0.5 and 2 to simulate work
                  return { ...item, progress: item.progress + (Math.random() * 2) };
              }
              return item;
          }));
      }, 200);

      return () => {
          if (progressInterval.current) clearInterval(progressInterval.current);
      };
  }, []);

  // --- Logic ---

  const handleGenerate = async () => {
    // 1. Create Placeholder Items
    const count = Math.max(1, Math.min(4, state.generationCount));
    const newItems: GalleryItem[] = Array.from({ length: count }).map(() => ({
        id: Math.random().toString(36).substr(2, 9),
        status: 'queued',
        timestamp: Date.now(),
        settings: { ...state }, // Snapshot current settings
        progress: 0
    }));

    // Prepend to gallery (Newest first)
    setGallery(prev => [...newItems, ...prev]);
    setActiveJobs(prev => prev + count);

    // Persist Queued items to DB immediately
    await Promise.all(newItems.map(item => saveGalleryItem(item)));

    // 2. Process each item independently
    newItems.forEach(async (item) => {
        // Update UI to generating
        setGallery(prev => prev.map(g => g.id === item.id ? { ...g, status: 'generating' } : g));
        
        // Update DB to generating
        const generatingItem = { ...item, status: 'generating' as const };
        await saveGalleryItem(generatingItem);

        try {
            const imageUrl = await generateSingleImage(item.settings);
            
            // Success Update
            const successItem: GalleryItem = { 
                ...generatingItem, 
                status: 'success', 
                imageUrl: imageUrl, 
                progress: 100 
            };
            
            // Save & Update UI
            await saveGalleryItem(successItem);
            setGallery(prev => prev.map(g => g.id === item.id ? successItem : g));

        } catch (err: any) {
            console.error(`Generation failed for item ${item.id}`, err);
            
            // Error Update
            const errorItem: GalleryItem = { 
                ...generatingItem, 
                status: 'error', 
                error: err.message || 'Generation Failed', 
                progress: 100 
            };

            await saveGalleryItem(errorItem);
            setGallery(prev => prev.map(g => g.id === item.id ? errorItem : g));

            if (err.message && err.message.includes("Requested entity was not found")) {
                setHasApiKey(false); // Only trigger this global warning once ideally
            }
        } finally {
            setActiveJobs(prev => Math.max(0, prev - 1));
        }
    });
  };

  const handleDownload = (imageUrl: string) => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `UnReDO-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleRemove = async (id: string) => {
      await deleteGalleryItem(id);
      setGallery(prev => prev.filter(item => item.id !== id));
  };

  const handleClearAll = async () => {
    if (confirm("WARNING: This will permanently delete your entire history from the database. Proceed?")) {
      await clearGalleryDB();
      setGallery([]);
    }
  };

  // --- Render ---
  
  if (!hasApiKey) {
      return (
          <div className="flex h-screen w-screen bg-[#020202] items-center justify-center text-slate-200 font-brand p-4 relative overflow-hidden">
               {/* Background Glows */}
               <div className="absolute top-[-20%] left-[-10%] w-[50vw] h-[50vw] bg-yellow-500/10 rounded-full blur-[100px]"></div>
               <div className="absolute bottom-[-20%] right-[-10%] w-[60vw] h-[60vw] bg-red-900/20 rounded-full blur-[120px]"></div>
               <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>

              <div className="text-center space-y-8 p-12 bg-black/60 border border-white/10 max-w-lg shadow-[0_0_60px_rgba(0,0,0,0.8)] relative overflow-hidden backdrop-blur-xl z-10">
                <div className="absolute top-0 left-0 w-full h-1 bg-[#FFEA00]"></div>
                
                {/* Logo Stack (Yellow/Red) */}
                <div className="flex items-end justify-center select-none opacity-90 mb-6">
                     <img 
                        src="https://iamishir.com/wp-content/uploads/2025/11/undo-redo-ai.png" 
                        alt="UnReDO." 
                        className="h-[30px] w-auto object-contain drop-shadow-[0_0_10px_rgba(255,234,0,0.5)]"
                        onError={(e) => {
                           e.currentTarget.src = 'https://placehold.co/180x50/050505/FFEA00/png?text=UnReDO.&font=montserrat';
                        }}
                     />
                 </div>

                <div>
                    <h2 className="text-3xl font-black text-white mb-2 uppercase tracking-wide">Access Restricted</h2>
                    <p className="text-[#888] text-sm font-mono">
                        Valid Billing Project Required for Core Logic
                    </p>
                </div>
                
                <div className="bg-black/40 p-4 border border-white/5 text-left">
                    <p className="text-[#666] text-xs font-mono mb-2">ERROR_CODE: KEY_MISSING</p>
                    <p className="text-[#888] text-xs font-mono leading-relaxed">
                        To utilize Gemini 3 Pro / Nano Banana Pro, initialize a paid API session.
                    </p>
                     <p className="text-xs text-[#EE4035] mt-2 font-bold hover:underline cursor-pointer">
                        <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noreferrer">
                            &gt; READ_DOCS
                        </a>
                    </p>
                </div>

                <button 
                    onClick={handleSelectKey}
                    className="w-full py-4 bg-[#FFEA00] hover:bg-white text-black text-sm font-black uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(255,234,0,0.4)] hover:shadow-[0_0_40px_rgba(255,255,255,0.6)]"
                >
                    Initialize Key Selection
                </button>
              </div>
          </div>
      );
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden font-brand relative">
      <InputControls 
        state={state} 
        setState={setState} 
        isGenerating={false} 
        onGenerate={handleGenerate}
        activeJobs={activeJobs}
      />
      <ImageDisplay 
        gallery={gallery}
        onDownload={handleDownload}
        onRemove={handleRemove}
        onClearAll={handleClearAll}
      />
    </div>
  );
};

export default App;