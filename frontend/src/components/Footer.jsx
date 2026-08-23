import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Shield, Cpu } from 'lucide-react';

export function Footer() {
  return (
    <footer className="w-full border-t border-slate-800/80 bg-slate-950/80 backdrop-blur-xl relative mt-auto">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          
          {/* Col 1: Brand & Tagline */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-gradient-to-tr from-aura-indigo via-aura-violet to-aura-cyan p-0.5">
                <div className="w-full h-full bg-slate-950 rounded-[6px] flex items-center justify-center">
                  <Sparkles className="w-3.5 h-3.5 text-aura-violet" />
                </div>
              </div>
              <span className="font-display font-bold text-base text-white">MeetAura</span>
            </div>
            
            <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
              Turn conversations into clear next steps. An AI meeting assistant designed to transcribe, synthesize, and extract key decisions and actionable tasks.
            </p>

            <div className="flex items-center gap-2.5 pt-1">
              <span className="inline-flex items-center gap-1.5 text-xs text-slate-400 bg-slate-900/60 px-2.5 py-1 rounded-full border border-slate-800">
                <Cpu className="w-3 h-3 text-aura-violet" /> Powered by Gemini
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs text-slate-400 bg-slate-900/60 px-2.5 py-1 rounded-full border border-slate-800">
                <Shield className="w-3 h-3 text-emerald-400" /> Private & Secure
              </span>
            </div>
          </div>

          {/* Col 2: Navigation */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300 mb-3">
              Platform
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <Link to="/" className="hover:text-violet-400 transition-colors">
                  Home & Overview
                </Link>
              </li>
              <li>
                <Link to="/upload" className="hover:text-violet-400 transition-colors">
                  Upload Recording
                </Link>
              </li>
              <li>
                <Link to="/meetings" className="hover:text-violet-400 transition-colors">
                  Meeting History
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Capabilities */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300 mb-3">
              Features
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>Accurate Audio Transcription</li>
              <li>Executive Summaries</li>
              <li>Key Decision Extraction</li>
              <li>Action Item Allocation</li>
            </ul>
          </div>

        </div>

        {/* Bottom bar */}
        <div className="pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} MeetAura. All rights reserved.</p>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5 text-slate-400 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              All Systems Operational
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-slate-400">AI Meeting Productivity Platform</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
