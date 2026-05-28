"use client";

import { useState } from "react";
import Editor from "@monaco-editor/react";
import { ShieldCheck, Loader2, AlertTriangle, Zap } from "lucide-react";

export default function Home() {
  // --- STATE VARIABLES (This is what was missing!) ---
  const [code, setCode] = useState<string>("// Paste your Solidity contract here...");
  const [isAuditing, setIsAuditing] = useState<boolean>(false);
  const [results, setResults] = useState<{vulnerabilities: string[], gas_optimizations: string[]} | null>(null);

  // --- THE BULLETPROOF FETCH FUNCTION ---
  const handleAudit = async () => {
    setIsAuditing(true);
    setResults(null);
    
    try {
      const response = await fetch("http://localhost:8000/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source_code: code, contract_address: "" })
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("Python Backend Error:", data);
        alert(`Backend Error: ${JSON.stringify(data)}`);
        setIsAuditing(false);
        return; 
      }

      setResults(data);

    } catch (error: any) {
      console.error("Network Connection Failed:", error);
      alert(`Network Blocked: ${error.message}`);
    } finally {
      setIsAuditing(false);
    }
  };

  // --- THE UI LAYOUT ---
  return (
    <div className="min-h-screen flex flex-col">
      <nav className="border-b border-slate-800 bg-slate-900 p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="text-emerald-400" size={28} />
          <h1 className="text-xl font-bold tracking-tight">AI Smart Contract Auditor</h1>
        </div>
        <button 
          onClick={handleAudit}
          disabled={isAuditing}
          className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2 rounded-md font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
        >
          {isAuditing ? <Loader2 className="animate-spin" size={20} /> : "Run Audit"}
        </button>
      </nav>

      <main className="flex-1 flex overflow-hidden">
        
        {/* Editor Panel */}
        <div className="w-1/2 border-r border-slate-800 flex flex-col">
          <div className="bg-slate-800/50 px-4 py-2 border-b border-slate-800 text-sm text-slate-400">
            contract.sol
          </div>
          <Editor
            height="100%"
            defaultLanguage="solidity"
            theme="vs-dark"
            value={code}
            onChange={(value) => setCode(value || "")}
            options={{ minimap: { enabled: false }, fontSize: 14, padding: { top: 16 } }}
          />
        </div>

        {/* Results Panel */}
        <div className="w-1/2 bg-slate-900 p-6 overflow-y-auto">
          {isAuditing ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4">
              <Loader2 className="animate-spin text-emerald-500" size={48} />
              <p className="animate-pulse">Gemini Agents are analyzing AST...</p>
            </div>
          ) : results ? (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold mb-6">Audit Report</h2>
              
              <div className="border border-red-900/50 bg-red-900/10 rounded-lg p-5">
                <div className="flex items-center gap-2 mb-3 text-red-400">
                  <AlertTriangle size={20} />
                  <h3 className="font-medium text-lg">Security Vulnerabilities</h3>
                </div>
                <ul className="list-disc pl-5 space-y-2 text-slate-300">
                  {results.vulnerabilities.length > 0 ? (
                    results.vulnerabilities.map((vuln, idx) => <li key={idx}>{vuln}</li>)
                  ) : (
                    <li className="text-emerald-400 list-none">No critical vulnerabilities found.</li>
                  )}
                </ul>
              </div>

              <div className="border border-amber-900/50 bg-amber-900/10 rounded-lg p-5">
                <div className="flex items-center gap-2 mb-3 text-amber-400">
                  <Zap size={20} />
                  <h3 className="font-medium text-lg">Gas Optimizations</h3>
                </div>
                <ul className="list-disc pl-5 space-y-2 text-slate-300">
                  {results.gas_optimizations.length > 0 ? (
                    results.gas_optimizations.map((opt, idx) => <li key={idx}>{opt}</li>)
                  ) : (
                    <li className="text-slate-400 list-none">Code is gas optimized.</li>
                  )}
                </ul>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-500">
              <ShieldCheck size={64} className="mb-4 opacity-20" />
              <p>Paste a smart contract and click Run Audit to begin.</p>
            </div>
          )}
        </div>

      </main>
    </div>
  );
}