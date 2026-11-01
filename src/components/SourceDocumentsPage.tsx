/**
 * Claim Passport - Source Documents & Passages Workbench
 * Upload approved brand documents (.txt, .md, .pdf), inspect chunked passages (300-500 chars),
 * and view BM25 retrieval grounding.
 */

import React, { useState, useEffect } from 'react';
import {
  FileText,
  Upload,
  Trash2,
  Eye,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  FileCode,
  Layers,
  Sparkles,
  ArrowRight,
  Database,
  Search,
} from 'lucide-react';
import { User } from '../types';
import {
  fetchDocumentsApi,
  fetchDocumentPassagesApi,
  uploadDocumentApi,
  deleteDocumentApi,
} from '../services/api';

interface SourceDocumentsPageProps {
  currentUser: User;
}

export const SourceDocumentsPage: React.FC<SourceDocumentsPageProps> = ({ currentUser }) => {
  const [documents, setDocuments] = useState<any[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<any | null>(null);
  const [passages, setPassages] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoadingPassages, setIsLoadingPassages] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const canManage = currentUser.role === 'Brand Manager' || currentUser.role === 'Reviewer' || currentUser.role === 'Fact Owner';

  const loadDocuments = async () => {
    try {
      const docs = await fetchDocumentsApi();
      setDocuments(docs);
      if (docs.length > 0 && !selectedDoc) {
        handleSelectDoc(docs[0]);
      }
    } catch (err: any) {
      setNotification({ type: 'error', text: err?.message || 'Failed to load source documents' });
    }
  };

  useEffect(() => {
    loadDocuments();
  }, []);

  const handleSelectDoc = async (doc: any) => {
    setSelectedDoc(doc);
    setIsLoadingPassages(true);
    try {
      const psgList = await fetchDocumentPassagesApi(doc.id);
      setPassages(psgList);
    } catch (err: any) {
      setNotification({ type: 'error', text: err?.message || 'Failed to load passages' });
    } finally {
      setIsLoadingPassages(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Client-side file size guard (5 MB)
    if (file.size > 5 * 1024 * 1024) {
      setNotification({
        type: 'error',
        text: `File exceeds 5 MB limit (${(file.size / (1024 * 1024)).toFixed(2)} MB). Please select a smaller document.`,
      });
      return;
    }

    const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
    if (!['.txt', '.md', '.pdf'].includes(ext)) {
      setNotification({
        type: 'error',
        text: `Unsupported file format "${ext}". Please upload approved documents in .txt, .md, or .pdf format.`,
      });
      return;
    }

    setIsUploading(true);
    setNotification(null);

    try {
      const reader = new FileReader();

      if (ext === '.pdf') {
        reader.onload = async () => {
          const base64 = (reader.result as string).split(',')[1];
          await uploadDocumentApi({
            filename: file.name,
            mimeType: 'application/pdf',
            contentBase64: base64,
          });
          setNotification({
            type: 'success',
            text: `Document "${file.name}" uploaded and chunked into searchable passages successfully.`,
          });
          await loadDocuments();
          setIsUploading(false);
        };
        reader.readAsDataURL(file);
      } else {
        reader.onload = async () => {
          const text = reader.result as string;
          await uploadDocumentApi({
            filename: file.name,
            mimeType: ext === '.md' ? 'text/markdown' : 'text/plain',
            contentText: text,
          });
          setNotification({
            type: 'success',
            text: `Document "${file.name}" uploaded and chunked into searchable passages successfully.`,
          });
          await loadDocuments();
          setIsUploading(false);
        };
        reader.readAsText(file);
      }
    } catch (err: any) {
      setNotification({
        type: 'error',
        text: err?.message || 'Upload failed. Ensure file is not corrupt.',
      });
      setIsUploading(false);
    }

    // Reset input
    e.target.value = '';
  };

  const handleDeleteDoc = async (docId: string, filename: string) => {
    if (!canManage) {
      setNotification({
        type: 'error',
        text: 'Governance Gate: Only Brand Managers, Reviewers, and Fact Owners can delete approved source documents.',
      });
      return;
    }

    if (!confirm(`Are you sure you want to delete "${filename}" and all its indexed passages?`)) {
      return;
    }

    try {
      await deleteDocumentApi(docId);
      setNotification({ type: 'success', text: `Deleted "${filename}".` });
      if (selectedDoc?.id === docId) {
        setSelectedDoc(null);
        setPassages([]);
      }
      await loadDocuments();
    } catch (err: any) {
      setNotification({ type: 'error', text: err?.message || 'Failed to delete document' });
    }
  };

  const filteredPassages = passages.filter((p) =>
    searchQuery ? p.passageText.toLowerCase().includes(searchQuery.toLowerCase()) : true
  );

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-2 rounded-xl bg-indigo-50 text-indigo-700">
              <Database className="h-5 w-5" />
            </span>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Approved Source Documents</h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
              Grounding Repository
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Upload certified lab reports, specifications, and regulatory standards (.txt, .md, .pdf max 5 MB).
            Text is split into 300–500 character passages for BM25 retrieval during claim verification.
          </p>
        </div>

        {/* Upload Button */}
        <label className={`cursor-pointer inline-flex items-center px-4 py-2 rounded-xl text-xs font-semibold shadow-xs transition ${
          isUploading ? 'bg-slate-300 text-slate-600 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 text-white'
        }`}>
          <Upload className="h-4 w-4 mr-2" />
          <span>{isUploading ? 'Processing Passages...' : 'Upload Source Doc'}</span>
          <input
            type="file"
            accept=".txt,.md,.pdf"
            disabled={isUploading}
            onChange={handleFileUpload}
            className="hidden"
          />
        </label>
      </div>

      {/* Notification Banner */}
      {notification && (
        <div className={`p-4 rounded-xl border text-xs flex items-center justify-between ${
          notification.type === 'success'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
            : 'bg-rose-50 border-rose-200 text-rose-800'
        }`}>
          <div className="flex items-center space-x-2">
            {notification.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
            )}
            <span>{notification.text}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-xs font-bold px-2 py-0.5 rounded hover:bg-white/40"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Grid: Document List on Left, Passages on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Document List */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Approved Documents ({documents.length})
            </h2>
            <span className="text-[11px] text-slate-400">BM25 Search Indexed</span>
          </div>

          {documents.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center text-slate-500">
              <FileText className="h-10 w-10 mx-auto text-slate-300 mb-2" />
              <p className="text-sm font-semibold text-slate-800">No documents uploaded yet</p>
              <p className="text-xs text-slate-500 mt-1">Upload a .txt, .md, or .pdf to index brand proof.</p>
            </div>
          ) : (
            documents.map((doc) => {
              const isSelected = selectedDoc?.id === doc.id;
              return (
                <div
                  key={doc.id}
                  onClick={() => handleSelectDoc(doc)}
                  className={`p-4 rounded-2xl border transition cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-50/70 border-indigo-300 shadow-xs'
                      : 'bg-white hover:bg-slate-50/80 border-slate-200'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-xl shrink-0 ${
                        doc.filename.endsWith('.pdf') ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-700'
                      }`}>
                        <FileCode className="h-4 w-4" />
                      </div>
                      <div>
                        <h3 className="text-xs font-bold text-slate-900 truncate max-w-[220px]">
                          {doc.filename}
                        </h3>
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          {(doc.file_size / 1024).toFixed(1)} KB • {doc.uploaded_by}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-1">
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                        {doc.passage_count || 0} passages
                      </span>
                      {canManage && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteDoc(doc.id, doc.filename);
                          }}
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                          title="Delete document"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Chunked Passages View */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center">
                <Layers className="h-4 w-4 mr-1.5 text-indigo-600" />
                Indexed Passages (300–500 Characters)
              </h2>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {selectedDoc ? `Viewing: ${selectedDoc.filename}` : 'Select a document to inspect passages'}
              </p>
            </div>

            {/* In-passage search */}
            <div className="relative w-full sm:w-56">
              <Search className="h-3.5 w-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search snippet text..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {isLoadingPassages ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              Loading extracted passages from SQLite...
            </div>
          ) : filteredPassages.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              {searchQuery ? 'No passages match your search.' : 'No passages found for this document.'}
            </div>
          ) : (
            <div className="space-y-3 max-h-[580px] overflow-y-auto pr-1">
              {filteredPassages.map((psg) => (
                <div
                  key={psg.id}
                  className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-white hover:border-indigo-200 transition"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800">
                      Passage #{psg.positionIndex}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Chars {psg.charStart}–{psg.charEnd} ({psg.charEnd - psg.charStart} chars)
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed font-sans font-normal italic">
                    "{psg.passageText}"
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
