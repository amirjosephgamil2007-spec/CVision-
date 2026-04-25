import React, { useState, useEffect } from 'react';
import { JobProfileManager } from './components/JobProfileManager';
import { UploadZone } from './components/UploadZone';
import { ResultsList } from './components/ResultsList';
import { ThemeToggle } from './components/ThemeToggle';
import { CVResult, JobProfile } from './types';
import { FileSearch, LayoutDashboard, Briefcase, ClipboardList } from 'lucide-react';

export default function App() {
  const [activeProfileId, setActiveProfileId] = useState<string | null>(null);
  const [results, setResults] = useState<CVResult[]>([]);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'profiles' | 'results'>('dashboard');
  const [viewingProfileId, setViewingProfileId] = useState<string | null>(null);
  
  // Track active profile Object based on ID
  const [activeProfile, setActiveProfile] = useState<JobProfile | null>(null);

  useEffect(() => {
    if (activeTab !== 'profiles') {
      setViewingProfileId(null);
    }
  }, [activeTab]);

  // We need to fetch the active profile whenever activeProfileId changes
  useEffect(() => {
    if (activeProfileId) {
      const saved = localStorage.getItem('jobProfiles');
      const profiles: JobProfile[] = saved ? JSON.parse(saved) : [];
      const profile = profiles.find(p => p.id === activeProfileId);
      setActiveProfile(profile || null);
    } else {
      setActiveProfile(null);
    }
  }, [activeProfileId]);

  const handleResultsGenerated = (newResults: CVResult[]) => {
    // If the incoming results are 'analyzing', they are placeholders. Let's add them or update them.
    setResults(prev => {
      // Create a map to try to update existing placeholders
      const prevMap = new Map(prev.map(r => [r.id, r]));
      
      newResults.forEach(nr => {
        if (prevMap.has(nr.id)) {
          // Update
          prevMap.set(nr.id, nr);
        } else {
          // Add new
          prevMap.set(nr.id, nr);
        }
      });
      
      return Array.from(prevMap.values());
    });

    // Auto-switch to results tab if new analysis is starting
    if (newResults.length > 0 && newResults[0].status === 'analyzing') {
      setActiveTab('results');
    }
  };

  const removeResult = (id: string) => {
    setResults(prev => prev.filter(r => r.id !== id));
  };

  const clearAllResults = () => {
    setResults([]);
  };

  const completedResults = results.filter(r => r.status === 'done');
  const avgScore = completedResults.length > 0 
    ? (completedResults.reduce((acc, curr) => acc + curr.score, 0) / completedResults.length).toFixed(1)
    : '-';

  return (
    <div className="min-h-screen bg-[#f5f7fa] dark:bg-slate-900 transition-colors duration-300 font-sans text-[#1e293b] dark:text-slate-100 flex flex-col">
      <header className="h-16 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-10 px-8 flex items-center justify-between">
        <div className="flex items-center justify-between w-full max-w-7xl mx-auto">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white font-bold">
              C
            </div>
            <h1 className="text-xl font-bold tracking-tight text-[#1e293b] dark:text-white">CVision</h1>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="max-w-7xl mx-auto w-full px-8 py-8 space-y-6 flex-1 flex flex-col">
        {/* Navigation Tabs */}
        <nav className="flex space-x-6 border-b border-slate-200 dark:border-slate-700 overflow-x-auto">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-2 py-3 px-2 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${activeTab === 'dashboard' ? 'border-[#2563eb] text-[#2563eb] dark:text-blue-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
          >
            <LayoutDashboard size={16} /> Dashboard
          </button>
          <button 
            onClick={() => setActiveTab('profiles')}
            className={`flex items-center gap-2 py-3 px-2 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${activeTab === 'profiles' ? 'border-[#2563eb] text-[#2563eb] dark:text-blue-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
          >
            <Briefcase size={16} /> Job Profiles
          </button>
          <button 
            onClick={() => setActiveTab('results')}
            className={`flex items-center gap-2 py-3 px-2 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${activeTab === 'results' ? 'border-[#2563eb] text-[#2563eb] dark:text-blue-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
          >
            <ClipboardList size={16} /> Results 
            {results.length > 0 && <span className={`ml-1.5 py-0.5 px-2 rounded-full text-[10px] ${activeTab === 'results' ? 'bg-blue-100 dark:bg-blue-900/50 text-[#2563eb] dark:text-blue-400' : 'bg-slate-100 dark:bg-slate-800'}`}>{results.length}</span>}
          </button>
        </nav>

        {/* Tab Content */}
        <div className="flex-1 flex flex-col pb-8">
          {activeTab === 'dashboard' && (
             <div className="space-y-6 flex-1 flex flex-col">
               {/* Dashboard Stats */}
               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <div className="bg-white dark:bg-slate-800 p-6 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-center">
                   <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-1">Active Profile</p>
                   <h3 className="text-lg font-bold text-[#1e293b] dark:text-white truncate">{activeProfile ? activeProfile.title : 'None Selected'}</h3>
                   {activeProfile ? (
                     <button onClick={() => setActiveTab('profiles')} className="text-xs text-[#2563eb] dark:text-blue-400 hover:underline mt-2 text-left w-fit transition-all">Change Profile →</button>
                   ) : (
                     <button onClick={() => setActiveTab('profiles')} className="text-xs text-red-500 hover:underline mt-2 text-left w-fit transition-all">Select a profile to start →</button>
                   )}
                 </div>
                 <div className="bg-white dark:bg-slate-800 p-6 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-center">
                   <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-1">Total Screened</p>
                   <h3 className="text-3xl font-black text-[#2563eb] dark:text-blue-400">{completedResults.length}</h3>
                 </div>
                 <div className="bg-white dark:bg-slate-800 p-6 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-center">
                   <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-1">Average Score</p>
                   <h3 className="text-3xl font-black text-[#1e293b] dark:text-white">{avgScore}</h3>
                 </div>
               </div>

               {/* Upload Zone */}
               <div className="flex-1 min-h-[400px]">
                 <UploadZone 
                    activeProfile={activeProfile} 
                    onResultsGenerated={handleResultsGenerated} 
                 />
               </div>
             </div>
          )}

          {activeTab === 'profiles' && (
             <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
               {viewingProfileId ? (
                 <div className="space-y-6">
                   <button 
                     onClick={() => setViewingProfileId(null)}
                     className="text-sm font-semibold text-slate-500 hover:text-[#2563eb] flex items-center gap-2 transition-colors"
                   >
                     ← Back to Profiles
                   </button>
                   
                   <div className="bg-white dark:bg-slate-800 p-6 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
                     <div className="flex items-start justify-between">
                       <div>
                         <h2 className="text-xl font-bold text-[#1e293b] dark:text-white mb-2">{activeProfile?.title}</h2>
                         {activeProfile?.experienceLevel && (
                           <span className="text-xs font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400 px-2 py-1 rounded-md mb-3 inline-block">
                             Required Experience: {activeProfile.experienceLevel}
                           </span>
                         )}
                         <p className="text-sm text-slate-600 dark:text-slate-300 mt-2">{activeProfile?.description}</p>
                       </div>
                     </div>
                   </div>

                   <div className="h-[400px]">
                     <UploadZone 
                        activeProfile={activeProfile} 
                        onResultsGenerated={handleResultsGenerated} 
                     />
                   </div>
                 </div>
               ) : (
                 <div className="max-w-6xl mx-auto w-full">
                   <JobProfileManager 
                      activeProfileId={activeProfileId} 
                      onSelectProfile={setActiveProfileId} 
                      onOpenProfile={(id) => {
                        setActiveProfileId(id);
                        setViewingProfileId(id);
                      }}
                   />
                 </div>
               )}
             </div>
          )}

          {activeTab === 'results' && (
             <div className="flex-1 flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div className="mb-4 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                  <div>
                    <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-1 block">Analysis</span>
                    <h2 className="text-lg font-bold">
                      {activeProfile ? `Screening Results for ${activeProfile.title}` : "Screening Results"}
                    </h2>
                  </div>
                </div>
                
                <ResultsList 
                  results={results} 
                  onRemoveResult={removeResult} 
                  onClearAll={clearAllResults} 
                />
             </div>
          )}
        </div>
      </main>
    </div>
  );
}
