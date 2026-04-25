import React, { useState } from 'react';
import { CVResult } from '../types';
import { CheckCircle2, XCircle, Search, Trash2, Download, AlertCircle, User, Briefcase, Award, FileIcon } from 'lucide-react';

interface Props {
  results: CVResult[];
  onRemoveResult: (id: string) => void;
  onClearAll: () => void;
}

export function ResultsList({ results, onRemoveResult, onClearAll }: Props) {
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'scoreDesc' | 'scoreAsc'>('scoreDesc');

  const filteredResults = results
    .filter(r => r.candidateName.toLowerCase().includes(search.toLowerCase()) || r.fileName.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (a.status !== 'done' || b.status !== 'done') return 0;
      return sortBy === 'scoreDesc' ? b.score - a.score : a.score - b.score;
    });

  const exportCSV = () => {
    const headers = ['Candidate Name', 'File Name', 'Score', 'Skills Match %', 'Experience', 'Summary'];
    const rows = results.filter(r => r.status === 'done').map(r => [
      `"${r.candidateName}"`,
      `"${r.fileName}"`,
      r.score,
      r.skillsMatch,
      `"${r.experience}"`,
      `"${r.summary.replace(/"/g, '""')}"`
    ]);
    
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'cv_analysis_results.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-600 bg-green-100 dark:bg-green-900/30';
    if (score >= 6) return 'text-amber-600 bg-amber-100 dark:bg-amber-900/30';
    return 'text-red-600 bg-red-100 dark:bg-red-900/30';
  };

  const getProgressBarColor = (score: number) => {
    if (score >= 8) return 'bg-green-500';
    if (score >= 6) return 'bg-amber-500';
    return 'bg-red-500';
  };

  if (results.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-12 text-center flex flex-col items-center justify-center">
        <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mb-4 text-slate-400">
          <Search size={32} />
        </div>
        <h3 className="text-xl font-medium mb-2">No Results Yet</h3>
        <p className="text-slate-500 dark:text-slate-400 max-w-sm">
          Select a job profile and upload CVs to begin the AI-powered screening process.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-transparent mb-4">
        <div className="relative w-full sm:w-auto flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input 
            type="text" 
            placeholder="Search candidates or files..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md focus:border-blue-500 outline-none transition-all shadow-sm"
          />
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select 
            value={sortBy}
            onChange={e => setSortBy(e.target.value as 'scoreDesc' | 'scoreAsc')}
            className="px-2 py-1.5 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md outline-none shadow-sm cursor-pointer"
          >
            <option value="scoreDesc">Highest First</option>
            <option value="scoreAsc">Lowest First</option>
          </select>
          <button 
            onClick={exportCSV}
            className="text-xs font-semibold px-4 py-2 border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
          >
            Export (CSV)
          </button>
          <button 
            onClick={onClearAll}
            className="text-xs font-semibold px-4 py-2 bg-slate-900 text-white rounded hover:bg-black dark:bg-blue-600 dark:hover:bg-blue-700 transition-colors shadow-sm"
          >
            Clear All
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredResults.map(result => (
          <div key={result.id} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4 shadow-sm flex flex-col relative animate-in fade-in slide-in-from-bottom-4 group hover:shadow-md transition-shadow">
            {result.status === 'analyzing' ? (
              <div className="p-8 flex flex-col items-center justify-center h-full text-center min-h-[300px]">
                <svg className="animate-spin h-10 w-10 text-blue-500 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <h4 className="font-medium text-lg mb-1">Analyzing CV</h4>
                <p className="text-slate-500">{result.fileName}</p>
                <div className="w-full max-w-xs bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 mt-6 overflow-hidden">
                  <div className="bg-blue-500 h-1.5 rounded-full animate-pulse w-full"></div>
                </div>
              </div>
            ) : result.status === 'error' ? (
              <div className="p-8 flex flex-col items-center justify-center h-full text-center text-red-500 min-h-[300px]">
                <AlertCircle size={40} className="mb-4" />
                <h4 className="font-medium text-lg mb-1">Analysis Failed</h4>
                <p className="text-sm opacity-80">{result.errorMessage || 'An error occurred while processing this CV'}</p>
                <button 
                  onClick={() => onRemoveResult(result.id)}
                  className="mt-4 px-4 py-2 border border-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-sm transition-colors"
                >
                  Dismiss
                </button>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h5 className="text-sm font-bold text-[#1e293b] dark:text-white">{result.candidateName}</h5>
                    <p className="text-[10px] text-slate-500 uppercase font-semibold tracking-wide flex items-center gap-1.5 mt-0.5">
                      <FileIcon size={10} /> {result.fileName} • {result.experience}
                    </p>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-xl font-black text-[#2563eb] dark:text-blue-400">{result.score}</span>
                    <span className="text-[9px] uppercase font-bold text-slate-400">Score</span>
                  </div>
                </div>

                <div className="w-full bg-slate-100 dark:bg-slate-700 h-1.5 rounded-full mb-4">
                  <div className={`h-full rounded-full ${getProgressBarColor(result.score)}`} style={{ width: `${result.score * 10}%` }}></div>
                </div>

                <div className="flex-1 space-y-3">
                  <div>
                    <p className="text-[10px] font-bold uppercase text-slate-400 mb-1">Summary</p>
                    <p className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-300 line-clamp-3">
                      {result.summary}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-auto">
                    <div className="bg-green-50 dark:bg-green-900/20 p-2 rounded">
                      <p className="text-[9px] font-bold text-green-700 dark:text-green-400 uppercase mb-0.5">Strengths</p>
                      <ul className="text-[10px] text-green-800 dark:text-green-300 space-y-0.5 list-disc pl-3">
                        {result.strengths.slice(0, 3).map((s, i) => (
                          <li key={i} className="line-clamp-1">{s}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="bg-amber-50 dark:bg-amber-900/20 p-2 rounded">
                      <p className="text-[9px] font-bold text-amber-700 dark:text-amber-400 uppercase mb-0.5">Focus Areas</p>
                      <ul className="text-[10px] text-amber-800 dark:text-amber-300 space-y-0.5 list-disc pl-3">
                        {result.weaknesses.slice(0, 3).map((w, i) => (
                          <li key={i} className="line-clamp-1">{w}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => onRemoveResult(result.id)}
                  className="absolute top-4 right-20 p-2 text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                  aria-label="Remove result"
                >
                  <Trash2 size={16} />
                </button>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
