import React, { useState } from 'react';
import { 
  Award, CheckCircle, AlertTriangle, XCircle, HelpCircle, 
  RotateCcw, BookOpen, ThumbsUp, ThumbsDown, MessageCircle, 
  Lightbulb, ChevronDown, ChevronUp, UserCheck, TrendingUp 
} from 'lucide-react';
import { EvaluationResult } from '../types';

interface EvaluationDashboardProps {
  evaluation: EvaluationResult;
  onRestart: () => void;
}

export default function EvaluationDashboard({ evaluation, onRestart }: EvaluationDashboardProps) {
  const [activeTab, setActiveTab] = useState<'details' | 'recs'>('details');
  const [expandedTurn, setExpandedTurn] = useState<number | null>(1); // Expand the first turn by default

  const toggleTurn = (index: number) => {
    if (expandedTurn === index) {
      setExpandedTurn(null);
    } else {
      setExpandedTurn(index);
    }
  };

  // Helper for status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'correct':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
            <CheckCircle size={12} />
            Chính xác
          </span>
        );
      case 'partially_correct':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-100">
            <AlertTriangle size={12} />
            Đúng một phần
          </span>
        );
      case 'missing_info':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-100">
            <HelpCircle size={12} />
            Thiếu thông tin
          </span>
        );
      case 'incorrect':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-100">
            <XCircle size={12} />
            Chưa chính xác
          </span>
        );
      default:
        return null;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-emerald-600';
    if (score >= 70) return 'text-blue-600';
    if (score >= 50) return 'text-amber-600';
    return 'text-rose-600';
  };

  const getScoreBg = (score: number) => {
    if (score >= 85) return 'bg-emerald-50 border-emerald-200';
    if (score >= 70) return 'bg-blue-50 border-blue-200';
    if (score >= 50) return 'bg-amber-50 border-amber-200';
    return 'bg-rose-50 border-rose-200';
  };

  const overallAverage = Math.round((evaluation.accuracyScore + evaluation.persuasionScore + evaluation.attitudeScore) / 3);

  return (
    <div id="evaluation-dashboard" className="max-w-5xl mx-auto space-y-8 pb-16">
      
      {/* Header Chúc Mừng & Điểm Trung Bình */}
      <div className="bg-slate-900 rounded border border-slate-800 p-6 md:p-8 text-white relative overflow-hidden shadow">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute left-1/3 bottom-0 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl" />
        
        <div className="relative flex flex-col md:flex-row items-center gap-6 justify-between">
          <div className="space-y-2 text-center md:text-left">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 rounded text-[10px] font-bold tracking-widest uppercase text-blue-300">
              <Award size={12} /> Hoàn thành thử thách xuất sắc
            </div>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight uppercase">Báo cáo đánh giá năng lực</h2>
            <p className="text-slate-300 max-w-xl text-xs leading-relaxed mt-2">
              Gemini đã đối chiếu chính xác câu trả lời của bạn với tài liệu tuyển sinh và phân tích thái độ ứng biến tâm lý của bạn.
            </p>
          </div>

          <div className="shrink-0 flex items-center gap-4 bg-white/5 border border-white/10 rounded p-4 md:p-5">
            <div className="text-center">
              <div className="text-[9px] uppercase tracking-widest text-slate-400 font-bold">Điểm tổng kết</div>
              <div className="text-4xl font-black mt-1 text-emerald-400">{overallAverage}<span className="text-sm text-white/50">/100</span></div>
            </div>
            <div className="h-10 w-px bg-white/15" />
            <div className="text-[11px] text-slate-300 leading-normal font-bold uppercase tracking-wider max-w-[120px]">
              {overallAverage >= 85 ? 'XUẤT SẮC' : 
               overallAverage >= 70 ? 'KHÁ TỐT' : 
               overallAverage >= 50 ? 'ĐẠT YÊU CẦU' : 'CẦN LUYỆN LẠI'}
            </div>
          </div>
        </div>
      </div>

      {/* 3 Trục Điểm Số Chi Tiết */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Điểm 1: Độ chính xác */}
        <div className={`border rounded p-5 shadow-sm transition ${getScoreBg(evaluation.accuracyScore)}`}>
          <div className="flex items-center justify-between mb-4">
            <span className="font-bold text-[10px] uppercase tracking-widest text-slate-500">Độ chính xác thông tin</span>
            <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest bg-white text-slate-600 border border-slate-200">Đối chiếu dữ liệu</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className={`text-3xl font-black ${getScoreColor(evaluation.accuracyScore)}`}>{evaluation.accuracyScore}</span>
            <span className="text-slate-400 text-xs font-semibold">/100</span>
          </div>
          <p className="text-slate-600 text-xs mt-3 leading-relaxed">
            Đánh giá việc đưa ra các con số học bổng, điều kiện đi kèm, IELTS và thời hạn chuẩn xác so với văn bản gốc.
          </p>
        </div>

        {/* Điểm 2: Độ thuyết phục */}
        <div className={`border rounded p-5 shadow-sm transition ${getScoreBg(evaluation.persuasionScore)}`}>
          <div className="flex items-center justify-between mb-4">
            <span className="font-bold text-[10px] uppercase tracking-widest text-slate-500">Độ thuyết phục & Kỹ năng</span>
            <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest bg-white text-slate-600 border border-slate-200">Tâm lý học sinh</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className={`text-3xl font-black ${getScoreColor(evaluation.persuasionScore)}`}>{evaluation.persuasionScore}</span>
            <span className="text-slate-400 text-xs font-semibold">/100</span>
          </div>
          <p className="text-slate-600 text-xs mt-3 leading-relaxed">
            Đánh giá khả năng xoa dịu lo âu, làm bật thế mạnh của trường, thu hút mối quan tâm và định hướng đúng ngành nghề.
          </p>
        </div>

        {/* Điểm 3: Thái độ ứng xử */}
        <div className={`border rounded p-5 shadow-sm transition ${getScoreBg(evaluation.attitudeScore)}`}>
          <div className="flex items-center justify-between mb-4">
            <span className="font-bold text-[10px] uppercase tracking-widest text-slate-500">Thái độ & Chuyên nghiệp</span>
            <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest bg-white text-slate-600 border border-slate-200">Kính ngữ nhã nhặn</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className={`text-3xl font-black ${getScoreColor(evaluation.attitudeScore)}`}>{evaluation.attitudeScore}</span>
            <span className="text-slate-400 text-xs font-semibold">/100</span>
          </div>
          <p className="text-slate-600 text-xs mt-3 leading-relaxed">
            Đánh giá tính kiên nhẫn, sử dụng kính ngữ nhã nhặn, cách dỗ dành, thấu hiểu người đang bực dọc hoặc rụt rè.
          </p>
        </div>
      </div>

      {/* Đánh giá chung (Feedback) & Điểm mạnh / điểm yếu */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Nhận xét tổng quát (Cột rộng) */}
        <div className="lg:col-span-2 bg-white rounded border border-slate-200 p-6 space-y-4 shadow-sm">
          <h3 className="font-bold text-xs uppercase tracking-widest text-slate-500 flex items-center gap-2">
            <MessageCircle size={16} className="text-blue-600" />
            Nhận xét tổng hợp từ hệ thống
          </h3>
          <div className="bg-slate-50 border border-slate-200 rounded p-5 text-xs leading-relaxed text-slate-700 italic font-semibold">
            "{evaluation.overallFeedback}"
          </div>
        </div>

        {/* Điểm mạnh & Điểm yếu (Cột hẹp) */}
        <div className="bg-white rounded border border-slate-200 p-6 space-y-5 shadow-sm">
          {/* Điểm mạnh */}
          <div className="space-y-2.5">
            <h4 className="font-bold text-[10px] uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
              <ThumbsUp size={12} className="text-emerald-500" />
              Điểm mạnh
            </h4>
            <ul className="space-y-1.5">
              {evaluation.strengths.map((str, idx) => (
                <li key={idx} className="text-xs text-slate-600 flex items-start gap-1.5 leading-relaxed">
                  <span className="text-emerald-500 font-bold shrink-0">✓</span>
                  {str}
                </li>
              ))}
            </ul>
          </div>

          {/* Điểm yếu */}
          <div className="space-y-2.5 pt-4 border-t border-slate-200">
            <h4 className="font-bold text-[10px] uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
              <ThumbsDown size={12} className="text-rose-500" />
              Cần cải thiện
            </h4>
            <ul className="space-y-1.5">
              {evaluation.weaknesses.map((weak, idx) => (
                <li key={idx} className="text-xs text-slate-600 flex items-start gap-1.5 leading-relaxed">
                  <span className="text-rose-400 font-bold shrink-0">!</span>
                  {weak}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Tabs chuyển đổi giữa Đánh giá từng lượt và Khuyến nghị */}
      <div className="bg-white border border-slate-200 rounded overflow-hidden shadow-sm">
        <div className="flex border-b border-slate-200 bg-slate-50">
          <button
            id="tab-turn-details"
            onClick={() => setActiveTab('details')}
            className={`flex-1 py-4 text-center text-xs font-bold uppercase tracking-wider border-b-2 transition cursor-pointer ${
              activeTab === 'details'
                ? 'border-blue-600 text-blue-600 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Đánh giá từng câu đối thoại ({evaluation.turnEvaluations.length})
          </button>
          <button
            id="tab-expert-recs"
            onClick={() => setActiveTab('recs')}
            className={`flex-1 py-4 text-center text-xs font-bold uppercase tracking-wider border-b-2 transition cursor-pointer ${
              activeTab === 'recs'
                ? 'border-blue-600 text-blue-600 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Khuyến nghị chuyên sâu
          </button>
        </div>

        {/* Nội dung TAB 1: Chi tiết từng lượt */}
        {activeTab === 'details' && (
          <div className="p-6 divide-y divide-slate-200">
            {evaluation.turnEvaluations.map((turn) => {
              const isOpen = expandedTurn === turn.questionIndex;
              return (
                <div key={turn.questionIndex} className="py-4 first:pt-0 last:pb-0">
                  {/* Thanh tiêu đề rút gọn bấm được */}
                  <div 
                    onClick={() => toggleTurn(turn.questionIndex)}
                    className="flex items-start justify-between gap-4 cursor-pointer hover:bg-slate-50 p-2 rounded transition"
                  >
                    <div className="flex gap-3 items-start">
                      <div className="w-6 h-6 rounded bg-slate-900 flex items-center justify-center text-[10px] font-bold text-white shrink-0 mt-0.5">
                        {turn.questionIndex}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-800 line-clamp-1">{turn.question}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">Trả lời: {turn.userAnswer}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 shrink-0">
                      {getStatusBadge(turn.status)}
                      {isOpen ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
                    </div>
                  </div>

                  {/* Nội dung chi tiết mở rộng */}
                  {isOpen && (
                    <div className="mt-4 ml-9 space-y-4 border-l-2 border-slate-200 pl-5 pt-1">
                      {/* Cụm đối thoại */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                        <div className="bg-slate-100 rounded p-3 border border-slate-200">
                          <strong className="text-red-600 block mb-1 text-[10px] uppercase tracking-widest">💬 Câu hỏi của nhân vật:</strong>
                          <p className="text-slate-700 leading-relaxed font-normal">{turn.question}</p>
                        </div>
                        <div className="bg-blue-50 border border-blue-100 rounded p-3">
                          <strong className="text-blue-700 block mb-1 text-[10px] uppercase tracking-widest">✍️ Trả lời của bạn:</strong>
                          <p className="text-slate-700 leading-relaxed font-normal">{turn.userAnswer || '(Không trả lời hoặc bị bỏ trống)'}</p>
                        </div>
                      </div>

                      {/* Phân tích lỗi sai */}
                      <div className="text-sm leading-relaxed">
                        <h5 className="font-bold text-[10px] uppercase tracking-widest text-slate-400 mb-1 flex items-center gap-1.5">
                          <AlertTriangle size={12} className="text-amber-500" />
                          Nhận xét & phân tích chi tiết
                        </h5>
                        <p className="text-slate-600 text-xs leading-relaxed font-normal">{turn.analysis}</p>
                      </div>

                      {/* Câu trả lời mẫu bám sát tài liệu */}
                      <div className="bg-emerald-50 border border-emerald-100 rounded p-4">
                        <h5 className="font-bold text-emerald-800 text-[10px] uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                          <CheckCircle size={12} className="text-emerald-600" />
                          Gợi ý câu trả lời mẫu bám sát tài liệu
                        </h5>
                        <p className="text-slate-600 text-xs leading-relaxed font-sans">{turn.sampleAnswer}</p>
                      </div>

                      {/* Mẹo ứng phó tâm lý */}
                      <div className="bg-purple-50 border border-purple-100 rounded p-4">
                        <h5 className="font-bold text-purple-800 text-[10px] uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                          <Lightbulb size={12} className="text-purple-600" />
                          Mẹo xử lý với kiểu câu hỏi / thái độ này
                        </h5>
                        <p className="text-slate-600 text-xs leading-relaxed font-sans">{turn.handlingTip}</p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Nội dung TAB 2: Khuyến nghị chuyên sâu */}
        {activeTab === 'recs' && (
          <div className="p-6 space-y-6">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-50 rounded text-blue-600 shrink-0 mt-0.5">
                <TrendingUp size={18} />
              </div>
              <div>
                <h4 className="font-bold text-slate-800 text-sm uppercase tracking-wider">Lời khuyên cải thiện tỷ lệ tư vấn thành công</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">Dưới đây là một số chiến thuật thiết thực được đề xuất riêng dựa trên câu trả lời trong phiên này của bạn.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {evaluation.recommendations.map((rec, idx) => (
                <div key={idx} className="bg-slate-50 rounded p-5 border border-slate-200 hover:border-blue-200 transition group">
                  <div className="w-8 h-8 rounded bg-white text-blue-600 flex items-center justify-center font-bold text-xs mb-3 shadow-sm border border-slate-200 group-hover:bg-blue-600 group-hover:text-white transition duration-300 font-mono">
                    {idx + 1}
                  </div>
                  <p className="text-slate-600 text-xs leading-relaxed font-normal">{rec}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer restart */}
      <div className="flex justify-center">
        <button
          id="btn-restart-practice"
          onClick={onRestart}
          className="flex items-center gap-2 px-8 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-bold uppercase tracking-wider transition cursor-pointer shadow"
        >
          <RotateCcw size={14} />
          Luyện tập phiên mới
        </button>
      </div>

    </div>
  );
}
