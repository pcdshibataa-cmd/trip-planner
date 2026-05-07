import { useState } from 'react';
import type { TravelItinerary } from '../types/travel';
import { TRANSPORT_LABELS, ACCOMMODATION_LABELS, SPOT_LABELS, THEMES } from '../types/travel';
import { buildShareUrl } from '../utils/share';

interface Props {
  itinerary: TravelItinerary;
  onBack: () => void;
}

const DOW = ['日', '月', '火', '水', '木', '金', '土'];

function formatDateJP(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  const m = d.getMonth() + 1;
  const day = d.getDate();
  const dow = DOW[d.getDay()];
  return `${m}月${day}日（${dow}）`;
}

function getDateRange(startDate: string, endDate: string): string[] {
  const dates: string[] = [];
  const start = new Date(startDate + 'T00:00:00');
  const end = new Date(endDate + 'T00:00:00');
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    dates.push(`${y}-${m}-${day}`);
  }
  return dates;
}

function getDayCount(startDate: string, endDate: string): number {
  const start = new Date(startDate + 'T00:00:00');
  const end = new Date(endDate + 'T00:00:00');
  return Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
}

function sortByTime(a: string, b: string): number {
  if (!a && !b) return 0;
  if (!a) return 1;
  if (!b) return -1;
  return a.localeCompare(b);
}

export default function ItineraryView({ itinerary, onBack }: Props) {
  const [copied, setCopied] = useState(false);

  const handleShare = () => {
    const url = buildShareUrl(itinerary);
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const { basicInfo, transportations, accommodations, spots } = itinerary;
  const dates = getDateRange(basicInfo.startDate, basicInfo.endDate);
  const dayCount = getDayCount(basicInfo.startDate, basicInfo.endDate);
  const nightCount = dayCount - 1;

  const themeLabels = THEMES.filter((t) => basicInfo.themes.includes(t.value)).map((t) => t.label);

  const unscheduledTransports = transportations.filter((t) => !t.date);
  const unscheduledSpots = spots.filter((s) => !s.date);
  const unscheduledAccommodations = accommodations.filter((a) => !a.checkInDate);

  return (
    <div className="itinerary-wrapper">
      <div className="itinerary-actions no-print">
        <button type="button" className="btn-secondary" onClick={onBack}>
          ← 詳細入力に戻る
        </button>
        <button type="button" className="btn-share" onClick={handleShare}>
          {copied ? '✅ コピーしました！' : '🔗 URLで共有'}
        </button>
        <button type="button" className="btn-print" onClick={() => window.print()}>
          🖨️ 印刷する
        </button>
      </div>

      <div className="itinerary">
        {/* ヘッダー */}
        <div className="itinerary-header">
          <div className="itinerary-title-area">
            <span className="itinerary-icon">✈️</span>
            <h1 className="itinerary-title">{basicInfo.title}</h1>
          </div>
          <div className="itinerary-meta-grid">
            <div className="itinerary-meta-item">
              <span className="meta-label">目的地</span>
              <span className="meta-value">📍 {basicInfo.destination}</span>
            </div>
            <div className="itinerary-meta-item">
              <span className="meta-label">期間</span>
              <span className="meta-value">
                📅{' '}
                {basicInfo.startDate
                  ? `${formatDateJP(basicInfo.startDate)} 〜 ${formatDateJP(basicInfo.endDate)}`
                  : '未定'}
              </span>
            </div>
            <div className="itinerary-meta-item">
              <span className="meta-label">日程</span>
              <span className="meta-value">
                🌙 {dayCount}日間{nightCount > 0 ? `・${nightCount}泊` : '（日帰り）'}
              </span>
            </div>
            <div className="itinerary-meta-item">
              <span className="meta-label">参加人数</span>
              <span className="meta-value">👥 {basicInfo.numberOfPeople}名</span>
            </div>
            {basicInfo.budget && (
              <div className="itinerary-meta-item">
                <span className="meta-label">予算</span>
                <span className="meta-value">💰 {basicInfo.budget}</span>
              </div>
            )}
            {themeLabels.length > 0 && (
              <div className="itinerary-meta-item">
                <span className="meta-label">テーマ</span>
                <span className="meta-value">{themeLabels.join('　')}</span>
              </div>
            )}
          </div>
          {basicInfo.notes && (
            <div className="itinerary-notes">
              <span className="meta-label">メモ</span>
              <p>{basicInfo.notes}</p>
            </div>
          )}
        </div>

        {/* 日程表 */}
        {dates.map((date, i) => {
          const dayTransports = transportations
            .filter((t) => t.date === date)
            .sort((a, b) => sortByTime(a.departureTime, b.departureTime));
          const daySpots = spots
            .filter((s) => s.date === date)
            .sort((a, b) => sortByTime(a.time, b.time));
          const dayAccommodations = accommodations.filter((a) => a.checkInDate === date);
          const hasContent =
            dayTransports.length > 0 || daySpots.length > 0 || dayAccommodations.length > 0;

          return (
            <div key={date} className="day-section">
              <div className="day-header">
                <span className="day-number">{i + 1}日目</span>
                <span className="day-date">{formatDateJP(date)}</span>
              </div>
              <div className="day-content">
                {!hasContent && (
                  <p className="day-empty">予定はまだ登録されていません</p>
                )}

                {dayTransports.map((t) => (
                  <div key={t.id} className="schedule-item transport">
                    <div className="schedule-item-icon">
                      {TRANSPORT_LABELS[t.type].split(' ')[0]}
                    </div>
                    <div className="schedule-item-body">
                      <div className="schedule-item-title">
                        {t.from} → {t.to}
                      </div>
                      <div className="schedule-item-details">
                        {t.company && <span>{t.company}</span>}
                        {t.departureTime && <span>出発 {t.departureTime}</span>}
                        {t.arrivalTime && <span>到着 {t.arrivalTime}</span>}
                        {t.reservationNo && <span>予約番号: {t.reservationNo}</span>}
                        {t.notes && <span className="item-notes-inline">{t.notes}</span>}
                      </div>
                    </div>
                    <div className="schedule-item-tag transport-tag">
                      {TRANSPORT_LABELS[t.type].split(' ').slice(1).join(' ')}
                    </div>
                  </div>
                ))}

                {daySpots.map((s) => (
                  <div key={s.id} className="schedule-item spot">
                    <div className="schedule-item-icon">
                      {SPOT_LABELS[s.category].split(' ')[0]}
                    </div>
                    <div className="schedule-item-body">
                      <div className="schedule-item-title">{s.name}</div>
                      <div className="schedule-item-details">
                        {s.time && <span>🕐 {s.time}</span>}
                        {s.address && <span>📍 {s.address}</span>}
                        {s.notes && <span className="item-notes-inline">{s.notes}</span>}
                      </div>
                    </div>
                    <div className="schedule-item-tag spot-tag">
                      {SPOT_LABELS[s.category].split(' ').slice(1).join(' ')}
                    </div>
                  </div>
                ))}

                {dayAccommodations.map((a) => (
                  <div key={a.id} className="schedule-item accommodation">
                    <div className="schedule-item-icon">
                      {ACCOMMODATION_LABELS[a.type].split(' ')[0]}
                    </div>
                    <div className="schedule-item-body">
                      <div className="schedule-item-title">{a.name}</div>
                      <div className="schedule-item-details">
                        {a.checkOutDate && <span>チェックアウト: {formatDateJP(a.checkOutDate)}</span>}
                        {a.address && <span>📍 {a.address}</span>}
                        {a.phone && <span>📞 {a.phone}</span>}
                        {a.reservationNo && <span>予約番号: {a.reservationNo}</span>}
                        {a.notes && <span className="item-notes-inline">{a.notes}</span>}
                      </div>
                    </div>
                    <div className="schedule-item-tag accommodation-tag">
                      {ACCOMMODATION_LABELS[a.type].split(' ').slice(1).join(' ')}（宿泊）
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {/* 未定の項目 */}
        {(unscheduledTransports.length > 0 ||
          unscheduledSpots.length > 0 ||
          unscheduledAccommodations.length > 0) && (
          <div className="day-section unscheduled">
            <div className="day-header">
              <span className="day-number">未定</span>
              <span className="day-date">日程が決まっていない項目</span>
            </div>
            <div className="day-content">
              {unscheduledTransports.map((t) => (
                <div key={t.id} className="schedule-item transport">
                  <div className="schedule-item-icon">{TRANSPORT_LABELS[t.type].split(' ')[0]}</div>
                  <div className="schedule-item-body">
                    <div className="schedule-item-title">
                      {t.from} → {t.to}
                    </div>
                    {t.company && (
                      <div className="schedule-item-details">
                        <span>{t.company}</span>
                      </div>
                    )}
                  </div>
                  <div className="schedule-item-tag transport-tag">
                    {TRANSPORT_LABELS[t.type].split(' ').slice(1).join(' ')}
                  </div>
                </div>
              ))}
              {unscheduledSpots.map((s) => (
                <div key={s.id} className="schedule-item spot">
                  <div className="schedule-item-icon">{SPOT_LABELS[s.category].split(' ')[0]}</div>
                  <div className="schedule-item-body">
                    <div className="schedule-item-title">{s.name}</div>
                    {s.address && (
                      <div className="schedule-item-details">
                        <span>📍 {s.address}</span>
                      </div>
                    )}
                  </div>
                  <div className="schedule-item-tag spot-tag">
                    {SPOT_LABELS[s.category].split(' ').slice(1).join(' ')}
                  </div>
                </div>
              ))}
              {unscheduledAccommodations.map((a) => (
                <div key={a.id} className="schedule-item accommodation">
                  <div className="schedule-item-icon">
                    {ACCOMMODATION_LABELS[a.type].split(' ')[0]}
                  </div>
                  <div className="schedule-item-body">
                    <div className="schedule-item-title">{a.name}</div>
                  </div>
                  <div className="schedule-item-tag accommodation-tag">
                    {ACCOMMODATION_LABELS[a.type].split(' ').slice(1).join(' ')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="itinerary-footer">
          <p>旅のしおり ― 良い旅を！ ✈️ 🌟</p>
        </div>
      </div>
    </div>
  );
}
