import React, { useState } from 'react';
import { FileText, Edit, RefreshCw, Check, BookOpen } from 'lucide-react';
import { DEFAULT_DOCUMENT } from '../defaultDocs';

interface DocumentManagerProps {
  documentText: string;
  onDocumentChange: (text: string) => void;
  onNext: () => void;
}

export default function DocumentManager({ documentText, onDocumentChange, onNext }: DocumentManagerProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [tempText, setTempText] = useState(documentText);

  const handleSave = () => {
    onDocumentChange(tempText);
    setIsEditing(false);
  };

  const handleResetDefault = () => {
    if (confirm("Bạn có chắc chắn muốn đặt lại tài liệu về chính sách học bổng Greenwich Việt Nam 2025 mặc định?")) {
      setTempText(DEFAULT_DOCUMENT);
      onDocumentChange(DEFAULT_DOCUMENT);
      setIsEditing(false);
    }
  };

  return (
    <div id="document-manager" className="bg-white rounded border border-slate-200 p-6 max-w-4xl mx-auto shadow-sm">
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-200 pb-4 mb-6">
        <div>
          <div className="flex items-center gap-1.5 text-blue-600 mb-1">
            <BookOpen size={16} className="stroke-[2.5]" />
            <span className="font-bold tracking-widest text-[10px] uppercase">Bước 1: Tài liệu tham chiếu</span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">Cấu hình dữ liệu tham chiếu</h2>
          <p className="text-slate-500 text-xs mt-1">
            Dán thông tin học phí, học bổng hoặc FAQs của trường. Gemini sẽ dùng dữ liệu này làm "nguồn sự thật" để đối sánh thông tin và chấm điểm.
          </p>
        </div>
        <div className="flex items-center gap-2 mt-4 md:mt-0">
          {isEditing ? (
            <>
              <button
                id="btn-save-doc"
                onClick={handleSave}
                className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold uppercase tracking-wider transition cursor-pointer"
              >
                <Check size={14} />
                Lưu tài liệu
              </button>
              <button
                id="btn-cancel-doc"
                onClick={() => {
                  setTempText(documentText);
                  setIsEditing(false);
                }}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded text-xs font-bold uppercase tracking-wider transition cursor-pointer"
              >
                Hủy
              </button>
            </>
          ) : (
            <>
              <button
                id="btn-edit-doc"
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-1.5 px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded text-xs font-bold uppercase tracking-wider transition cursor-pointer"
              >
                <Edit size={14} />
                Sửa tài liệu
              </button>
              {documentText !== DEFAULT_DOCUMENT && (
                <button
                  id="btn-reset-doc"
                  onClick={handleResetDefault}
                  className="flex items-center gap-1.5 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded text-xs font-bold uppercase tracking-wider transition cursor-pointer"
                  title="Đặt lại tài liệu mẫu"
                >
                  <RefreshCw size={14} />
                  Mặc định
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {isEditing ? (
        <div className="mb-6">
          <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Nội dung tài liệu tuyển sinh:</label>
          <textarea
            id="textarea-doc-content"
            value={tempText}
            onChange={(e) => setTempText(e.target.value)}
            className="w-full h-96 p-4 border border-slate-200 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 font-mono text-xs leading-relaxed text-slate-800 bg-slate-50 focus:bg-white transition"
            placeholder="Dán văn bản tuyển sinh, FAQs, học phí hay các chính sách ưu đãi của trường tại đây..."
          />
          <div className="flex justify-end text-[10px] font-mono text-slate-400 mt-2">
            Độ dài: {tempText.length} ký tự
          </div>
        </div>
      ) : (
        <div className="mb-6">
          <div className="bg-slate-50 border border-slate-200 rounded p-5 max-h-96 overflow-y-auto font-sans leading-relaxed text-slate-700">
            {documentText === DEFAULT_DOCUMENT && (
              <div className="flex items-center gap-2 mb-4 px-3 py-1.5 bg-blue-50 border border-blue-100 text-blue-700 rounded text-[11px] font-bold uppercase tracking-wider">
                <FileText size={12} />
                Đang dùng tài liệu học bổng Greenwich Việt Nam 2025
              </div>
            )}
            <pre className="whitespace-pre-wrap font-sans text-xs text-slate-600 font-normal">
              {documentText}
            </pre>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center pt-4 border-t border-slate-200">
        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Dữ liệu này được dùng làm nguồn tham chiếu tối cao.
        </div>
        <button
          id="btn-next-step"
          disabled={isEditing || !documentText.trim()}
          onClick={onNext}
          className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded text-xs font-bold uppercase tracking-wider shadow-sm transition flex items-center gap-1.5 cursor-pointer"
        >
          Tiếp theo: Chọn nhân vật
          <Check size={14} />
        </button>
      </div>
    </div>
  );
}
