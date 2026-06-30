/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Sparkles, FileText, User, MessageSquare, Brain, 
  HelpCircle, GraduationCap, ArrowRight, RotateCcw 
} from 'lucide-react';
import { DEFAULT_DOCUMENT } from './defaultDocs';
import { SessionConfig, ChatMessage, EvaluationResult } from './types';
import DocumentManager from './components/DocumentManager';
import RoleplayConfigurator from './components/RoleplayConfigurator';
import ChatRoom from './components/ChatRoom';
import EvaluationDashboard from './components/EvaluationDashboard';

type Step = 'document' | 'config' | 'chat' | 'evaluating' | 'evaluation';

export default function App() {
  const [step, setStep] = useState<Step>('document');
  const [documentText, setDocumentText] = useState<string>(DEFAULT_DOCUMENT);
  const [sessionConfig, setSessionConfig] = useState<Omit<SessionConfig, 'documentText'> | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);
  const [evalLoadingMessage, setEvalLoadingMessage] = useState('Đang tổng hợp phiên đối thoại...');

  // Start evaluating
  const handleFinishSession = async (history: ChatMessage[]) => {
    setChatHistory(history);
    setStep('evaluating');
    
    // Cycle through descriptive loading states to delight the user
    const loadingStates = [
      'Đang nạp toàn bộ lịch sử cuộc trò chuyện...',
      'Đang đối chiếu số liệu câu trả lời của bạn với tài liệu gốc...',
      'Đang đánh giá độ chính xác của các mức ưu đãi học bổng...',
      'Đang đánh giá tính thuyết phục, thấu hiểu tâm lý phụ huynh & học sinh...',
      'Đang phân tích tính chuyên nghiệp và thái độ ứng phó với câu hỏi khó...',
      'Đang hoàn thiện báo cáo phân tích, đề xuất câu trả lời mẫu tối ưu...',
    ];
    
    let stateIdx = 0;
    const interval = setInterval(() => {
      stateIdx = (stateIdx + 1) % loadingStates.length;
      setEvalLoadingMessage(loadingStates[stateIdx]);
    }, 4500);

    try {
      const response = await fetch('/api/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          config: { ...sessionConfig, documentText },
          chatHistory: history,
        }),
      });

      if (!response.ok) {
        throw new Error('Lỗi từ hệ thống khi chấm điểm đối thoại.');
      }

      const evalData = await response.json();
      setEvaluation(evalData);
      setStep('evaluation');
    } catch (err: any) {
      alert(`⚠️ Lỗi chấm điểm: ${err.message || 'Hệ thống gặp sự cố. Vui lòng thử lại.'}`);
      setStep('chat');
    } finally {
      clearInterval(interval);
    }
  };

  const handleRestart = () => {
    setSessionConfig(null);
    setChatHistory([]);
    setEvaluation(null);
    setStep('document');
  };

  // Render Stepper component
  const renderStepper = () => {
    if (step === 'evaluating') return null;
    
    const steps = [
      { id: 'document', name: 'TÀI LIỆU TUYỂN SINH', icon: FileText },
      { id: 'config', name: 'CHỌN NHÂN VẬT', icon: User },
      { id: 'chat', name: 'ĐỐI THOẠI THỰC CHIẾN', icon: MessageSquare },
      { id: 'evaluation', name: 'BÁO CÁO NĂNG LỰC', icon: Brain },
    ];

    const currentStepIndex = steps.findIndex(s => {
      if (step === 'document') return s.id === 'document';
      if (step === 'config') return s.id === 'config';
      if (step === 'chat') return s.id === 'chat';
      return s.id === 'evaluation';
    });

    return (
      <div className="max-w-4xl mx-auto mb-8 px-4">
        <div className="flex items-center justify-between relative">
          {/* Thanh nối giữa các bước */}
          <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-slate-200 -translate-y-1/2 z-0" />
          <div 
            className="absolute left-0 top-1/2 h-0.5 bg-blue-600 -translate-y-1/2 z-0 transition-all duration-500"
            style={{ width: `${(currentStepIndex / (steps.length - 1)) * 100}%` }}
          />

          {steps.map((s, idx) => {
            const StepIcon = s.icon;
            const isCompleted = idx < currentStepIndex;
            const isActive = idx === currentStepIndex;
            
            return (
              <div key={s.id} className="flex flex-col items-center relative z-10">
                <div 
                  className={`w-9 h-9 rounded flex items-center justify-center transition-all duration-300 ${
                    isCompleted 
                      ? 'bg-blue-600 text-white shadow' 
                      : isActive 
                        ? 'bg-blue-50 border-2 border-blue-600 text-blue-600 font-bold scale-105 shadow-sm' 
                        : 'bg-white border border-slate-200 text-slate-400'
                  }`}
                >
                  <StepIcon size={15} className={isActive ? 'stroke-[2.5]' : ''} />
                </div>
                <span 
                  className={`text-[10px] font-bold mt-2 hidden sm:block tracking-wider ${
                    isActive ? 'text-blue-600 font-extrabold' : 'text-slate-400'
                  }`}
                >
                  {s.name}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 font-sans text-slate-900">
      {/* Header chính */}
      <header className="bg-white border-b border-slate-200 py-4 px-6 shrink-0">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-600 rounded flex items-center justify-center text-white font-bold text-xl shadow-sm">
              <GraduationCap size={22} className="stroke-[2.5]" />
            </div>
            <div>
              <h1 className="font-display font-extrabold text-lg text-slate-900 tracking-tight flex items-center gap-1">
                ADMISSION<span className="text-blue-600">AI</span> COACH
                <span className="px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded text-[9px] font-bold border border-blue-100 uppercase tracking-widest ml-1.5">v1.0.4</span>
              </h1>
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Training Dialogue & Simulation Engine</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {step !== 'document' && step !== 'evaluating' && (
              <button
                id="btn-nav-restart"
                onClick={handleRestart}
                className="text-[11px] text-slate-600 hover:text-slate-900 font-bold uppercase tracking-wider flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded hover:bg-slate-50 transition cursor-pointer"
              >
                <RotateCcw size={12} />
                Làm mới kịch bản
              </button>
            )}
            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 hidden md:block">
              POWERED BY <span className="font-extrabold text-blue-600">GEMINI 3.5</span>
            </div>
          </div>
        </div>
      </header>

      {/* Vùng nội dung chính */}
      <main className="flex-1 py-6 px-4 md:px-6 overflow-x-hidden">
        {renderStepper()}

        {/* Luồng các bước */}
        {step === 'document' && (
          <DocumentManager 
            documentText={documentText} 
            onDocumentChange={setDocumentText} 
            onNext={() => setStep('config')} 
          />
        )}

        {step === 'config' && (
          <RoleplayConfigurator 
            onBack={() => setStep('document')} 
            onStart={(config) => {
              setSessionConfig(config);
              setStep('chat');
            }} 
          />
        )}

        {step === 'chat' && sessionConfig && (
          <ChatRoom 
            config={{ ...sessionConfig, documentText }} 
            onFinishSession={handleFinishSession}
            onCancelSession={() => setStep('config')}
          />
        )}

        {step === 'evaluating' && (
          <div id="evaluating-screen" className="flex flex-col items-center justify-center min-h-[400px] text-center max-w-md mx-auto space-y-6">
            <div className="relative">
              <div className="w-16 h-16 rounded bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center animate-pulse shadow-sm">
                <Brain size={32} className="stroke-[2.2]" />
              </div>
              <div className="absolute top-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white animate-ping" />
            </div>
            
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-900 uppercase tracking-wide">Đang chấm điểm đối thoại...</h3>
              <p className="text-slate-500 text-xs font-semibold">Hệ thống đang đối chiếu câu trả lời với tài liệu nguồn.</p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded p-4 w-full text-xs text-blue-800 font-bold flex items-center justify-center gap-2 animate-bounce">
              <Sparkles size={14} className="text-blue-600" />
              {evalLoadingMessage}
            </div>

            <p className="text-[10px] text-slate-400 uppercase tracking-wider italic">Báo cáo hiệu suất chi tiết đang được tạo ra bởi Gemini.</p>
          </div>
        )}

        {step === 'evaluation' && evaluation && (
          <EvaluationDashboard 
            evaluation={evaluation} 
            onRestart={handleRestart} 
          />
        )}
      </main>

      {/* Footer chung */}
      <footer className="bg-slate-900 border-t border-slate-800 py-3 px-6 text-center text-[10px] text-slate-400 uppercase tracking-widest shrink-0 flex flex-col sm:flex-row items-center justify-between gap-2">
        <p className="font-semibold">ADMISSION COACH TRAINING SIMULATOR • v1.0.4</p>
        <p className="font-semibold text-slate-500">Gemini 3.5 Flash Stable • React & Tailwind CSS</p>
      </footer>
    </div>
  );
}

