import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Timer,
  Play,
  Pause,
  RotateCcw,
  Settings,
  BarChart3,
  Volume2,
  VolumeX,
  ChevronDown,
  Clock,
  Zap,
  Coffee,
  Target,
  TrendingUp,
  X,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { apiService } from '../services/apiService';

interface PomodoroSession {
  id: string;
  projectId: string;
  projectName: string;
  startTime: number;
  endTime: number;
  duration: number; // in seconds
  completed: boolean;
  date: string;
}

interface PomodoroStats {
  totalSessions: number;
  totalMinutes: number;
  completedSessions: number;
  averageSessionMinutes: number;
}

interface Project {
  id: string;
  name: string;
  color?: string;
}

interface PomodoroTimerProps {
  projects: Project[];
  currentProjectId: string;
  currentProjectName: string;
  onSessionComplete?: (session: PomodoroSession) => void;
}

const WORK_DURATION = 45 * 60; // 45 minutes in seconds
const BREAK_DURATION = 10 * 60; // 10 minutes break

const PomodoroTimer: React.FC<PomodoroTimerProps> = ({
  projects,
  currentProjectId,
  currentProjectName,
  onSessionComplete
}) => {
  // UI State
  const [isExpanded, setIsExpanded] = useState(false);

  // Timer State
  const [timeLeft, setTimeLeft] = useState(WORK_DURATION);
  const [isRunning, setIsRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [sessionStart, setSessionStart] = useState<number | null>(null);

  // Sound State
  const [soundEnabled, setSoundEnabled] = useState(false); // Default off for floating widget
  const [tickVolume, setTickVolume] = useState(0.2); // Lower default volume

  // Project Selection
  const [selectedProjectId, setSelectedProjectId] = useState(currentProjectId);
  const [showProjectDropdown, setShowProjectDropdown] = useState(false);

  // Stats & Settings
  const [showStats, setShowStats] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [sessions, setSessions] = useState<PomodoroSession[]>([]);

  // Audio Context for clock sound
  const audioContextRef = useRef<AudioContext | null>(null);
  const tickIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Update selected project when context changes, but only if not running
  useEffect(() => {
    if (!isRunning) {
      setSelectedProjectId(currentProjectId);
    }
  }, [currentProjectId, isRunning]);

  // Load sessions from API on mount
  useEffect(() => {
    const fetchSessions = async () => {
      try {
        // Try to fetch from Supabase via apiService
        // Since we don't have a specific method for Pomodoro in apiService, we'll use localStorage as fallback
        const savedSessions = localStorage.getItem('pomodoroSessions');
        if (savedSessions) {
          setSessions(JSON.parse(savedSessions));
        }
      } catch (error) {
        console.error('Failed to fetch pomodoro sessions:', error);
        // Fallback to localStorage
        const savedSessions = localStorage.getItem('pomodoroSessions');
        if (savedSessions) {
          setSessions(JSON.parse(savedSessions));
        }
      }
    };
    fetchSessions();
  }, []);

  // Save session to API
  const saveSessionToAPI = async (session: PomodoroSession) => {
    try {
      // Since we don't have a specific method for Pomodoro in apiService, we'll save to localStorage
      const savedSessions = localStorage.getItem('pomodoroSessions');
      const existingSessions = savedSessions ? JSON.parse(savedSessions) : [];
      localStorage.setItem('pomodoroSessions', JSON.stringify([...existingSessions, session]));
      
      // Also update the state
      setSessions(prev => [...prev, session]);
    } catch (error) {
      console.error('Failed to save pomodoro session:', error);
      // Save to localStorage as fallback
      const savedSessions = localStorage.getItem('pomodoroSessions');
      const existingSessions = savedSessions ? JSON.parse(savedSessions) : [];
      localStorage.setItem('pomodoroSessions', JSON.stringify([...existingSessions, session]));
    }
  };

  // Generate realistic clock tick sound
  const playTickSound = useCallback(() => {
    if (!soundEnabled || !audioContextRef.current) return;

    const ctx = audioContextRef.current;
    const now = ctx.currentTime;

    // Create multiple oscillators for a rich ticking sound
    const createTick = () => {
      // Main click sound
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.connect(gain1);
      gain1.connect(ctx.destination);

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(2500, now);
      osc1.frequency.exponentialRampToValueAtTime(1200, now + 0.02);

      gain1.gain.setValueAtTime(tickVolume * 0.15, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

      osc1.start(now);
      osc1.stop(now + 0.05);

      // Secondary resonance (wooden tick)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.connect(gain2);
      gain2.connect(ctx.destination);

      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(800, now);
      osc2.frequency.exponentialRampToValueAtTime(400, now + 0.03);

      gain2.gain.setValueAtTime(tickVolume * 0.08, now);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      osc2.start(now);
      osc2.stop(now + 0.08);
    };

    createTick();
  }, [soundEnabled, tickVolume]);

  // Play completion chime
  const playCompletionSound = useCallback(() => {
    if (!audioContextRef.current) return;

    const ctx = audioContextRef.current;
    const now = ctx.currentTime;

    // Beautiful multi-note chime
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6

    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.15);

      gain.gain.setValueAtTime(0, now + i * 0.15);
      gain.gain.linearRampToValueAtTime(0.2, now + i * 0.15 + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.15 + 0.8);

      osc.start(now + i * 0.15);
      osc.stop(now + i * 0.15 + 0.8);
    });
  }, []);

  // Initialize Audio Context
  useEffect(() => {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioContextRef.current = new AudioContextClass();
    }

    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  // Timer Logic
  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      timerIntervalRef.current = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);

      // Tick sound every second
      if (soundEnabled && !isBreak) {
        tickIntervalRef.current = setInterval(() => {
          playTickSound();
        }, 1000);
      }
    } else if (timeLeft === 0) {
      handleTimerComplete();
    }

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (tickIntervalRef.current) clearInterval(tickIntervalRef.current);
    };
  }, [isRunning, timeLeft, soundEnabled, isBreak, playTickSound]);

  const handleTimerComplete = useCallback(() => {
    setIsRunning(false);
    if (tickIntervalRef.current) clearInterval(tickIntervalRef.current);

    // Resume audio context to play sound if needed (browsers block autoplay)
    if (audioContextRef.current?.state === 'suspended') {
      audioContextRef.current.resume();
    }
    playCompletionSound();

    // Auto-expand if minimized when done
    setIsExpanded(true);

    if (!isBreak && sessionStart) {
      // Save completed work session
      const selectedProject = projects.find(p => p.id === selectedProjectId);
      const newSession: PomodoroSession = {
        id: Date.now().toString(),
        projectId: selectedProjectId,
        projectName: selectedProject?.name || currentProjectName,
        startTime: sessionStart,
        endTime: Date.now(),
        duration: WORK_DURATION,
        completed: true,
        date: new Date().toISOString().split('T')[0]
      };

      setSessions(prev => [...prev, newSession]);
      saveSessionToAPI(newSession); // Save to database
      onSessionComplete?.(newSession);

      // Switch to break
      setIsBreak(true);
      setTimeLeft(BREAK_DURATION);
    } else {
      // Break finished, back to work
      setIsBreak(false);
      setTimeLeft(WORK_DURATION);
    }

    setSessionStart(null);
  }, [isBreak, sessionStart, selectedProjectId, projects, currentProjectName, onSessionComplete, playCompletionSound]);

  const startTimer = () => {
    // Resume AudioContext if suspended
    if (audioContextRef.current?.state === 'suspended') {
      audioContextRef.current.resume();
    }

    if (!sessionStart && !isBreak) {
      setSessionStart(Date.now());
    }
    setIsRunning(true);
  };

  const pauseTimer = () => {
    setIsRunning(false);
    if (tickIntervalRef.current) clearInterval(tickIntervalRef.current);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setIsBreak(false);
    setTimeLeft(WORK_DURATION);
    setSessionStart(null);
    if (tickIntervalRef.current) clearInterval(tickIntervalRef.current);
  };

  // Format time display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate progress percentage
  const progress = isBreak
    ? ((BREAK_DURATION - timeLeft) / BREAK_DURATION) * 100
    : ((WORK_DURATION - timeLeft) / WORK_DURATION) * 100;

  // Calculate stats for selected project
  const projectStats: PomodoroStats = React.useMemo(() => {
    const projectSessions = sessions.filter(s => s.projectId === selectedProjectId);
    const completedSessions = projectSessions.filter(s => s.completed);
    const totalMinutes = completedSessions.reduce((acc, s) => acc + s.duration / 60, 0);

    return {
      totalSessions: projectSessions.length,
      completedSessions: completedSessions.length,
      totalMinutes: Math.round(totalMinutes),
      averageSessionMinutes: completedSessions.length > 0
        ? Math.round(totalMinutes / completedSessions.length)
        : 0
    };
  }, [sessions, selectedProjectId]);

  // All-time stats by project
  const allProjectStats = React.useMemo(() => {
    const stats: Record<string, { name: string; minutes: number; sessions: number }> = {};

    sessions.filter(s => s.completed).forEach(session => {
      if (!stats[session.projectId]) {
        stats[session.projectId] = {
          name: session.projectName,
          minutes: 0,
          sessions: 0
        };
      }
      stats[session.projectId].minutes += session.duration / 60;
      stats[session.projectId].sessions += 1;
    });

    return Object.entries(stats)
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.minutes - a.minutes);
  }, [sessions]);

  const selectedProject = projects.find(p => p.id === selectedProjectId);

  return (
    <div className="fixed bottom-6 right-6 z-[9999] font-sans">
      {/* Minimized Pill */}
      {!isExpanded && (
        <div
          className="flex items-center gap-3 bg-slate-900/95 backdrop-blur text-white p-2 pl-4 pr-2 rounded-full shadow-2xl border border-slate-700/50 hover:scale-105 transition-all cursor-pointer group"
          onClick={() => setIsExpanded(true)}
        >
          <div className="relative w-8 h-8 flex items-center justify-center">
            <svg className="absolute inset-0 -rotate-90" viewBox="0 0 36 36">
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="#334155"
                strokeWidth="3"
              />
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke={isBreak ? "#fbbf24" : "#22c55e"}
                strokeWidth="3"
                strokeDasharray={`${progress}, 100`}
              />
            </svg>
            {isBreak ? <Coffee size={12} className="text-amber-400" /> : <Zap size={12} className="text-green-500" />}
          </div>

          <div className="flex flex-col">
            <span className="text-xs font-bold font-mono tracking-widest">{formatTime(timeLeft)}</span>
            <span className="text-[9px] text-slate-400 font-medium truncate max-w-[80px]">
              {selectedProject?.name || currentProjectName}
            </span>
          </div>

          <div className="flex items-center gap-1 mr-1">
            <button
              className="p-1.5 hover:bg-slate-800 rounded-full transition-colors text-slate-300 hover:text-white"
              onClick={(e) => {
                e.stopPropagation();
                isRunning ? pauseTimer() : startTimer();
              }}
            >
              {isRunning ? <Pause size={12} /> : <Play size={12} />}
            </button>
          </div>
        </div>
      )}

      {/* Expanded Card */}
      {isExpanded && (
        <div className="animate-in slide-in-from-bottom-5 fade-in duration-300">
          <div className="bg-slate-900/95 backdrop-blur-xl text-slate-100 p-6 rounded-3xl shadow-2xl border border-slate-700/50 w-80 relative">
            {/* Header Controls */}
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                <Timer className="w-3.5 h-3.5" />
                <span>POMODORO</span>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => setShowStats(!showStats)} className="p-2 hover:bg-slate-800 rounded-xl transition-colors">
                  <BarChart3 size={16} className={showStats ? "text-indigo-400" : "text-slate-400"} />
                </button>
                <button onClick={() => setSoundEnabled(!soundEnabled)} className="p-2 hover:bg-slate-800 rounded-xl transition-colors">
                  {soundEnabled ? <Volume2 size={16} className="text-indigo-400" /> : <VolumeX size={16} className="text-slate-600" />}
                </button>
                <button onClick={() => setIsExpanded(false)} className="p-2 hover:bg-slate-800 rounded-xl transition-colors">
                  <Minimize2 size={16} className="text-slate-400" />
                </button>
              </div>
            </div>

            {/* Project Selector */}
            <div className="relative mb-8 text-center group">
              <button
                onClick={() => setShowProjectDropdown(!showProjectDropdown)}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 transition-colors"
              >
                <Target size={12} />
                <span className="max-w-[150px] truncate">{selectedProject?.name || currentProjectName}</span>
                <ChevronDown size={12} />
              </button>

              {showProjectDropdown && (
                <div className="absolute top-8 left-1/2 -translate-x-1/2 w-48 max-h-48 overflow-y-auto bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-50 py-1">
                  {projects.map(p => (
                    <button
                      key={p.id}
                      onClick={() => {
                        setSelectedProjectId(p.id);
                        setShowProjectDropdown(false);
                      }}
                      className={`w-full text-right px-3 py-2 text-xs hover:bg-slate-700 ${p.id === selectedProjectId ? 'text-indigo-400' : 'text-slate-400'}`}
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Timer Circle */}
            <div className="relative w-48 h-48 mx-auto mb-8">
              <svg className="w-full h-full -rotate-90">
                <circle
                  cx="96"
                  cy="96"
                  r="88"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="6"
                  className="text-slate-800"
                />
                <circle
                  cx="96"
                  cy="96"
                  r="88"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="6"
                  strokeDasharray={`${2 * Math.PI * 88}`}
                  strokeDashoffset={`${2 * Math.PI * 88 * (1 - progress / 100)}`}
                  className={`transition-all duration-1000 ${isBreak ? 'text-amber-400' : 'text-emerald-500'}`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-5xl font-mono font-bold tracking-tight text-white mb-2">
                  {formatTime(timeLeft)}
                </span>
                <span className={`text-xs font-bold uppercase tracking-widest ${isBreak ? 'text-amber-400' : 'text-emerald-500'}`}>
                  {isBreak ? 'استراحة' : 'تركيز'}
                </span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-4 mb-4">
              <button
                onClick={resetTimer}
                className="p-3 rounded-full bg-slate-800 text-slate-400 hover:bg-slate-700 transition-colors"
              >
                <RotateCcw size={20} />
              </button>
              <button
                onClick={isRunning ? pauseTimer : startTimer}
                className={`p-6 rounded-full transition-all hover:scale-105 active:scale-95 ${isRunning
                  ? 'bg-slate-800 text-amber-400 hover:bg-slate-700'
                  : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-600/20'
                  }`}
              >
                {isRunning ? <Pause size={28} /> : <Play size={28} className="ml-1" />}
              </button>
            </div>
          </div>

          {/* Floating Stats Panel (Popper) */}
          {showStats && (
            <div className="absolute bottom-full left-0 mb-4 w-72 bg-slate-900/95 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-5 shadow-2xl animate-in slide-in-from-bottom-2">
              <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4">الإحصائيات اليوم</h4>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/50">
                  <div className="text-2xl font-bold text-white mb-1">{projectStats.completedSessions}</div>
                  <div className="text-[10px] text-slate-400">جلسات مكتملة</div>
                </div>
                <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/50">
                  <div className="text-2xl font-bold text-white mb-1">{projectStats.totalMinutes}</div>
                  <div className="text-[10px] text-slate-400">دقيقة تركيز</div>
                </div>
              </div>

              <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3">أفضل المشاريع</h4>
              <div className="space-y-2">
                {allProjectStats.slice(0, 3).map((p, i) => (
                  <div key={p.id} className="flex justify-between items-center text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-4 h-4 flex items-center justify-center rounded-full bg-slate-800 text-[10px] text-slate-400">{i + 1}</span>
                      <span className="text-slate-300 truncate max-w-[120px]">{p.name}</span>
                    </div>
                    <span className="font-mono text-slate-400">{Math.round(p.minutes)} د</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PomodoroTimer;
