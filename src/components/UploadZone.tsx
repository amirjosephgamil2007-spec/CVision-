import React, { useCallback, useState } from 'react';
import { UploadCloud, File as FileIcon, X, AlertCircle } from 'lucide-react';
import { CVResult, JobProfile } from '../types';
import { analyzeCV } from '../lib/cvAnalyzer';

interface Props {
  activeProfile: JobProfile | null;
  onResultsGenerated: (results: CVResult[]) => void;
}

export function UploadZone({ activeProfile, onResultsGenerated }: Props) {
  const [dragActive, setDragActive] = useState(false);
  const [queue, setQueue] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const validateFiles = (files: File[]) => {
    const validFiles = Array.from(files).filter(file => {
      // Allow pdf, docx, txt
      const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
      const validSize = file.size <= 5 * 1024 * 1024; // 5MB
      return validTypes.includes(file.type) && validSize;
    });

    if (validFiles.length !== files.length) {
      alert("Some files were rejected. Ensure they are PDF, DOCX, or TXT and under 5MB.");
    }

    setQueue(prev => {
      const newQueue = [...prev, ...validFiles];
      if (newQueue.length > 100) {
        // Automatically slice without alert
        return newQueue.slice(0, 100);
      }
      return newQueue;
    });
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateFiles(Array.from(e.dataTransfer.files));
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files.length > 0) {
      validateFiles(Array.from(e.target.files));
    }
  };

  const removeFile = (index: number) => {
    setQueue(prev => prev.filter((_, i) => i !== index));
  };

  const processFiles = async () => {
    if (!activeProfile) {
      return;
    }
    
    setIsProcessing(true);
    
    // Create initial results array to quickly show they are processing
    const results: CVResult[] = queue.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      fileName: file.name,
      candidateName: 'Extacting...',
      score: 0,
      strengths: [],
      weaknesses: [],
      summary: '',
      skillsMatch: 0,
      experience: '',
      status: 'analyzing'
    }));
    
    // Call the parent to show loading state
    onResultsGenerated(results);
    
    // Process one by one (or Promise.all)
    const finalResults = await Promise.all(results.map(async (res) => {
      try {
        const analysis = await analyzeCV(res.file, activeProfile);
        return { ...res, ...analysis } as CVResult;
      } catch (err) {
        return { ...res, status: 'error', errorMessage: 'Failed to analyze' } as CVResult;
      }
    }));
    
    // Update with actual results
    onResultsGenerated(finalResults);
    setQueue([]);
    setIsProcessing(false);
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6 flex flex-col transition-all h-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold tracking-tight">
          Upload CVs
        </h2>
        <span className="text-sm font-medium bg-slate-100 dark:bg-slate-700 px-2.5 py-1 rounded-full text-slate-600 dark:text-slate-300">
          {queue.length} / 100
        </span>
      </div>

      <div 
        className={`relative border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center transition-colors group cursor-pointer ${dragActive ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/10' : 'border-slate-200 hover:border-blue-400 bg-white dark:bg-slate-900/50 dark:border-slate-700'}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input 
          type="file" 
          multiple 
          accept=".pdf,.docx,.txt"
          onChange={handleChange} 
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
          disabled={isProcessing || !activeProfile || queue.length >= 100}
        />
        <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 transition-colors ${dragActive ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-500' : 'bg-slate-50 dark:bg-slate-800 text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-500'}`}>
          <UploadCloud size={24} />
        </div>
        <h3 className="text-sm font-bold">Drop CVs here to start screening</h3>
        <p className="text-xs text-slate-400 mt-1">PDF, DOCX, or TXT. Max 100 files at once.</p>
        
        {!activeProfile && (
          <div className="absolute inset-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl flex items-center justify-center flex-col z-10 border-2 border-transparent">
            <AlertCircle className="text-amber-500 mb-2" size={32} />
            <p className="font-medium">Select a Job Profile to enable uploads</p>
          </div>
        )}
      </div>

      {queue.length > 0 && (
        <div className="mt-6 flex-1 flex flex-col overflow-hidden">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Queue</h3>
            <button 
              onClick={() => setQueue([])}
              className="text-sm text-red-500 hover:text-red-700 dark:hover:text-red-400"
              disabled={isProcessing}
            >
              Clear All
            </button>
          </div>
          <div className="overflow-y-auto pr-2 -mr-2 space-y-2 flex-1 mb-4">
            {queue.map((file, i) => (
              <div key={`${file.name}-${i}`} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-3 overflow-hidden">
                  <FileIcon size={18} className="text-slate-400 shrink-0" />
                  <div className="truncate">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <p className="text-xs text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                </div>
                <button 
                  onClick={() => removeFile(i)} 
                  className="p-1 text-slate-400 hover:text-red-500 rounded transition-colors"
                  disabled={isProcessing}
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
          <button 
            onClick={processFiles}
            disabled={isProcessing}
            className={`w-full py-2.5 rounded text-sm font-bold transition-all flex items-center justify-center gap-2 ${isProcessing ? 'bg-blue-400 text-white cursor-wait' : 'bg-slate-900 hover:bg-black dark:bg-blue-600 dark:hover:bg-blue-700 text-white'}`}
          >
            {isProcessing ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </>
            ) : (
              'Analyze CVs'
            )}
          </button>
        </div>
      )}
    </div>
  );
}
