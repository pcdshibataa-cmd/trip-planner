import { useState } from 'react';
import type {
  TravelItinerary,
  Transportation,
  Accommodation,
  TouristSpot,
  TransportType,
  AccommodationType,
  SpotCategory,
} from '../types/travel';
import { TRANSPORT_LABELS, ACCOMMODATION_LABELS, SPOT_LABELS, genId } from '../types/travel';

type Tab = 'transport' | 'accommodation' | 'spots';

interface Props {
  itinerary: TravelItinerary;
  onChange: (itinerary: TravelItinerary) => void;
  onBack: () => void;
  onNext: () => void;
  onAutoGenerate: () => Promise<void>;
  isGenerating: boolean;
  generationError: string;
}

const emptyTransport = (): Omit<Transportation, 'id'> => ({
  type: 'airplane',
  date: '',
  from: '',
  to: '',
  departureTime: '',
  arrivalTime: '',
  company: '',
  reservationNo: '',
  notes: '',
});

const emptyAccommodation = (): Omit<Accommodation, 'id'> => ({
  name: '',
  type: 'hotel',
  checkInDate: '',
  checkOutDate: '',
  address: '',
  phone: '',
  reservationNo: '',
  notes: '',
});

const emptySpot = (): Omit<TouristSpot, 'id'> => ({
  name: '',
  category: 'sightseeing',
  date: '',
  time: '',
  address: '',
  notes: '',
});

export default function TravelDetails({
  itinerary,
  onChange,
  onBack,
  onNext,
  onAutoGenerate,
  isGenerating,
  generationError,
}: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('transport');
  const [showAddForm, setShowAddForm] = useState(false);
  const [transportForm, setTransportForm] = useState(emptyTransport());
  const [accommodationForm, setAccommodationForm] = useState(emptyAccommodation());
  const [spotForm, setSpotForm] = useState(emptySpot());

  const { basicInfo, transportations, accommodations, spots } = itinerary;

  const switchTab = (tab: Tab) => {
    setActiveTab(tab);
    setShowAddForm(false);
  };

  const addTransport = () => {
    if (!transportForm.from || !transportForm.to) return;
    onChange({
      ...itinerary,
      transportations: [...transportations, { id: genId(), ...transportForm }],
    });
    setTransportForm(emptyTransport());
    setShowAddForm(false);
  };

  const removeTransport = (id: string) =>
    onChange({ ...itinerary, transportations: transportations.filter((t) => t.id !== id) });

  const addAccommodation = () => {
    if (!accommodationForm.name || !accommodationForm.checkInDate) return;
    onChange({
      ...itinerary,
      accommodations: [...accommodations, { id: genId(), ...accommodationForm }],
    });
    setAccommodationForm(emptyAccommodation());
    setShowAddForm(false);
  };

  const removeAccommodation = (id: string) =>
    onChange({ ...itinerary, accommodations: accommodations.filter((a) => a.id !== id) });

  const addSpot = () => {
    if (!spotForm.name) return;
    onChange({
      ...itinerary,
      spots: [...spots, { id: genId(), ...spotForm }],
    });
    setSpotForm(emptySpot());
    setShowAddForm(false);
  };

  const removeSpot = (id: string) =>
    onChange({ ...itinerary, spots: spots.filter((s) => s.id !== id) });

  const dateRange = {
    min: basicInfo.startDate,
    max: basicInfo.endDate,
  };

  return (
    <div className="form-container">
      <div className="form-card">
        <div className="form-card-header">
          <span className="form-card-icon">📋</span>
          <h2>旅の詳細を入力してください</h2>
          <p>交通手段・宿泊・観光スポットを追加しましょう。</p>
          <div className="auto-generate-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={onAutoGenerate}
              disabled={isGenerating}
            >
              {isGenerating ? 'AIで作成中...' : 'Google AIでおすすめを自動作成'}
            </button>
            {generationError && <p className="auto-generate-error">{generationError}</p>}
          </div>
        </div>

        <div className="tab-bar">
          <button
            className={`tab-btn${activeTab === 'transport' ? ' active' : ''}`}
            onClick={() => switchTab('transport')}
          >
            ✈️ 交通手段
            {transportations.length > 0 && (
              <span className="tab-badge">{transportations.length}</span>
            )}
          </button>
          <button
            className={`tab-btn${activeTab === 'accommodation' ? ' active' : ''}`}
            onClick={() => switchTab('accommodation')}
          >
            🏨 宿泊
            {accommodations.length > 0 && (
              <span className="tab-badge">{accommodations.length}</span>
            )}
          </button>
          <button
            className={`tab-btn${activeTab === 'spots' ? ' active' : ''}`}
            onClick={() => switchTab('spots')}
          >
            🗺️ 観光スポット
            {spots.length > 0 && <span className="tab-badge">{spots.length}</span>}
          </button>
        </div>

        {/* 交通手段タブ */}
        {activeTab === 'transport' && (
          <div className="tab-content">
            {transportations.length === 0 && !showAddForm && (
              <div className="empty-state">
                <span className="empty-icon">✈️</span>
                <p>交通手段がまだ追加されていません</p>
              </div>
            )}
            <div className="item-list">
              {transportations.map((t) => (
                <div key={t.id} className="item-card">
                  <div className="item-card-main">
                    <span className="item-label">{TRANSPORT_LABELS[t.type]}</span>
                    <strong>
                      {t.from} → {t.to}
                    </strong>
                    {t.date && <span className="item-date">{t.date}</span>}
                    {(t.departureTime || t.arrivalTime) && (
                      <span className="item-time">
                        {t.departureTime && `出発 ${t.departureTime}`}
                        {t.departureTime && t.arrivalTime && ' / '}
                        {t.arrivalTime && `到着 ${t.arrivalTime}`}
                      </span>
                    )}
                    {t.company && <span className="item-sub">{t.company}</span>}
                    {t.reservationNo && (
                      <span className="item-sub">予約番号: {t.reservationNo}</span>
                    )}
                    {t.notes && <span className="item-notes">{t.notes}</span>}
                  </div>
                  <button className="btn-remove" onClick={() => removeTransport(t.id)}>
                    ✕
                  </button>
                </div>
              ))}
            </div>

            {showAddForm ? (
              <div className="add-form">
                <h3>交通手段を追加</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label>種類</label>
                    <select
                      value={transportForm.type}
                      onChange={(e) =>
                        setTransportForm({ ...transportForm, type: e.target.value as TransportType })
                      }
                    >
                      {(Object.keys(TRANSPORT_LABELS) as TransportType[]).map((k) => (
                        <option key={k} value={k}>
                          {TRANSPORT_LABELS[k]}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>日付</label>
                    <input
                      type="date"
                      value={transportForm.date}
                      min={dateRange.min}
                      max={dateRange.max}
                      onChange={(e) => setTransportForm({ ...transportForm, date: e.target.value })}
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>
                      出発地 <span className="required">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="例：羽田空港、東京駅"
                      value={transportForm.from}
                      onChange={(e) => setTransportForm({ ...transportForm, from: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>
                      到着地 <span className="required">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="例：那覇空港、京都駅"
                      value={transportForm.to}
                      onChange={(e) => setTransportForm({ ...transportForm, to: e.target.value })}
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>出発時刻</label>
                    <input
                      type="time"
                      value={transportForm.departureTime}
                      onChange={(e) =>
                        setTransportForm({ ...transportForm, departureTime: e.target.value })
                      }
                    />
                  </div>
                  <div className="form-group">
                    <label>到着時刻</label>
                    <input
                      type="time"
                      value={transportForm.arrivalTime}
                      onChange={(e) =>
                        setTransportForm({ ...transportForm, arrivalTime: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>会社・路線名</label>
                    <input
                      type="text"
                      placeholder="例：JAL、東海道新幹線"
                      value={transportForm.company}
                      onChange={(e) =>
                        setTransportForm({ ...transportForm, company: e.target.value })
                      }
                    />
                  </div>
                  <div className="form-group">
                    <label>予約番号</label>
                    <input
                      type="text"
                      placeholder="例：ABC123"
                      value={transportForm.reservationNo}
                      onChange={(e) =>
                        setTransportForm({ ...transportForm, reservationNo: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>メモ</label>
                  <input
                    type="text"
                    placeholder="自由記入"
                    value={transportForm.notes}
                    onChange={(e) => setTransportForm({ ...transportForm, notes: e.target.value })}
                  />
                </div>
                <div className="add-form-actions">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setShowAddForm(false)}
                  >
                    キャンセル
                  </button>
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={addTransport}
                    disabled={!transportForm.from || !transportForm.to}
                  >
                    追加する
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                className="btn-add"
                onClick={() => setShowAddForm(true)}
              >
                ＋ 交通手段を追加
              </button>
            )}
          </div>
        )}

        {/* 宿泊タブ */}
        {activeTab === 'accommodation' && (
          <div className="tab-content">
            {accommodations.length === 0 && !showAddForm && (
              <div className="empty-state">
                <span className="empty-icon">🏨</span>
                <p>宿泊施設がまだ追加されていません</p>
              </div>
            )}
            <div className="item-list">
              {accommodations.map((a) => (
                <div key={a.id} className="item-card">
                  <div className="item-card-main">
                    <span className="item-label">{ACCOMMODATION_LABELS[a.type]}</span>
                    <strong>{a.name}</strong>
                    {(a.checkInDate || a.checkOutDate) && (
                      <span className="item-date">
                        {a.checkInDate && `IN: ${a.checkInDate}`}
                        {a.checkInDate && a.checkOutDate && ' → '}
                        {a.checkOutDate && `OUT: ${a.checkOutDate}`}
                      </span>
                    )}
                    {a.address && <span className="item-sub">📍 {a.address}</span>}
                    {a.phone && <span className="item-sub">📞 {a.phone}</span>}
                    {a.reservationNo && (
                      <span className="item-sub">予約番号: {a.reservationNo}</span>
                    )}
                    {a.notes && <span className="item-notes">{a.notes}</span>}
                  </div>
                  <button className="btn-remove" onClick={() => removeAccommodation(a.id)}>
                    ✕
                  </button>
                </div>
              ))}
            </div>

            {showAddForm ? (
              <div className="add-form">
                <h3>宿泊施設を追加</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label>
                      施設名 <span className="required">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="例：京都グランドホテル"
                      value={accommodationForm.name}
                      onChange={(e) =>
                        setAccommodationForm({ ...accommodationForm, name: e.target.value })
                      }
                    />
                  </div>
                  <div className="form-group">
                    <label>種類</label>
                    <select
                      value={accommodationForm.type}
                      onChange={(e) =>
                        setAccommodationForm({
                          ...accommodationForm,
                          type: e.target.value as AccommodationType,
                        })
                      }
                    >
                      {(Object.keys(ACCOMMODATION_LABELS) as AccommodationType[]).map((k) => (
                        <option key={k} value={k}>
                          {ACCOMMODATION_LABELS[k]}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>
                      チェックイン日 <span className="required">*</span>
                    </label>
                    <input
                      type="date"
                      value={accommodationForm.checkInDate}
                      min={dateRange.min}
                      max={dateRange.max}
                      onChange={(e) =>
                        setAccommodationForm({ ...accommodationForm, checkInDate: e.target.value })
                      }
                    />
                  </div>
                  <div className="form-group">
                    <label>チェックアウト日</label>
                    <input
                      type="date"
                      value={accommodationForm.checkOutDate}
                      min={accommodationForm.checkInDate || dateRange.min}
                      max={dateRange.max}
                      onChange={(e) =>
                        setAccommodationForm({
                          ...accommodationForm,
                          checkOutDate: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>住所</label>
                    <input
                      type="text"
                      placeholder="例：京都市東山区..."
                      value={accommodationForm.address}
                      onChange={(e) =>
                        setAccommodationForm({ ...accommodationForm, address: e.target.value })
                      }
                    />
                  </div>
                  <div className="form-group">
                    <label>電話番号</label>
                    <input
                      type="tel"
                      placeholder="例：075-xxx-xxxx"
                      value={accommodationForm.phone}
                      onChange={(e) =>
                        setAccommodationForm({ ...accommodationForm, phone: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>予約番号</label>
                    <input
                      type="text"
                      value={accommodationForm.reservationNo}
                      onChange={(e) =>
                        setAccommodationForm({
                          ...accommodationForm,
                          reservationNo: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="form-group">
                    <label>メモ</label>
                    <input
                      type="text"
                      value={accommodationForm.notes}
                      onChange={(e) =>
                        setAccommodationForm({ ...accommodationForm, notes: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="add-form-actions">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setShowAddForm(false)}
                  >
                    キャンセル
                  </button>
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={addAccommodation}
                    disabled={!accommodationForm.name || !accommodationForm.checkInDate}
                  >
                    追加する
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                className="btn-add"
                onClick={() => setShowAddForm(true)}
              >
                ＋ 宿泊施設を追加
              </button>
            )}
          </div>
        )}

        {/* 観光スポットタブ */}
        {activeTab === 'spots' && (
          <div className="tab-content">
            {spots.length === 0 && !showAddForm && (
              <div className="empty-state">
                <span className="empty-icon">🗺️</span>
                <p>観光スポットがまだ追加されていません</p>
              </div>
            )}
            <div className="item-list">
              {spots.map((s) => (
                <div key={s.id} className="item-card">
                  <div className="item-card-main">
                    <span className="item-label">{SPOT_LABELS[s.category]}</span>
                    <strong>{s.name}</strong>
                    {s.date && (
                      <span className="item-date">
                        {s.date}
                        {s.time && ` ${s.time}`}
                      </span>
                    )}
                    {s.address && <span className="item-sub">📍 {s.address}</span>}
                    {s.notes && <span className="item-notes">{s.notes}</span>}
                  </div>
                  <button className="btn-remove" onClick={() => removeSpot(s.id)}>
                    ✕
                  </button>
                </div>
              ))}
            </div>

            {showAddForm ? (
              <div className="add-form">
                <h3>観光スポットを追加</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label>
                      スポット名 <span className="required">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="例：清水寺、錦市場"
                      value={spotForm.name}
                      onChange={(e) => setSpotForm({ ...spotForm, name: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>カテゴリ</label>
                    <select
                      value={spotForm.category}
                      onChange={(e) =>
                        setSpotForm({ ...spotForm, category: e.target.value as SpotCategory })
                      }
                    >
                      {(Object.keys(SPOT_LABELS) as SpotCategory[]).map((k) => (
                        <option key={k} value={k}>
                          {SPOT_LABELS[k]}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>日付</label>
                    <input
                      type="date"
                      value={spotForm.date}
                      min={dateRange.min}
                      max={dateRange.max}
                      onChange={(e) => setSpotForm({ ...spotForm, date: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>時刻</label>
                    <input
                      type="time"
                      value={spotForm.time}
                      onChange={(e) => setSpotForm({ ...spotForm, time: e.target.value })}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>住所</label>
                  <input
                    type="text"
                    placeholder="例：京都市東山区清水1丁目294"
                    value={spotForm.address}
                    onChange={(e) => setSpotForm({ ...spotForm, address: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>メモ</label>
                  <input
                    type="text"
                    placeholder="例：混雑するので早めに行く"
                    value={spotForm.notes}
                    onChange={(e) => setSpotForm({ ...spotForm, notes: e.target.value })}
                  />
                </div>
                <div className="add-form-actions">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setShowAddForm(false)}
                  >
                    キャンセル
                  </button>
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={addSpot}
                    disabled={!spotForm.name}
                  >
                    追加する
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                className="btn-add"
                onClick={() => setShowAddForm(true)}
              >
                ＋ 観光スポットを追加
              </button>
            )}
          </div>
        )}

        <div className="form-actions between">
          <button type="button" className="btn-secondary" onClick={onBack}>
            ← 基本情報に戻る
          </button>
          <button type="button" className="btn-primary" onClick={onNext}>
            しおりを作成する →
          </button>
        </div>
      </div>
    </div>
  );
}
