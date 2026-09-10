import { useState, useMemo } from 'react';
import { Search, Copy, Check, ArrowUpDown, DatabaseZap } from 'lucide-react';
import { Button } from './Button';

interface MetadataTableProps {
  data: Record<string, any>;
  title?: string;
}

export function MetadataTable({ data }: MetadataTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortAsc, setSortAsc] = useState(true);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());

  const entries = useMemo(() => {
    let result = Object.entries(data).map(([key, value]) => ({
      key,
      value: String(value),
    }));

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (entry) =>
          entry.key.toLowerCase().includes(term) || entry.value.toLowerCase().includes(term)
      );
    }

    result.sort((a, b) => {
      if (sortAsc) return a.key.localeCompare(b.key);
      return b.key.localeCompare(a.key);
    });

    return result;
  }, [data, searchTerm, sortAsc]);

  const handleCopy = async (key: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const handleCopyAll = async () => {
    try {
      const textToCopy = entries.map((e) => `${e.key}: ${e.value}`).join('\n');
      await navigator.clipboard.writeText(textToCopy);
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2000);
    } catch (err) {
      console.error('Failed to copy all: ', err);
    }
  };

  const toggleExpand = (key: string) => {
    setExpandedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  if (Object.keys(data).length === 0) {
    return (
      <div className="panel p-12 flex flex-col items-center justify-center text-slate-500">
        <DatabaseZap className="w-12 h-12 mb-4 text-slate-600" />
        <p className="text-sm font-medium">No metadata available</p>
        <p className="text-xs mt-1">This category contains no extracted data.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search tags or values..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[var(--color-charcoal-800)] border border-[var(--color-charcoal-600)] rounded-sm pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-[var(--color-accent-cyan)] transition-colors text-slate-200 placeholder-slate-500"
          />
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={() => setSortAsc(!sortAsc)} title="Sort Alphabetically">
            <ArrowUpDown className="w-4 h-4 mr-2" />
            Sort
          </Button>
          <Button variant="outline" size="sm" onClick={handleCopyAll} title="Copy all visible data">
            {copiedAll ? <Check className="w-4 h-4 mr-2 text-[var(--color-accent-green)]" /> : <Copy className="w-4 h-4 mr-2" />}
            {copiedAll ? 'Copied!' : 'Copy All'}
          </Button>
        </div>
      </div>

      {/* Table Area */}
      <div className="panel overflow-hidden">
        {entries.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">
            No results found for "{searchTerm}"
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs uppercase bg-[var(--color-charcoal-800)] text-slate-400 border-b border-[var(--color-charcoal-600)]">
                <tr>
                  <th className="px-6 py-4 font-semibold w-1/3">Tag</th>
                  <th className="px-6 py-4 font-semibold">Value</th>
                  <th className="px-6 py-4 font-semibold w-16 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-charcoal-700)]">
                {entries.map(({ key, value }) => {
                  const isLong = value.length > 80;
                  const isExpanded = expandedKeys.has(key);
                  const displayValue = isLong && !isExpanded ? `${value.substring(0, 80)}...` : value;

                  return (
                    <tr key={key} className="hover:bg-[var(--color-charcoal-700)]/30 transition-colors group">
                      <td className="px-6 py-4 font-medium text-slate-300 break-all align-top">{key}</td>
                      <td className="px-6 py-4 align-top">
                        <div className="font-mono text-[var(--color-accent-cyan)] break-words whitespace-pre-wrap">
                          {displayValue}
                        </div>
                        {isLong && (
                          <button
                            onClick={() => toggleExpand(key)}
                            className="text-xs text-slate-500 hover:text-slate-300 mt-2 font-medium"
                          >
                            {isExpanded ? 'Show Less' : 'Show More'}
                          </button>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right align-top">
                        <button
                          onClick={() => handleCopy(key, value)}
                          className="text-slate-500 hover:text-[var(--color-accent-cyan)] transition-colors p-1 opacity-0 group-hover:opacity-100 focus:opacity-100"
                          title="Copy Value"
                        >
                          {copiedKey === key ? (
                            <Check className="w-4 h-4 text-[var(--color-accent-green)]" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
