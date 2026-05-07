import { useEffect, useState } from 'react';
import type { TravelItinerary, BasicInfo } from './types/travel';
import HearingForm from './components/HearingForm';
import TravelDetails from './components/TravelDetails';
import ItineraryView from './components/ItineraryView';
import { generateItineraryDraft } from './services/itineraryGenerator';
import { parseShareHash } from './utils/share';
import './App.css';

type Step = 1 | 2 | 3;

const STEPS = ['基本情報', '旅の詳細', 'しおり確認'];

const initialBasicInfo: BasicInfo = {
  title: '',
  destination: '',
  startDate: '',
  endDate: '',
  numberOfPeople: 2,
  budget: '',
  themes: [],
  notes: '',
};

const initialItinerary: TravelItinerary = {
  basicInfo: initialBasicInfo,
  transportations: [],
  accommodations: [],
  spots: [],
};

function readStoredKey(): string {
  return localStorage.getItem('gemini_api_key') ?? '';
}

export default function App() {
  const [step, setStep] = useState<Step>(1);
  const [itinerary, setItinerary] = useState<TravelItinerary>(initialItinerary);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState('');

  const [showApiPanel, setShowApiPanel] = useState(false);
  const [keyInput, setKeyInput] = useState('');
  const [savedKey, setSavedKey] = useState(readStoredKey);

  useEffect(() => {
    const shared = parseShareHash();
    if (shared) {
      setItinerary(shared);
      setStep(3);
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, []);

  const envKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
  const hasKey = Boolean(savedKey || envKey);

  const saveApiKey = () => {
    const trimmed = keyInput.trim();
    if (trimmed) {
      localStorage.setItem('gemini_api_key', trimmed);
      setSavedKey(trimmed);
    } else {
      localStorage.removeItem('gemini_api_key');
      setSavedKey('');
    }
    setKeyInput('');
    setShowApiPanel(false);
  };

  const handleAutoGenerate = async (advanceStep = false) => {
    setIsGenerating(true);
    setGenerationError('');
    try {
      const generated = await generateItineraryDraft(itinerary);
      setItinerary((prev) => ({
        ...prev,
        transportations: generated.transportations,
        accommodations: generated.accommodations,
        spots: generated.spots,
      }));
      if (advanceStep) setStep(2);
    } catch (error) {
      setGenerationError(
        error instanceof Error ? error.message : 'AI生成中にエラーが発生しました。',
      );
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="app">
      <header className="app-header no-print">
        <div className="header-inner">
          <div className="header-brand">
            <span className="header-logo">✈️</span>
            <span className="header-title">旅のしおりメーカー</span>
          </div>
          <nav className="step-indicator" aria-label="進捗">
            {STEPS.map((label, i) => {
              const n = (i + 1) as Step;
              return (
                <div
                  key={i}
                  className={`step-item${step === n ? ' active' : ''}${step > n ? ' done' : ''}`}
                >
                  <div className="step-circle">{step > n ? '✓' : n}</div>
                  <span className="step-label">{label}</span>
                  {i < STEPS.length - 1 && <span className="step-connector" />}
                </div>
              );
            })}
          </nav>
          {!envKey && (
            <button
              className={`btn-api-key${hasKey ? ' has-key' : ''}`}
              onClick={() => { setShowApiPanel((v) => !v); setKeyInput(''); }}
              title="Gemini APIキーを設定"
            >
              🔑 {hasKey ? 'AI設定済み' : 'APIキー設定'}
            </button>
          )}
        </div>

        {!envKey && showApiPanel && (
          <div className="api-settings-panel">
            <div className="api-settings-inner">
              <p className="api-settings-label">
                Gemini APIキー
                {hasKey && <span className="api-key-ok">（現在 設定済み）</span>}
              </p>
              <div className="api-settings-row">
                <input
                  type="password"
                  className="api-key-input"
                  value={keyInput}
                  onChange={(e) => setKeyInput(e.target.value)}
                  placeholder={hasKey ? '新しいキーを入力して上書き' : 'AIzaSy...'}
                  onKeyDown={(e) => e.key === 'Enter' && saveApiKey()}
                />
                <button className="btn-api-save" onClick={saveApiKey}>
                  保存
                </button>
                <button className="btn-api-cancel" onClick={() => setShowApiPanel(false)}>
                  閉じる
                </button>
              </div>
              <p className="api-settings-hint">
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noreferrer"
                >
                  Google AI Studio
                </a>{' '}
                で無料取得できます。キーはこのブラウザにのみ保存されます。
              </p>
            </div>
          </div>
        )}
      </header>

      <main className="app-main">
        {step === 1 && (
          <HearingForm
            basicInfo={itinerary.basicInfo}
            onChange={(basicInfo) => setItinerary({ ...itinerary, basicInfo })}
            onNext={() => setStep(2)}
            onAiGenerate={() => handleAutoGenerate(true)}
            isGenerating={isGenerating}
            aiError={generationError}
          />
        )}
        {step === 2 && (
          <TravelDetails
            itinerary={itinerary}
            onChange={setItinerary}
            onBack={() => setStep(1)}
            onNext={() => setStep(3)}
            onAutoGenerate={handleAutoGenerate}
            isGenerating={isGenerating}
            generationError={generationError}
          />
        )}
        {step === 3 && (
          <ItineraryView
            itinerary={itinerary}
            onBack={() => setStep(2)}
          />
        )}
      </main>
    </div>
  );
}
