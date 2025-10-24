'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, RefreshCw, Trash2, Download } from 'lucide-react';
import AnimatedStarBackground from '../../components/AnimatedStarBackground';

interface LogEntry {
  id: string;
  timestamp: Date;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  data?: any;
  source: string;
}

export default function LogPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filter, setFilter] = useState<'all' | 'info' | 'warn' | 'error' | 'debug'>('all');
  const [isAutoRefresh, setIsAutoRefresh] = useState(true);

  useEffect(() => {
    // Load logs from localStorage on mount
    loadLogs();
    
    // Auto-refresh every 2 seconds if enabled
    const interval = setInterval(() => {
      if (isAutoRefresh) {
        loadLogs();
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [isAutoRefresh]);

  const loadLogs = () => {
    try {
      const storedLogs = localStorage.getItem('manifestalchemy-logs');
      if (storedLogs) {
        const parsedLogs = JSON.parse(storedLogs).map((log: any) => ({
          ...log,
          timestamp: new Date(log.timestamp)
        }));
        setLogs(parsedLogs);
      }
    } catch (error) {
      console.error('Error loading logs:', error);
    }
  };

  const clearLogs = () => {
    localStorage.removeItem('manifestalchemy-logs');
    setLogs([]);
  };

  const exportLogs = () => {
    const dataStr = JSON.stringify(logs, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `manifestalchemy-logs-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const filteredLogs = logs.filter(log => 
    filter === 'all' || log.level === filter
  ).reverse(); // Show newest first

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'error': return 'text-red-400';
      case 'warn': return 'text-yellow-400';
      case 'info': return 'text-blue-400';
      case 'debug': return 'text-gray-400';
      default: return 'text-white';
    }
  };

  const getLevelBg = (level: string) => {
    switch (level) {
      case 'error': return 'bg-red-500/20 border-red-500/30';
      case 'warn': return 'bg-yellow-500/20 border-yellow-500/30';
      case 'info': return 'bg-blue-500/20 border-blue-500/30';
      case 'debug': return 'bg-gray-500/20 border-gray-500/30';
      default: return 'bg-white/10 border-white/20';
    }
  };

  return (
    <div className="min-h-screen relative">
      <AnimatedStarBackground />
      
      <div className="relative z-10 p-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div className="flex items-center gap-4">
            <button
              onClick={() => window.history.back()}
              className="flex items-center gap-2 px-4 py-2 text-yellow-300 hover:bg-yellow-400/20 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
            <h1 className="text-3xl font-bold text-white font-ballet">
              Debug Logs
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsAutoRefresh(!isAutoRefresh)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                isAutoRefresh 
                  ? 'bg-green-500/20 text-green-300 border border-green-500/30' 
                  : 'bg-gray-500/20 text-gray-300 border border-gray-500/30'
              }`}
            >
              <RefreshCw className={`w-4 h-4 ${isAutoRefresh ? 'animate-spin' : ''}`} />
              Auto Refresh {isAutoRefresh ? 'ON' : 'OFF'}
            </button>
            
            <button
              onClick={exportLogs}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 border border-blue-500/30 rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
            
            <button
              onClick={clearLogs}
              className="flex items-center gap-2 px-4 py-2 bg-red-500/20 text-red-300 hover:bg-red-500/30 border border-red-500/30 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Clear
            </button>
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex gap-2 mb-6"
        >
          {(['all', 'info', 'warn', 'error', 'debug'] as const).map((level) => (
            <button
              key={level}
              onClick={() => setFilter(level)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === level
                  ? 'bg-yellow-400/20 text-yellow-300 border border-yellow-400/30'
                  : 'bg-white/10 text-white/70 hover:bg-white/20 border border-white/20'
              }`}
            >
              {level.toUpperCase()} ({logs.filter(log => level === 'all' || log.level === level).length})
            </button>
          ))}
        </motion.div>

        {/* Logs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-4 max-h-[70vh] overflow-y-auto"
        >
          {filteredLogs.length === 0 ? (
            <div className="text-center py-12 text-white/50">
              <p className="text-lg">No logs found</p>
              <p className="text-sm mt-2">Logs will appear here as the app runs</p>
            </div>
          ) : (
            filteredLogs.map((log) => (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className={`p-4 rounded-lg border backdrop-blur-sm ${getLevelBg(log.level)}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className={`font-bold ${getLevelColor(log.level)}`}>
                      {log.level.toUpperCase()}
                    </span>
                    <span className="text-white/70 text-sm">
                      {log.timestamp.toLocaleTimeString()}
                    </span>
                    <span className="text-white/50 text-sm">
                      {log.source}
                    </span>
                  </div>
                </div>
                
                <p className="text-white mb-2">{log.message}</p>
                
                {log.data && (
                  <details className="text-white/70 text-sm">
                    <summary className="cursor-pointer hover:text-white transition-colors">
                      View Data
                    </summary>
                    <pre className="mt-2 p-3 bg-black/30 rounded border overflow-x-auto">
                      {JSON.stringify(log.data, null, 2)}
                    </pre>
                  </details>
                )}
              </motion.div>
            ))
          )}
        </motion.div>

        {/* Database Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8 p-6 bg-black/40 backdrop-blur-sm border border-yellow-400/20 rounded-2xl"
        >
          <h2 className="text-xl font-semibold text-white mb-4">Database Information</h2>
          <div className="space-y-2 text-yellow-100">
            <p><span className="font-medium text-yellow-300">Storage Type:</span> Local Storage (Browser)</p>
            <p><span className="font-medium text-yellow-300">Data Persistence:</span> Session-based (clears on browser clear)</p>
            <p><span className="font-medium text-yellow-300">Backup:</span> Manual export via "Export" button</p>
            <p><span className="font-medium text-yellow-300">No External Database:</span> All data stored locally in browser</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
