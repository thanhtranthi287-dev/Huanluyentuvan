import React, { useState } from 'react';
import { 
  User, Users, ShieldAlert, Sparkles, AlertTriangle, 
  Smile, HelpCircle, GraduationCap, ChevronRight, ArrowLeft 
} from 'lucide-react';
import { Role, Personality, Difficulty, SessionConfig } from '../types';

interface RoleplayConfiguratorProps {
  onBack: () => void;
  onStart: (config: Omit<SessionConfig, 'documentText'>) => void;
}

const personalities = [
  {
    id: 'friendly' as Personality,
    name: 'Thân thiện, cởi mở',
    desc: 'Hợp tác, dễ mến, thái độ tích cực nhưng vẫn muốn tìm hiểu kỹ mọi quyền lợi.',
    icon: Smile,
    color: 'border-emerald-200 bg-emerald-50/20 text-emerald-700 hover:border-emerald-300',
    activeColor: 'border-emerald-500 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-500/20',
  },
  {
    id: 'difficult' as Personality,
    name: 'Khó tính, tỉ mỉ',
    desc: 'Yêu cầu thông tin chi tiết từng số liệu, điều khoản, không thích giải đáp hời hợt.',
    icon: GraduationCap,
    color: 'border-amber-200 bg-amber-50/20 text-amber-700 hover:border-amber-300',
    activeColor: 'border-amber-500 bg-amber-50 text-amber-800 ring-2 ring-amber-500/20',
  },
  {
    id: 'angry' as Personality,
    name: 'Cáu gắt, nóng nảy',
    desc: 'Dễ bực bội, cộc lốc, hay phàn nàn về chi phí, đòi hỏi giải quyết ngay lập tức.',
    icon: ShieldAlert,
    color: 'border-rose-200 bg-rose-50/20 text-rose-700 hover:border-rose-300',
    activeColor: 'border-rose-500 bg-rose-50 text-rose-800 ring-2 ring-rose-500/20',
  },
  {
    id: 'shy' as Personality,
    name: 'Rụt rè, ngập ngừng',
    desc: 'Nhút nhát, nói năng e dè, ngập ngừng, cần được chủ động mở lời và động viên.',
    icon: HelpCircle,
    color: 'border-purple-200 bg-purple-50/20 text-purple-700 hover:border-purple-300',
    activeColor: 'border-purple-500 bg-purple-50 text-purple-800 ring-2 ring-purple-500/20',
  },
  {
    id: 'skeptical' as Personality,
    name: 'Hoài nghi, vặn vẹo',
    desc: 'Luôn nghi ngờ thông tin, thích so sánh gay gắt với các trường khác, đòi cam kết.',
    icon: AlertTriangle,
    color: 'border-blue-200 bg-blue-50/20 text-blue-700 hover:border-blue-300',
    activeColor: 'border-blue-500 bg-blue-50 text-blue-800 ring-2 ring-blue-500/20',
  },
  {
    id: 'indecisive' as Personality,
    name: 'Lưỡng lự, phân vân',
    desc: 'Thiếu quyết đoán, băn khoăn nhiều hướng đi, liên tục hỏi lời khuyên cá nhân.',
    icon: Sparkles,
    color: 'border-teal-200 bg-teal-50/20 text-teal-700 hover:border-teal-300',
    activeColor: 'border-teal-500 bg-teal-50 text-teal-800 ring-2 ring-teal-500/20',
  },
];

const majors = [
  'Công nghệ thông tin (IT)',
  'Quản trị kinh doanh',
  'Thiết kế đồ họa',
  'Truyền thông đa phương tiện',
  'Quản trị sự kiện / Marketing',
];

export default function RoleplayConfigurator({ onBack, onStart }: RoleplayConfiguratorProps) {
  const [role, setRole] = useState<Role>('parent');
  const [personality, setPersonality] = useState<Personality>('difficult');
  const [difficulty, setDifficulty] = useState<Difficulty>('mix_external');
  const [targetMajor, setTargetMajor] = useState(majors[0]);
  const [customMajor, setCustomMajor] = useState('');
  const [isCustomMajorActive, setIsCustomMajorActive] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onStart({
      role,
      personality,
      difficulty,
      targetMajor: isCustomMajorActive ? customMajor : targetMajor,
    });
  };

  return (
    <div id="roleplay-configurator" className="max-w-4xl mx-auto bg-white rounded border border-slate-200 p-6 md:p-8 shadow-sm">
      <div className="flex items-center gap-1.5 text-blue-600 mb-1">
        <Sparkles size={16} className="stroke-[2.5]" />
        <span className="font-bold tracking-widest text-[10px] uppercase">Bước 2: Thiết lập kịch bản đóng vai</span>
      </div>
      <h2 className="text-xl font-bold tracking-tight text-slate-900">Tùy chọn nhân vật tư vấn</h2>
      <p className="text-slate-500 text-xs mt-1 mb-8">
        Lựa chọn vai vế, tính cách và độ khó của người hỏi để xây dựng một thử thách rèn luyện sát thực tế nhất.
      </p>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Vai trò */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">
            1. Bạn muốn đối thoại với ai?
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              type="button"
              id="role-parent"
              onClick={() => setRole('parent')}
              className={`flex items-center gap-4 p-4 rounded border text-left transition cursor-pointer ${
                role === 'parent'
                  ? 'border-blue-600 bg-blue-50/50 text-blue-900 ring-1 ring-blue-600/10 font-semibold'
                  : 'border-slate-200 hover:border-slate-300 text-slate-600'
              }`}
            >
              <div className={`p-3 rounded ${role === 'parent' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                <Users size={18} />
              </div>
              <div>
                <div className="font-bold text-sm text-slate-800 uppercase tracking-wider">Phụ huynh học sinh</div>
                <div className="text-[11px] text-slate-500 mt-0.5">Lo lắng học phí, bằng cấp và tương lai việc làm của con</div>
              </div>
            </button>

            <button
              type="button"
              id="role-student"
              onClick={() => setRole('student')}
              className={`flex items-center gap-4 p-4 rounded border text-left transition cursor-pointer ${
                role === 'student'
                  ? 'border-blue-600 bg-blue-50/50 text-blue-900 ring-1 ring-blue-600/10 font-semibold'
                  : 'border-slate-200 hover:border-slate-300 text-slate-600'
              }`}
            >
              <div className={`p-3 rounded ${role === 'student' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                <User size={18} />
              </div>
              <div>
                <div className="font-bold text-sm text-slate-800 uppercase tracking-wider">Học sinh lớp 12</div>
                <div className="text-[11px] text-slate-500 mt-0.5">Quan tâm môi trường học, đời sống sinh viên, ngành học</div>
              </div>
            </button>
          </div>
        </div>

        {/* Ngành học quan tâm */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">
            2. Ngành học quan tâm tư vấn
          </label>
          <div className="flex flex-wrap gap-2 mb-3">
            {majors.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => {
                  setTargetMajor(m);
                  setIsCustomMajorActive(false);
                }}
                className={`px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wider transition border cursor-pointer ${
                  !isCustomMajorActive && targetMajor === m
                    ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                    : 'bg-white border-slate-200 hover:border-slate-300 text-slate-600'
                }`}
              >
                {m}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setIsCustomMajorActive(true)}
              className={`px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wider transition border cursor-pointer ${
                isCustomMajorActive
                  ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                  : 'bg-white border-slate-200 hover:border-slate-300 text-slate-600'
              }`}
            >
              Ngành khác...
            </button>
          </div>

          {isCustomMajorActive && (
            <input
              type="text"
              required
              id="input-custom-major"
              value={customMajor}
              onChange={(e) => setCustomMajor(e.target.value)}
              placeholder="Nhập tên ngành học khác (ví dụ: Công nghệ sinh học, Logistics...)"
              className="w-full max-w-md px-4 py-2 border border-slate-200 rounded text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          )}
        </div>

        {/* Tính cách nhân vật */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">
            3. Thiết lập tính cách của người hỏi
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {personalities.map((p) => {
              const IconComp = p.icon;
              const isActive = personality === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPersonality(p.id)}
                  className={`flex items-start gap-3.5 p-4 rounded border text-left transition cursor-pointer ${
                    isActive ? p.activeColor : p.color + ' border-slate-200'
                  }`}
                >
                  <div className={`p-2 rounded mt-0.5 ${isActive ? 'bg-blue-600 text-white' : 'bg-slate-100/80 text-slate-500'}`}>
                    <IconComp size={16} />
                  </div>
                  <div>
                    <div className="font-bold text-slate-800 text-xs uppercase tracking-wider leading-tight">{p.name}</div>
                    <div className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">{p.desc}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Mức độ khó */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">
            4. Chọn mức độ khó của phiên tư vấn
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              type="button"
              id="difficulty-only-docs"
              onClick={() => setDifficulty('only_docs')}
              className={`p-4 rounded border text-left transition cursor-pointer ${
                difficulty === 'only_docs'
                  ? 'border-blue-600 bg-blue-50/50 text-blue-900 ring-1 ring-blue-600/10 font-semibold'
                  : 'border-slate-200 hover:border-slate-300 text-slate-600'
              }`}
            >
              <div className="font-bold text-xs uppercase tracking-wider text-slate-800">Dễ: Chỉ hỏi bám sát tài liệu</div>
              <div className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">
                Nhân vật chỉ đặt những câu hỏi mà câu trả lời có sẵn hoàn toàn trong tài liệu bạn đã cung cấp. Thử thách khả năng nhớ và tra cứu văn bản.
              </div>
            </button>

            <button
              type="button"
              id="difficulty-mix-external"
              onClick={() => setDifficulty('mix_external')}
              className={`p-4 rounded border text-left transition cursor-pointer ${
                difficulty === 'mix_external'
                  ? 'border-blue-600 bg-blue-50/50 text-blue-900 ring-1 ring-blue-600/10 font-semibold'
                  : 'border-slate-200 hover:border-slate-300 text-slate-600'
              }`}
            >
              <div className="font-bold text-xs uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                Khó: Đan xen câu hỏi ngoài thực tế
                <span className="px-1.5 py-0.5 bg-rose-100 text-rose-700 rounded text-[9px] font-bold">KHUYÊN DÙNG</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">
                Nhân vật sẽ bám sát tài liệu đồng thời xen kẽ những câu hỏi hóc búa (so sánh đối thủ, chê đắt đỏ, hoài nghi việc làm, thái độ nản chí) để thử thách bản lĩnh tư vấn viên.
              </div>
            </button>
          </div>
        </div>

        {/* Nút điều hướng */}
        <div className="flex justify-between items-center pt-6 border-t border-slate-200">
          <button
            type="button"
            id="btn-back-to-doc"
            onClick={onBack}
            className="flex items-center gap-1.5 px-4 py-2 text-slate-600 hover:bg-slate-100 rounded text-xs font-bold uppercase tracking-wider transition cursor-pointer"
          >
            <ArrowLeft size={14} />
            Quay lại tài liệu
          </button>
          
          <button
            type="submit"
            id="btn-start-roleplay"
            className="flex items-center gap-1.5 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold uppercase tracking-wider shadow transition cursor-pointer"
          >
            Bắt đầu đối thoại tuyển sinh
            <ChevronRight size={16} />
          </button>
        </div>
      </form>
    </div>
  );
}
