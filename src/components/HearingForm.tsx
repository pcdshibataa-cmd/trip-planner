import type { BasicInfo } from '../types/travel';
import { THEMES } from '../types/travel';

interface Props {
  basicInfo: BasicInfo;
  onChange: (info: BasicInfo) => void;
  onNext: () => void;
  onAiGenerate: () => Promise<void>;
  isGenerating: boolean;
  aiError: string;
}

export default function HearingForm({
  basicInfo,
  onChange,
  onNext,
  onAiGenerate,
  isGenerating,
  aiError,
}: Props) {
  const update = <K extends keyof BasicInfo>(field: K, value: BasicInfo[K]) => {
    onChange({ ...basicInfo, [field]: value });
  };

  const toggleTheme = (theme: string) => {
    const themes = basicInfo.themes.includes(theme)
      ? basicInfo.themes.filter((t) => t !== theme)
      : [...basicInfo.themes, theme];
    update('themes', themes);
  };

  const isValid =
    basicInfo.title.trim() &&
    basicInfo.destination.trim() &&
    basicInfo.startDate &&
    basicInfo.endDate &&
    basicInfo.startDate <= basicInfo.endDate;

  return (
    <div className="form-container">
      {isGenerating && (
        <div className="generating-overlay">
          <div className="generating-inner">
            <div className="generating-plane">✈️</div>
            <p className="generating-title">AIがしおりを作成中です…</p>
            <p className="generating-sub">
              おすすめスポット・タイムスケジュール・宿泊先を自動で考えています
            </p>
            <div className="generating-dots">
              <span /><span /><span />
            </div>
          </div>
        </div>
      )}

      <div className="form-card">
        <div className="form-card-header">
          <span className="form-card-icon">🗺️</span>
          <h2>旅の基本情報を教えてください</h2>
          <p>ヒアリング内容をもとに、旅のしおりを作成します。</p>
        </div>

        <div className="form-group">
          <label>
            旅のタイトル <span className="required">*</span>
          </label>
          <input
            type="text"
            placeholder="例：夏の沖縄旅行、京都・奈良 3泊4日"
            value={basicInfo.title}
            onChange={(e) => update('title', e.target.value)}
            disabled={isGenerating}
          />
        </div>

        <div className="form-group">
          <label>
            行き先 <span className="required">*</span>
          </label>
          <input
            type="text"
            placeholder="例：京都・奈良、北海道、沖縄"
            value={basicInfo.destination}
            onChange={(e) => update('destination', e.target.value)}
            disabled={isGenerating}
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>
              出発日 <span className="required">*</span>
            </label>
            <input
              type="date"
              value={basicInfo.startDate}
              onChange={(e) => update('startDate', e.target.value)}
              disabled={isGenerating}
            />
          </div>
          <div className="form-group">
            <label>
              帰着日 <span className="required">*</span>
            </label>
            <input
              type="date"
              value={basicInfo.endDate}
              min={basicInfo.startDate}
              onChange={(e) => update('endDate', e.target.value)}
              disabled={isGenerating}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>人数</label>
            <div className="input-with-unit">
              <input
                type="number"
                min="1"
                max="50"
                value={basicInfo.numberOfPeople}
                onChange={(e) => update('numberOfPeople', parseInt(e.target.value) || 1)}
                disabled={isGenerating}
              />
              <span className="unit">名</span>
            </div>
          </div>
          <div className="form-group">
            <label>予算の目安</label>
            <input
              type="text"
              placeholder="例：1人5万円、合計10万円"
              value={basicInfo.budget}
              onChange={(e) => update('budget', e.target.value)}
              disabled={isGenerating}
            />
          </div>
        </div>

        <div className="form-group">
          <label>旅のテーマ（複数選択可）</label>
          <div className="theme-grid">
            {THEMES.map((theme) => (
              <button
                key={theme.value}
                type="button"
                className={`theme-btn${basicInfo.themes.includes(theme.value) ? ' selected' : ''}`}
                onClick={() => toggleTheme(theme.value)}
                disabled={isGenerating}
              >
                {theme.label}
              </button>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label>メモ・要望</label>
          <textarea
            placeholder="例：子供連れ、バリアフリー希望、アレルギーあり、特定の場所に行きたい、など"
            value={basicInfo.notes}
            onChange={(e) => update('notes', e.target.value)}
            rows={3}
            disabled={isGenerating}
          />
        </div>

        {/* AI 自動生成セクション */}
        <div className="ai-section">
          <button
            type="button"
            className="btn-ai"
            onClick={onAiGenerate}
            disabled={!isValid || isGenerating}
          >
            <span className="btn-ai-icon">✨</span>
            AIでしおりを自動作成する
            <span className="btn-ai-sub">おすすめスポット・タイムスケジュールを自動生成</span>
          </button>
          {aiError && <p className="ai-error">{aiError}</p>}
        </div>

        <div className="form-actions-row">
          <button
            type="button"
            className="btn-primary"
            onClick={onNext}
            disabled={!isValid || isGenerating}
          >
            手動で入力する →
          </button>
          {!isValid && (
            <p className="form-hint">※ タイトル・行き先・日程は必須です</p>
          )}
        </div>
      </div>
    </div>
  );
}
