import { useState } from 'react';
import { useFile } from '../context/FileContext';
import { useNavigate } from '@tanstack/react-router';
import { Shield, ShieldAlert, ShieldCheck, MapPin, Hash, Camera, Clock, Eye, EyeOff, AlertTriangle } from 'lucide-react';
import { PrivacyService } from '../services/privacy.service';

export function PrivacyAnalysis() {
  const { file, metadata } = useFile();
  const navigate = useNavigate();
  const [revealGPS, setRevealGPS] = useState(false);

  if (!file || !metadata) {
    navigate({ to: '/' });
    return null;
  }

  const report = PrivacyService.analyze(metadata);
  const score = report.exposureScore;

  const getScoreColor = () => {
    if (score === 0) return 'text-[var(--color-accent-green)]';
    if (score < 50) return 'text-[var(--color-accent-amber)]';
    return 'text-[var(--color-accent-red)]';
  };

  const getScoreLabel = () => {
    if (score === 0) return 'NO EXPOSURE';
    if (score < 50) return 'MODERATE EXPOSURE';
    return 'HIGH EXPOSURE';
  };

  const getScoreIcon = () => {
    if (score === 0) return <ShieldCheck className="w-16 h-16 text-[var(--color-accent-green)]" />;
    if (score < 50) return <Shield className="w-16 h-16 text-[var(--color-accent-amber)]" />;
    return <ShieldAlert className="w-16 h-16 text-[var(--color-accent-red)]" />;
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'text-[var(--color-accent-red)]';
      case 'HIGH': return 'text-orange-500';
      case 'MEDIUM': return 'text-[var(--color-accent-amber)]';
      case 'LOW': return 'text-[var(--color-accent-cyan)]';
      default: return 'text-slate-400';
    }
  };

  const getSeverityBg = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'bg-[var(--color-accent-red)]/10 border-[var(--color-accent-red)]/30';
      case 'HIGH': return 'bg-orange-500/10 border-orange-500/30';
      case 'MEDIUM': return 'bg-[var(--color-accent-amber)]/10 border-[var(--color-accent-amber)]/30';
      case 'LOW': return 'bg-[var(--color-accent-cyan)]/10 border-[var(--color-accent-cyan)]/30';
      default: return 'bg-slate-800 border-slate-700';
    }
  };

  const getFindingIcon = (type: string) => {
    if (type.includes('GPS') || type.includes('Location')) return <MapPin className="w-5 h-5" />;
    if (type.includes('Serial')) return <Hash className="w-5 h-5" />;
    if (type.includes('Device') || type.includes('Camera')) return <Camera className="w-5 h-5" />;
    if (type.includes('Timestamp')) return <Clock className="w-5 h-5" />;
    return <AlertTriangle className="w-5 h-5" />;
  };

  // Obfuscate text for GPS unless revealed
  const renderEvidenceValue = (key: string, value: string) => {
    const isGPS = key.toLowerCase().includes('latitude') || key.toLowerCase().includes('longitude') || key.toLowerCase().includes('gps');
    
    if (isGPS && !revealGPS) {
      return (
        <span className="flex items-center space-x-2">
          <span className="filter blur-sm select-none">{'*'.repeat(value.length)}</span>
          <button 
            onClick={() => setRevealGPS(true)} 
            className="text-[var(--color-charcoal-400)] hover:text-[var(--color-accent-cyan)] transition-colors p-1"
            title="Click to reveal exact coordinates"
          >
            <Eye className="w-3 h-3" />
          </button>
        </span>
      );
    }
    
    if (isGPS && revealGPS) {
      return (
        <span className="flex items-center space-x-2 text-[var(--color-accent-red)]">
          <span>{value}</span>
          <button 
            onClick={() => setRevealGPS(false)} 
            className="text-[var(--color-charcoal-400)] hover:text-[var(--color-accent-cyan)] transition-colors p-1"
            title="Hide exact coordinates"
          >
            <EyeOff className="w-3 h-3" />
          </button>
        </span>
      );
    }

    return value.length > 50 ? `${value.substring(0, 50)}...` : value;
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <h2 className="text-lg font-medium tracking-wide text-slate-300 uppercase border-b border-[var(--color-charcoal-700)] pb-2 flex items-center justify-between">
        <span>Privacy & Security Findings</span>
        <span className="text-xs font-mono text-slate-500">{file.name}</span>
      </h2>

      {/* Hero Score Board */}
      <div className="panel p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8 bg-[var(--color-charcoal-800)] relative overflow-hidden">
        {/* Accent background bar */}
        <div className={`absolute top-0 left-0 w-full h-1 ${score === 0 ? 'bg-[var(--color-accent-green)]' : score < 50 ? 'bg-[var(--color-accent-amber)]' : 'bg-[var(--color-accent-red)]'}`}></div>
        
        <div className="flex items-center space-x-8">
          <div className="shrink-0 drop-shadow-xl">{getScoreIcon()}</div>
          <div>
            <h3 className="text-xs font-semibold tracking-widest text-slate-500 mb-2 uppercase">Privacy Exposure Score</h3>
            <div className="flex items-baseline space-x-3">
              <span className={`text-6xl font-light tracking-tighter ${getScoreColor()}`}>{score}</span>
              <span className="text-2xl text-slate-500 font-light">/ 100</span>
            </div>
            <p className={`font-mono text-sm mt-2 font-medium tracking-wide ${getScoreColor()}`}>
              {getScoreLabel()}
            </p>
          </div>
        </div>

        <div className="hidden md:block w-px h-24 bg-[var(--color-charcoal-700)] mx-4"></div>

        <div className="flex-1 max-w-sm">
          <p className="text-sm text-slate-300 leading-relaxed">
            {score === 0 
              ? "Excellent. No supported privacy-sensitive metadata was detected. (Note: External filesystem and platform metadata are outside the scope of this analysis)."
              : score < 50 
                ? "Caution. Moderate privacy risks detected, such as contextual device data. Consider cleaning before sharing."
                : "Critical. Severe privacy risks detected, such as precise GPS coordinates or unique serial numbers. Do not share this file publicly without cleaning it."
            }
          </p>
        </div>
      </div>

      {/* Disclaimers */}
      <div className="bg-[var(--color-charcoal-900)] border border-[var(--color-charcoal-700)] rounded-lg p-6 flex flex-col md:flex-row gap-6">
        <div className="flex-1 space-y-2">
          <h4 className="text-[10px] font-bold tracking-widest text-slate-500 uppercase flex items-center">
            <AlertTriangle className="w-3 h-3 mr-2 text-[var(--color-accent-amber)]" />
            File System Data vs Embedded Metadata
          </h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            This analysis evaluates metadata <strong>embedded inside</strong> the file itself (like EXIF or GPS). It does not analyze operating-system file properties (like Date Created or File Permissions), cloud storage metadata, or browser upload history.
          </p>
        </div>
        <div className="hidden md:block w-px bg-[var(--color-charcoal-700)]"></div>
        <div className="flex-1 space-y-2">
          <h4 className="text-[10px] font-bold tracking-widest text-slate-500 uppercase flex items-center">
            <Eye className="w-3 h-3 mr-2 text-[var(--color-accent-amber)]" />
            Metadata Privacy vs Visual Content
          </h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            Removing metadata does <strong>not</strong> anonymize the visual contents of the image. Faces, street signs, documents, and landmarks in the photo itself may still reveal highly sensitive information.
          </p>
        </div>
      </div>

      {/* Findings Feed */}
      <div className="space-y-6">
        <h3 className="text-xs font-semibold tracking-widest text-slate-500 uppercase flex items-center justify-between">
          <span>Detailed Findings ({report.findings.length})</span>
        </h3>

        {report.findings.length === 0 ? (
          <div className="panel p-12 text-center text-slate-500">
            <ShieldCheck className="w-12 h-12 mx-auto mb-4 text-[var(--color-accent-green)] opacity-50" />
            <p className="text-sm">No privacy risks detected in this image.</p>
          </div>
        ) : (
          report.findings.sort((a, b) => {
            const weights: Record<string, number> = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
            return weights[b.severity] - weights[a.severity];
          }).map((finding, idx) => (
            <div key={idx} className={`panel border-l-4 ${getSeverityBg(finding.severity).split(' ')[1].replace('/30', '')}`}>
              <div className="p-6 border-b border-[var(--color-charcoal-700)] flex flex-col sm:flex-row sm:items-start space-y-4 sm:space-y-0 sm:space-x-4 bg-[var(--color-charcoal-800)]/50">
                <div className={`mt-1 shrink-0 ${getSeverityColor(finding.severity)}`}>
                  {getFindingIcon(finding.type)}
                </div>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-3 mb-2">
                    <span className={`text-[10px] font-bold tracking-widest px-2 py-0.5 rounded-sm border ${getSeverityBg(finding.severity)} ${getSeverityColor(finding.severity)}`}>
                      {finding.severity}
                    </span>
                    <h3 className="text-base font-semibold tracking-wide text-slate-200">
                      {finding.type}
                    </h3>
                  </div>
                  <p className="text-slate-400 text-sm leading-relaxed">{finding.explanation}</p>
                </div>
              </div>
              
              <div className="bg-[var(--color-charcoal-900)] p-6 grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                <div>
                  <h4 className="text-xs font-semibold tracking-widest text-slate-500 mb-3 uppercase">
                    Evidence Extracted
                  </h4>
                  <ul className="space-y-2">
                    {finding.evidence.map((ev, i) => (
                      <li key={i} className="flex flex-col">
                        <span className="text-slate-500 text-xs font-medium mb-1">{ev.key}</span>
                        <div className="font-mono text-[var(--color-accent-cyan)] text-xs bg-[var(--color-charcoal-800)] p-2 rounded-sm border border-[var(--color-charcoal-700)]">
                          {renderEvidenceValue(ev.key, ev.value)}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="text-xs font-semibold tracking-widest text-slate-500 mb-3 uppercase flex items-center text-[var(--color-accent-amber)]">
                    <ShieldAlert className="w-3 h-3 mr-1" /> Recommendation
                  </h4>
                  <p className="text-slate-300 leading-relaxed bg-[var(--color-charcoal-800)] p-4 rounded-sm border border-[var(--color-charcoal-700)]">
                    {finding.recommendation}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
