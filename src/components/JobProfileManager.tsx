import React, { useState, useEffect } from 'react';
import { JobProfile } from '../types';
import { Plus, Edit2, Trash2, Check, X, Briefcase } from 'lucide-react';

interface Props {
  activeProfileId: string | null;
  onSelectProfile: (id: string | null) => void;
  onOpenProfile?: (id: string) => void;
}

export function JobProfileManager({ activeProfileId, onSelectProfile, onOpenProfile }: Props) {
  const [profiles, setProfiles] = useState<JobProfile[]>(() => {
    const saved = localStorage.getItem('jobProfiles');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [isEditing, setIsEditing] = useState(false);
  const [currentProfile, setCurrentProfile] = useState<Partial<JobProfile>>({});

  useEffect(() => {
    localStorage.setItem('jobProfiles', JSON.stringify(profiles));
  }, [profiles]);

  useEffect(() => {
    // If no active profile, select the first one if available
    if (!activeProfileId && profiles.length > 0) {
      onSelectProfile(profiles[0].id);
    }
  }, [profiles, activeProfileId, onSelectProfile]);

  const handleSave = () => {
    if (!currentProfile.title || !currentProfile.description) {
      // Missing title/description, simply return without saving
      return;
    }

    if (currentProfile.id) {
      setProfiles(profiles.map(p => p.id === currentProfile.id ? currentProfile as JobProfile : p));
    } else {
      const newProfile = {
        ...currentProfile,
        id: Math.random().toString(36).substr(2, 9)
      } as JobProfile;
      setProfiles([...profiles, newProfile]);
      if (!activeProfileId) {
        onSelectProfile(newProfile.id);
      }
    }
    setIsEditing(false);
    setCurrentProfile({});
  };

  const handleEdit = (profile: JobProfile) => {
    setCurrentProfile(profile);
    setIsEditing(true);
  };

  const handleDelete = (id: string) => {
    const newProfiles = profiles.filter(p => p.id !== id);
    setProfiles(newProfiles);
    if (activeProfileId === id) {
      onSelectProfile(newProfiles.length > 0 ? newProfiles[0].id : null);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6 flex flex-col h-full transition-all">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-xl font-bold tracking-tight text-[#1e293b] dark:text-white flex items-center gap-2">
          Job Profiles
        </h2>
      </div>

      {!isEditing && (
        <button 
          onClick={() => { setCurrentProfile({}); setIsEditing(true); }}
          className="w-full py-2 px-4 bg-[#2563eb] text-white rounded-md text-sm font-semibold hover:bg-blue-700 transition-colors mb-6 flex items-center justify-center gap-1"
        >
          <Plus size={16} /> New Job Profile
        </button>
      )}

      {isEditing ? (
        <div className="space-y-4 animate-in fade-in slide-in-from-top-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Job Title *</label>
            <input 
              type="text" 
              value={currentProfile.title || ''}
              onChange={e => setCurrentProfile({...currentProfile, title: e.target.value})}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-transparent focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="e.g., Senior Frontend Developer"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Job Description *</label>
            <textarea 
              value={currentProfile.description || ''}
              onChange={e => setCurrentProfile({...currentProfile, description: e.target.value})}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-transparent focus:ring-2 focus:ring-blue-500 outline-none h-24 resize-none"
              placeholder="Overview of the role..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Required Experience Level</label>
            <input 
              type="text" 
              value={currentProfile.experienceLevel || ''}
              onChange={e => setCurrentProfile({...currentProfile, experienceLevel: e.target.value})}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-transparent focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="e.g., 3-5 years, Entry level, Senior"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Required Certifications</label>
            <input 
              type="text" 
              value={currentProfile.certifications || ''}
              onChange={e => setCurrentProfile({...currentProfile, certifications: e.target.value})}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-transparent focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="e.g., AWS Certified, PMP, CPA (Optional)"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Key Tasks/Responsibilities</label>
            <textarea 
              value={currentProfile.tasks || ''}
              onChange={e => setCurrentProfile({...currentProfile, tasks: e.target.value})}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-transparent focus:ring-2 focus:ring-blue-500 outline-none h-24 resize-none"
              placeholder="- Task 1&#10;- Task 2"
            />
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <button 
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={handleSave}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
            >
              <Check size={16} /> Save Profile
            </button>
          </div>
        </div>
      ) : (
        <div className="flex-1">
          {profiles.length === 0 ? (
            <div className="text-center py-8 text-slate-500 dark:text-slate-400">
              <p>No job profiles found.</p>
              <p className="text-sm mt-1">Create one to start screening CVs.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
              {profiles.map(profile => (
                <div 
                  key={profile.id} 
                  className={`p-5 rounded-lg bg-white dark:bg-slate-800 shadow-sm border transition-all flex flex-col group ${activeProfileId === profile.id ? 'border-[#2563eb] ring-1 ring-[#2563eb]' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'}`}
                  onClick={() => onSelectProfile(profile.id)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className={`font-bold text-lg ${activeProfileId === profile.id ? 'text-[#2563eb] dark:text-blue-400' : 'text-[#1e293b] dark:text-white'}`}>
                      {profile.title}
                    </h3>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleEdit(profile); }}
                        className="text-slate-400 hover:text-blue-600 transition-colors p-1"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDelete(profile.id); }}
                        className="text-slate-400 hover:text-red-500 transition-colors p-1"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  {(profile.experienceLevel || profile.certifications) && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {profile.experienceLevel && (
                        <span className="text-[10px] font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400 px-2 py-0.5 rounded-full">
                          {profile.experienceLevel}
                        </span>
                      )}
                      {profile.certifications && (
                        <span className="text-[10px] font-semibold bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-400 px-2 py-0.5 rounded-full">
                          {profile.certifications}
                        </span>
                      )}
                    </div>
                  )}
                  <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mb-6 flex-1">
                    {profile.description}
                  </p>
                  
                  {onOpenProfile && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); onOpenProfile(profile.id); }}
                      className="w-full mt-auto py-2.5 text-xs font-bold bg-[#f5f7fa] dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                    >
                      Open & Screen CVs
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
