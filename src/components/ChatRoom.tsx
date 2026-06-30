import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, Users, User, ArrowRight, Brain, AlertCircle, 
  HelpCircle, ShieldAlert, Sparkles, LogOut, CheckCircle 
} from 'lucide-react';
import { ChatMessage, SessionConfig } from '../types';

interface ChatRoomProps {
  config: SessionConfig;
  onFinishSession: (chatHistory: ChatMessage[]) => void;
  onCancelSession: () => void;
}

export default function ChatRoom({ config, onFinishSession, onCancelSession }: ChatRoomProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentEmotion, setCurrentEmotion] = useState('Đang kết nối...');
  const [isFinishing, setIsFinishing] = useState(false);
  
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Initialize the conversation on mount
  useEffect(() => {
    const initSession = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/init-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(config),
        });
        
        if (!response.ok) {
          throw new Error('Lỗi từ máy chủ khi khởi tạo cuộc đối thoại.');
        }
        
        const data = await response.json();
        
        const firstMsg: ChatMessage = {
          sender: 'gemini',
          text: data.reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          metadata: data.metadata,
        };
        
        setMessages([firstMsg]);
        if (data.metadata?.emotion) {
          setCurrentEmotion(data.metadata.emotion);
        }
      } catch (err: any) {
        console.error(err);
        setMessages([
          {
            sender: 'gemini',
            text: `⚠️ Lỗi kết nối đến dịch vụ AI: ${err.message || 'Vui lòng kiểm tra khóa API và kết nối mạng.'}`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          }
        ]);
        setCurrentEmotion('Lỗi kết nối');
      } finally {
        setIsLoading(false);
      }
    };

    initSession();
  }, [config]);

  // Scroll to bottom whenever messages change
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading) return;

    const userText = inputText.trim();
    setInputText('');

    const userMsg: ChatMessage = {
      sender: 'user',
      text: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          config,
          chatHistory: updatedMessages,
          userMessage: userText,
        }),
      });

      if (!response.ok) {
        throw new Error('Lỗi xử lý phản hồi từ AI.');
      }

      const data = await response.json();
      
      const geminiMsg: ChatMessage = {
        sender: 'gemini',
        text: data.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        metadata: data.metadata,
      };

      setMessages(prev => [...prev, geminiMsg]);
      if (data.metadata?.emotion) {
        setCurrentEmotion(data.metadata.emotion);
      }
    } catch (err: any) {
      console.error(err);
      setMessages(prev => [
        ...prev,
        {
          sender: 'gemini',
          text: `⚠️ Lỗi xử lý đối thoại: ${err.message || 'Vui lòng thử lại.'}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Turn count based on user responses
  const turnCount = messages.filter(m => m.sender === 'user').length;
  const isOptimalLength = turnCount >= 5;

  const handleFinish = async () => {
    if (turnCount === 0) {
      alert("Vui lòng trả lời câu hỏi của nhân vật ít nhất một lượt trước khi kết thúc.");
      return;
    }
    
    if (turnCount < 4) {
      const confirmEarly = confirm(`Bạn mới tư vấn được ${turnCount} lượt đối thoại. Để việc chấm điểm đạt kết quả tốt nhất, bạn nên thực hiện khoảng 5-6 lượt. Bạn vẫn muốn kết thúc sớm chứ?`);
      if (!confirmEarly) return;
    }

    setIsFinishing(true);
    onFinishSession(messages);
  };

  // Helpers for display metadata labels
  const getPersonalityBadgeColor = (p: string) => {
    switch (p) {
      case 'friendly': return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
      case 'difficult': return 'bg-amber-50 text-amber-700 border border-amber-200';
      case 'angry': return 'bg-rose-50 text-rose-700 border border-rose-200';
      case 'shy': return 'bg-purple-50 text-purple-700 border border-purple-200';
      case 'skeptical': return 'bg-blue-50 text-blue-700 border border-blue-200';
      case 'indecisive': return 'bg-teal-50 text-teal-700 border border-teal-200';
      default: return 'bg-slate-50 text-slate-700 border border-slate-200';
    }
  };

  const getPersonalityLabel = (p: string) => {
    switch (p) {
      case 'friendly': return 'Thân thiện';
      case 'difficult': return 'Khó tính';
      case 'angry': return 'Cáu gắt';
      case 'shy': return 'Rụt rè';
      case 'skeptical': return 'Hoài nghi';
      case 'indecisive': return 'Lưỡng lự';
      default: return p;
    }
  };

  const getEmotionEmoji = (emotion: string) => {
    const e = emotion.toLowerCase();
    if (e.includes('cáu') || e.includes('bực') || e.includes('giận')) return '😡';
    if (e.includes('rụt') || e.includes('e dè') || e.includes('ngại') || e.includes('nhút')) return '🥺';
    if (e.includes('hoài') || e.includes('nghi') || e.includes('dò') || e.includes('xét')) return '🧐';
    if (e.includes('lưỡng') || e.includes('băn') || e.includes('phân') || e.includes('vân')) return '🤔';
    if (e.includes('hài') || e.includes('vui') || e.includes('háo') || e.includes('mừng')) return '😊';
    return '👤';
  };

  return (
    <div id="chat-room" className="grid grid-cols-1 lg:grid-cols-4 gap-6 max-w-6xl mx-auto h-[calc(100vh-140px)] min-h-[550px]">
      {/* Cột trái: Hồ sơ nhân vật đóng vai */}
      <div className="lg:col-span-1 bg-white rounded border border-slate-200 p-5 flex flex-col justify-between shadow-sm">
        <div className="space-y-6">
          <div className="text-center pb-5 border-b border-slate-200">
            <div className="w-16 h-16 mx-auto bg-slate-900 rounded flex items-center justify-center text-white text-3xl font-bold shadow-sm relative">
              {config.role === 'parent' ? <Users size={28} /> : <User size={28} />}
              <span className="absolute -bottom-1 -right-1 text-xl" title={`Cảm xúc: ${currentEmotion}`}>
                {getEmotionEmoji(currentEmotion)}
              </span>
            </div>
            <h3 className="text-base font-bold text-slate-800 mt-4 uppercase tracking-wide">
              {config.role === 'parent' ? 'Phụ huynh học sinh' : 'Học sinh lớp 12'}
            </h3>
            <span className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest mt-2 ${getPersonalityBadgeColor(config.personality)}`}>
              TÍNH CÁCH: {getPersonalityLabel(config.personality)}
            </span>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <span className="block text-slate-400 text-[10px] font-bold uppercase tracking-widest">Ngành học quan tâm</span>
              <span className="text-slate-700 font-bold block mt-1 uppercase tracking-wide">{config.targetMajor}</span>
            </div>
            <div>
              <span className="block text-slate-400 text-[10px] font-bold uppercase tracking-widest">Cảm xúc hiện tại</span>
              <span className="text-slate-800 font-bold flex items-center gap-1.5 mt-1">
                <span className="text-sm">{getEmotionEmoji(currentEmotion)}</span>
                {currentEmotion}
              </span>
            </div>
            <div>
              <span className="block text-slate-400 text-[10px] font-bold uppercase tracking-widest">Cấu hình độ khó</span>
              <span className="text-slate-700 font-bold block mt-1 uppercase tracking-wide">
                {config.difficulty === 'only_docs' ? 'BÁM SÁT TÀI LIỆU' : 'XEN KẼ NGOÀI THỰC TẾ'}
              </span>
            </div>
            <div>
              <span className="block text-slate-400 text-[10px] font-bold uppercase tracking-widest">Tiến trình tư vấn</span>
              <div className="flex items-center gap-2 mt-1.5">
                <div className="flex-1 bg-slate-100 rounded-none h-1.5">
                  <div 
                    className="bg-blue-600 h-1.5 rounded-none transition-all duration-300" 
                    style={{ width: `${Math.min((turnCount / 6) * 100, 100)}%` }}
                  />
                </div>
                <span className="font-bold text-slate-700 text-[10px] shrink-0 font-mono">{turnCount}/6 LƯỢT</span>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-5 border-t border-slate-200 space-y-2">
          <button
            id="btn-evaluate-session"
            onClick={handleFinish}
            disabled={turnCount === 0 || isFinishing}
            className={`w-full py-2.5 text-xs font-bold uppercase tracking-widest rounded flex items-center justify-center gap-2 shadow transition cursor-pointer ${
              isOptimalLength 
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white' 
                : 'bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50'
            }`}
          >
            <Brain size={14} />
            {isOptimalLength ? 'NỘP BÀI & CHẤM ĐIỂM' : 'NỘP BÀI CHẤM ĐIỂM'}
          </button>
          
          <button
            id="btn-cancel-session"
            onClick={onCancelSession}
            className="w-full py-2 text-[10px] text-slate-400 hover:bg-slate-100 hover:text-slate-700 rounded transition text-center font-bold uppercase tracking-widest cursor-pointer border border-transparent hover:border-slate-200"
          >
            Hủy phiên & Quay lại
          </button>
        </div>
      </div>

      {/* Cột phải: Vùng trò chuyện chính */}
      <div className="lg:col-span-3 bg-white rounded border border-slate-200 flex flex-col justify-between overflow-hidden h-full relative shadow-sm">
        {/* Thanh tiêu đề chat */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-ping" />
            <div>
              <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Phiên đối thoại mô phỏng đang diễn ra</h4>
              <p className="text-[11px] text-slate-500 font-medium">Đưa ra các thông tin chi phí, điều kiện học bổng chính xác dựa trên tài liệu.</p>
            </div>
          </div>
          {isOptimalLength && (
            <span className="hidden sm:inline-flex items-center gap-1 text-[10px] text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
              <CheckCircle size={10} /> Đủ lượt tư vấn
            </span>
          )}
        </div>

        {/* Nội dung tin nhắn chat */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-slate-50/50">
          {messages.length === 0 && isLoading && (
            <div className="flex flex-col items-center justify-center h-full space-y-4 text-slate-400">
              <div className="animate-spin rounded h-6 w-6 border-t-2 border-b-2 border-blue-600" />
              <p className="text-xs uppercase tracking-widest font-bold">Đang kết nối nhân vật...</p>
            </div>
          )}

          {messages.map((msg, idx) => {
            const isAI = msg.sender === 'gemini';
            return (
              <div 
                key={idx} 
                className={`flex flex-col max-w-[85%] ${isAI ? 'items-start mr-auto' : 'items-end self-end ml-auto'}`}
              >
                {/* Tên người gửi kiểu Geometric Balance */}
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-[10px] font-bold uppercase tracking-widest ${isAI ? 'text-red-600' : 'text-blue-600'}`}>
                    {isAI 
                      ? `Gemini (${getPersonalityLabel(config.personality)} ${config.role === 'parent' ? 'Phụ huynh' : 'Học sinh'})` 
                      : 'Bạn (Tư vấn viên)'}
                  </span>
                </div>

                <div className="space-y-1 w-full">
                  <div className={`p-4 text-sm leading-relaxed ${
                    isAI 
                      ? 'bg-slate-100 text-slate-900 rounded rounded-tl-none border border-slate-200' 
                      : 'bg-blue-600 text-white rounded rounded-tr-none shadow-sm font-medium'
                  }`}>
                    {msg.text}
                  </div>
                  
                  <div className={`flex items-center gap-2 text-[10px] text-slate-400 font-mono ${!isAI ? 'justify-end' : ''}`}>
                    <span>{msg.timestamp}</span>
                    {isAI && msg.metadata && (
                      <>
                        <span>•</span>
                        {msg.metadata.trickyQuestion ? (
                          <span className="text-rose-700 font-bold bg-rose-50 border border-rose-100 px-1 py-0.2 rounded text-[9px] uppercase tracking-wider flex items-center gap-0.5">
                            <ShieldAlert size={10} /> Hỏi hóc búa
                          </span>
                        ) : msg.metadata.documentStick ? (
                          <span className="text-blue-700 font-bold bg-blue-50 border border-blue-100 px-1 py-0.2 rounded text-[9px] uppercase tracking-wider flex items-center gap-0.5">
                            <Brain size={10} /> Khớp tài liệu
                          </span>
                        ) : null}
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Hiệu ứng gõ chữ của AI */}
          {isLoading && messages.length > 0 && (
            <div className="flex flex-col max-w-[80%] items-start mr-auto">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  Đối phương đang gõ...
                </span>
              </div>
              <div className="bg-slate-100 border border-slate-200 rounded rounded-tl-none px-4 py-3 shadow-sm">
                <div className="flex gap-1 items-center h-4">
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                </div>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Form nhập tin nhắn */}
        <div className="bg-white border-t border-slate-200 p-4">
          <form onSubmit={handleSendMessage} className="flex gap-2.5 items-center">
            <input
              type="text"
              id="input-chat-message"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={isLoading ? 'Đang chờ phản hồi của người hỏi...' : 'Nhập câu trả lời tư vấn của bạn (hãy bám sát thông tin học phí, học bổng)...'}
              disabled={isLoading}
              className="flex-1 px-4 h-11 text-xs border border-slate-200 focus:border-blue-600 rounded focus:outline-none transition disabled:bg-slate-50"
            />
            <button
              type="submit"
              id="btn-send-message"
              disabled={!inputText.trim() || isLoading}
              className="h-11 px-5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded font-bold text-xs uppercase tracking-wider shadow transition flex items-center justify-center shrink-0 cursor-pointer"
            >
              <Send size={14} className="mr-1.5" />
              Gửi
            </button>
          </form>
          <div className="flex justify-between items-center mt-2 px-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            <span>Mẹo: Trả lời lịch sự, đầy đủ số liệu chính xác để được điểm tối đa.</span>
            <span>Số lượt: <strong className="text-slate-700 font-mono">{turnCount}</strong> / 6 khuyến khích</span>
          </div>
        </div>
      </div>
    </div>
  );
}
