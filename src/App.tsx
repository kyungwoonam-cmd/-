import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, FileText, History, Plus, Trash2, Save, Send } from 'lucide-react';
import { format, parseISO } from 'date-fns';

type Hire = {
  id: number;
  name: string;
  email: string;
  phone: string;
  join_date: string;
  department: string;
};

type Template = {
  id: number;
  days_before: number;
  type: 'email' | 'kakao';
  subject: string | null;
  body: string;
};

type Log = {
  id: number;
  hire_name: string;
  days_before: number;
  type: string;
  status: string;
  message: string;
  sent_at: string;
};

export default function App() {
  const [activeTab, setActiveTab] = useState<'hires' | 'templates' | 'logs'>('hires');
  const [hires, setHires] = useState<Hire[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [logs, setLogs] = useState<Log[]>([]);

  // New Hire Form State
  const [newHire, setNewHire] = useState({ name: '', email: '', phone: '', join_date: '', department: '' });

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    if (activeTab === 'hires') {
      const res = await axios.get('/api/hires');
      setHires(res.data);
    } else if (activeTab === 'templates') {
      const res = await axios.get('/api/templates');
      setTemplates(res.data);
    } else if (activeTab === 'logs') {
      const res = await axios.get('/api/logs');
      setLogs(res.data);
    }
  };

  const handleAddHire = async (e: React.FormEvent) => {
    e.preventDefault();
    await axios.post('/api/hires', newHire);
    setNewHire({ name: '', email: '', phone: '', join_date: '', department: '' });
    fetchData();
  };

  const handleDeleteHire = async (id: number) => {
    if (confirm('정말 삭제하시겠습니까?')) {
      await axios.delete(`/api/hires/${id}`);
      fetchData();
    }
  };

  const handleUpdateTemplate = async (id: number, subject: string | null, body: string) => {
    await axios.put(`/api/templates/${id}`, { subject, body });
    alert('템플릿이 저장되었습니다.');
    fetchData();
  };

  const handleManualTrigger = async () => {
    if (confirm('오늘 발송 예정인 메시지를 수동으로 발송하시겠습니까? (이미 발송된 경우 중복 발송될 수 있습니다)')) {
      await axios.post('/api/trigger');
      alert('발송 처리가 완료되었습니다.');
      if (activeTab === 'logs') fetchData();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Send className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-gray-900">Onboarding Notifier</h1>
          </div>
          <button
            onClick={handleManualTrigger}
            className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 transition-colors text-sm font-medium"
          >
            <Send className="w-4 h-4" />
            수동 발송 테스트
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-xl mb-8 w-fit">
          <button
            onClick={() => setActiveTab('hires')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'hires' ? 'bg-white shadow-sm text-blue-700' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Users className="w-4 h-4" />
            신규 입사자 관리
          </button>
          <button
            onClick={() => setActiveTab('templates')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'templates' ? 'bg-white shadow-sm text-blue-700' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <FileText className="w-4 h-4" />
            메시지 템플릿
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'logs' ? 'bg-white shadow-sm text-blue-700' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <History className="w-4 h-4" />
            발송 내역
          </button>
        </div>

        {/* Content */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          {activeTab === 'hires' && (
            <div className="p-6">
              <div className="mb-8">
                <h2 className="text-lg font-semibold mb-4">입사자 추가</h2>
                <form onSubmit={handleAddHire} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">이름</label>
                    <input required type="text" value={newHire.name} onChange={e => setNewHire({...newHire, name: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500" placeholder="홍길동" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">이메일</label>
                    <input required type="email" value={newHire.email} onChange={e => setNewHire({...newHire, email: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500" placeholder="hong@example.com" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">연락처</label>
                    <input required type="tel" value={newHire.phone} onChange={e => setNewHire({...newHire, phone: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500" placeholder="010-1234-5678" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">입사 예정일</label>
                    <input required type="date" value={newHire.join_date} onChange={e => setNewHire({...newHire, join_date: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500" />
                  </div>
                  <button type="submit" className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors font-medium">
                    <Plus className="w-4 h-4" />
                    추가
                  </button>
                </form>
              </div>

              <div>
                <h2 className="text-lg font-semibold mb-4">입사자 목록</h2>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">이름</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">연락처 정보</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">입사 예정일</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">관리</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {hires.length === 0 ? (
                        <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-500">등록된 입사자가 없습니다.</td></tr>
                      ) : hires.map((hire) => (
                        <tr key={hire.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{hire.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{hire.email}</div>
                            <div className="text-sm text-gray-500">{hire.phone}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {format(parseISO(hire.join_date), 'yyyy년 MM월 dd일')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button onClick={() => handleDeleteHire(hire.id)} className="text-red-600 hover:text-red-900 p-2 rounded-full hover:bg-red-50 transition-colors">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'templates' && (
            <div className="p-6">
              <div className="mb-6">
                <h2 className="text-lg font-semibold">메시지 템플릿 설정</h2>
                <p className="text-sm text-gray-500 mt-1">
                  입사 15일 전, 10일 전, 5일 전에 발송될 이메일과 카카오톡 메시지를 설정합니다.<br/>
                  <code className="bg-gray-100 px-1 py-0.5 rounded text-blue-600">{'{{name}}'}</code> 태그를 사용하면 입사자 이름으로 자동 변환됩니다.
                </p>
              </div>

              <div className="space-y-8">
                {[15, 10, 5].map(days => (
                  <div key={days} className="border border-gray-200 rounded-xl overflow-hidden">
                    <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                      <h3 className="font-semibold text-gray-900">D-{days} 입사 전 안내</h3>
                    </div>
                    <div className="p-4 grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Email Template */}
                      {templates.filter(t => t.days_before === days && t.type === 'email').map(template => (
                        <TemplateEditor key={template.id} template={template} onSave={handleUpdateTemplate} />
                      ))}
                      {/* Kakao Template */}
                      {templates.filter(t => t.days_before === days && t.type === 'kakao').map(template => (
                        <TemplateEditor key={template.id} template={template} onSave={handleUpdateTemplate} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'logs' && (
            <div className="p-6">
              <h2 className="text-lg font-semibold mb-4">최근 발송 내역</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">발송 일시</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">수신자</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">유형</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">시점</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">상태</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {logs.length === 0 ? (
                      <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">발송 내역이 없습니다.</td></tr>
                    ) : logs.map((log) => (
                      <tr key={log.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {format(new Date(log.sent_at), 'yyyy-MM-dd HH:mm')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{log.hire_name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full font-medium ${
                            log.type === 'email' ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {log.type === 'email' ? '이메일' : '카카오톡'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">D-{log.days_before}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {log.status === 'success' ? (
                            <span className="text-green-600 font-medium">성공</span>
                          ) : (
                            <span className="text-red-600 font-medium" title={log.message}>실패</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function TemplateEditor({ template, onSave }: { template: Template, onSave: (id: number, subject: string | null, body: string) => void }) {
  const [subject, setSubject] = useState(template.subject || '');
  const [body, setBody] = useState(template.body);

  return (
    <div className="flex flex-col h-full bg-white rounded-lg border border-gray-200 shadow-sm">
      <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex justify-between items-center rounded-t-lg">
        <span className="font-medium text-sm text-gray-700 flex items-center gap-2">
          {template.type === 'email' ? (
            <><div className="w-2 h-2 rounded-full bg-blue-500"></div> 이메일 템플릿</>
          ) : (
            <><div className="w-2 h-2 rounded-full bg-yellow-400"></div> 카카오톡 템플릿</>
          )}
        </span>
      </div>
      <div className="p-4 flex-1 flex flex-col gap-3">
        {template.type === 'email' && (
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">제목</label>
            <input
              type="text"
              value={subject}
              onChange={e => setSubject(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        )}
        <div className="flex-1 flex flex-col">
          <label className="block text-xs font-medium text-gray-500 mb-1">내용</label>
          <textarea
            value={body}
            onChange={e => setBody(e.target.value)}
            className="w-full flex-1 min-h-[150px] px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 resize-none"
          />
        </div>
        <button
          onClick={() => onSave(template.id, template.type === 'email' ? subject : null, body)}
          className="mt-2 flex items-center justify-center gap-2 w-full px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-md hover:bg-gray-800 transition-colors"
        >
          <Save className="w-4 h-4" />
          저장
        </button>
      </div>
    </div>
  );
}
