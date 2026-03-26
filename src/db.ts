import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dbPath = path.join(process.cwd(), 'data');
if (!fs.existsSync(dbPath)) {
  fs.mkdirSync(dbPath, { recursive: true });
}

const db = new Database(path.join(dbPath, 'onboarding.db'));

// Initialize database tables
db.exec(`
  CREATE TABLE IF NOT EXISTS hires (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    join_date TEXT NOT NULL,
    department TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS templates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    days_before INTEGER NOT NULL,
    type TEXT NOT NULL, -- 'email' or 'kakao'
    subject TEXT,
    body TEXT NOT NULL,
    UNIQUE(days_before, type)
  );

  CREATE TABLE IF NOT EXISTS logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    hire_id INTEGER NOT NULL,
    days_before INTEGER NOT NULL,
    type TEXT NOT NULL,
    status TEXT NOT NULL, -- 'success' or 'error'
    message TEXT,
    sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(hire_id) REFERENCES hires(id)
  );
`);

// Insert default templates if they don't exist
const insertTemplate = db.prepare(`
  INSERT OR IGNORE INTO templates (days_before, type, subject, body)
  VALUES (?, ?, ?, ?)
`);

const defaultTemplates = [
  {
    days: 15,
    type: 'email',
    subject: '[환영합니다] 입사 15일 전 안내사항입니다.',
    body: '안녕하세요 {{name}}님,\n\n저희 회사에 합류하시게 된 것을 진심으로 환영합니다!\n입사 15일 전 안내사항을 전달해 드립니다.\n\n[해야 할 일]\n1. 입사 구비서류 준비\n2. 사내 시스템 계정 생성용 정보 입력\n\n자세한 내용은 첨부된 가이드를 확인해 주세요.\n\n감사합니다.\n채용담당자 드림',
  },
  {
    days: 15,
    type: 'kakao',
    subject: null,
    body: '안녕하세요 {{name}}님!\n입사 15일 전 안내사항이 이메일로 발송되었습니다.\n이메일을 확인하시고 구비서류를 준비해 주세요.\n감사합니다!',
  },
  {
    days: 10,
    type: 'email',
    subject: '[안내] 입사 10일 전 장비 선택 안내입니다.',
    body: '안녕하세요 {{name}}님,\n\n입사 10일 전 안내사항입니다.\n\n[해야 할 일]\n1. 업무용 장비(노트북 등) 선택\n2. 사원증 사진 제출\n\n아래 링크를 통해 폼을 작성해 주세요.\n[링크]\n\n감사합니다.\n채용담당자 드림',
  },
  {
    days: 10,
    type: 'kakao',
    subject: null,
    body: '안녕하세요 {{name}}님!\n입사 10일 전 장비 선택 및 사원증 사진 제출 안내가 이메일로 발송되었습니다.\n확인 부탁드립니다!',
  },
  {
    days: 5,
    type: 'email',
    subject: '[중요] 입사 5일 전 최종 안내 및 출근 가이드',
    body: '안녕하세요 {{name}}님,\n\n어느덧 입사가 5일 앞으로 다가왔습니다.\n\n[해야 할 일]\n1. 첫 출근 시간 및 장소 확인 (오전 9시 30분, 본사 3층 라운지)\n2. 복장 및 준비물 확인\n\n첫 날 뵙겠습니다. 조심히 오세요!\n\n감사합니다.\n채용담당자 드림',
  },
  {
    days: 5,
    type: 'kakao',
    subject: null,
    body: '안녕하세요 {{name}}님!\n입사가 5일 남았습니다. 첫 출근 가이드가 이메일로 발송되었으니 꼭 확인해 주세요.\n곧 뵙겠습니다!',
  },
];

const insertMany = db.transaction((templates) => {
  for (const t of templates) {
    insertTemplate.run(t.days, t.type, t.subject, t.body);
  }
});

insertMany(defaultTemplates);

export default db;
