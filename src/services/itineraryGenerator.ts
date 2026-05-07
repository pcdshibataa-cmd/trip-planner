import { GoogleGenerativeAI } from '@google/generative-ai';
import type {
  Accommodation,
  AccommodationType,
  BasicInfo,
  SpotCategory,
  TouristSpot,
  Transportation,
  TransportType,
  TravelItinerary,
} from '../types/travel';
import { genId } from '../types/travel';

type GeneratedPlan = {
  transportations: Array<Omit<Transportation, 'id'>>;
  accommodations: Array<Omit<Accommodation, 'id'>>;
  spots: Array<Omit<TouristSpot, 'id'>>;
};

const TRANSPORT_TYPES: TransportType[] = [
  'airplane', 'shinkansen', 'train', 'bus', 'car', 'ferry', 'other',
];
const ACCOMMODATION_TYPES: AccommodationType[] = [
  'hotel', 'ryokan', 'pension', 'hostel', 'airbnb', 'other',
];
const SPOT_TYPES: SpotCategory[] = [
  'sightseeing', 'food', 'shopping', 'activity', 'nature', 'culture', 'other',
];

const DOW = ['日', '月', '火', '水', '木', '金', '土'];

const THEME_MAP: Record<string, string> = {
  onsen: '温泉・湯治',
  sightseeing: '観光・名所巡り',
  gourmet: 'グルメ・食べ歩き',
  outdoor: 'アウトドア・自然体験',
  culture: '文化・歴史・寺社仏閣',
  shopping: 'ショッピング・お土産',
  nature: '自然・絶景',
  beach: 'ビーチ・マリンスポーツ',
};

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

function labelDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return `${dateStr}（${DOW[d.getDay()]}）`;
}

function isDateWithinTrip(date: string, startDate: string, endDate: string): boolean {
  if (!date) return true;
  return date >= startDate && date <= endDate;
}

function normalizePlan(input: unknown, basicInfo: BasicInfo): GeneratedPlan {
  const value = (input ?? {}) as Partial<GeneratedPlan>;

  const transportations = (value.transportations ?? [])
    .filter((item): item is Omit<Transportation, 'id'> => Boolean(item))
    .map((item) => ({
      type: TRANSPORT_TYPES.includes(item.type) ? item.type : ('other' as TransportType),
      date: isDateWithinTrip(item.date, basicInfo.startDate, basicInfo.endDate) ? item.date : '',
      from: item.from ?? '',
      to: item.to ?? '',
      departureTime: item.departureTime ?? '',
      arrivalTime: item.arrivalTime ?? '',
      company: item.company ?? '',
      reservationNo: item.reservationNo ?? '',
      notes: item.notes ?? '',
    }))
    .filter((item) => item.from && item.to);

  const accommodations = (value.accommodations ?? [])
    .filter((item): item is Omit<Accommodation, 'id'> => Boolean(item))
    .map((item) => ({
      name: item.name ?? '',
      type: ACCOMMODATION_TYPES.includes(item.type) ? item.type : ('other' as AccommodationType),
      checkInDate: isDateWithinTrip(item.checkInDate, basicInfo.startDate, basicInfo.endDate)
        ? item.checkInDate : '',
      checkOutDate: isDateWithinTrip(item.checkOutDate, basicInfo.startDate, basicInfo.endDate)
        ? item.checkOutDate : '',
      address: item.address ?? '',
      phone: item.phone ?? '',
      reservationNo: item.reservationNo ?? '',
      notes: item.notes ?? '',
    }))
    .filter((item) => item.name);

  const spots = (value.spots ?? [])
    .filter((item): item is Omit<TouristSpot, 'id'> => Boolean(item))
    .map((item) => ({
      name: item.name ?? '',
      category: SPOT_TYPES.includes(item.category) ? item.category : ('other' as SpotCategory),
      date: isDateWithinTrip(item.date, basicInfo.startDate, basicInfo.endDate) ? item.date : '',
      time: item.time ?? '',
      address: item.address ?? '',
      notes: item.notes ?? '',
    }))
    .filter((item) => item.name);

  return { transportations, accommodations, spots };
}

function buildPrompt(basicInfo: BasicInfo): string {
  const start = new Date(basicInfo.startDate + 'T00:00:00');
  const end = new Date(basicInfo.endDate + 'T00:00:00');
  const dayCount = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  const nightCount = dayCount - 1;

  const themeText = basicInfo.themes.length > 0
    ? basicInfo.themes.map((t) => THEME_MAP[t] ?? t).join('・')
    : 'なし（一般的な観光旅行）';

  const dates = getDateRange(basicInfo.startDate, basicInfo.endDate);
  const dateList = dates
    .map((d, i) => `  ${i + 1}日目: ${labelDate(d)}`)
    .join('\n');

  return `あなたは日本の旅行プランナーです。以下の旅行条件をもとに、具体的で実用的な旅のしおりを作成してください。

【旅行条件】
- タイトル: ${basicInfo.title}
- 目的地: ${basicInfo.destination}
- 旅行期間: ${labelDate(basicInfo.startDate)} 〜 ${labelDate(basicInfo.endDate)}（${dayCount}日間${nightCount > 0 ? `・${nightCount}泊` : '・日帰り'}）
- 参加人数: ${basicInfo.numberOfPeople}名
- 予算目安: ${basicInfo.budget || '標準的な旅行予算'}
- テーマ・目的: ${themeText}
- 要望・メモ: ${basicInfo.notes || 'なし'}

【日程一覧】
${dateList}

【作成ガイドライン】

■ 交通手段（transportations）
- 東京・大阪・名古屋など近隣主要都市から目的地への往復交通を含める
- 目的地に応じた最適な手段（飛行機・新幹線・特急など）を選ぶ
- 現地での移動（バス・レンタカー等）も必要に応じて追加する
- 必ず出発日・帰着日と具体的な時刻を設定する

■ 宿泊（accommodations）
- テーマと予算に合った実在する宿泊施設を選ぶ
  例: 温泉テーマ→温泉旅館、都市観光→シティホテル
- チェックイン 15:00〜、チェックアウト 11:00 が標準
- 必ず checkInDate と checkOutDate を設定する
- 日帰りの場合は不要

■ 観光スポット（spots）
- 目的地に実際に存在する有名スポット・グルメ店を日ごとに配置する
- 1日あたり4〜6件（移動も含む）を目安にする
- 毎日「昼食」と「夕食」のグルメスポット（category: "food"）を必ず1件ずつ含める
- テーマに応じたスポットを優先:
  * 温泉 → 露天風呂・足湯・温泉街散策
  * グルメ → 地元名物料理の人気店・食べ歩きスポット
  * 観光 → 世界遺産・国宝・城・神社仏閣
  * 自然 → 公園・滝・展望台・絶景ポイント
  * ショッピング → 商店街・道の駅・デパート
- スポットのnotesには見どころや予約の要否など有用な情報を1〜2文で必ず記載する

■ 時間配分（厳守）
- 1日目: 出発移動（午前）→ 到着後に観光開始（午後）→ 夕食 → チェックイン
- 中間日: 朝食後 09:00 から観光 → 昼食 12:30 → 午後観光 14:00〜 → 夕食 18:30
- 最終日: 午前中に観光（10:00まで）→ チェックアウト → 帰路（昼〜午後）

【厳守事項】
- 出力はJSONのみ（前置き・説明文・マークダウンコードブロックは禁止）
- date/checkInDate/checkOutDate は ${basicInfo.startDate}〜${basicInfo.endDate} の範囲内
- time/departureTime/arrivalTime は24時間形式（HH:MM）
- 実在する施設名・スポット名・住所を使用する
- 空欄の値は空文字列にする

【出力JSONスキーマ】
{
  "transportations": [
    {
      "type": "airplane|shinkansen|train|bus|car|ferry|other",
      "date": "YYYY-MM-DD",
      "from": "出発地（駅名・空港名）",
      "to": "到着地（駅名・空港名）",
      "departureTime": "HH:MM",
      "arrivalTime": "HH:MM",
      "company": "航空会社・鉄道会社名",
      "reservationNo": "",
      "notes": "便名など"
    }
  ],
  "accommodations": [
    {
      "name": "施設名",
      "type": "hotel|ryokan|pension|hostel|airbnb|other",
      "checkInDate": "YYYY-MM-DD",
      "checkOutDate": "YYYY-MM-DD",
      "address": "〒xxx-xxxx 都道府県市区町村...",
      "phone": "",
      "reservationNo": "",
      "notes": "施設の特徴・おすすめポイント"
    }
  ],
  "spots": [
    {
      "name": "スポット名",
      "category": "sightseeing|food|shopping|activity|nature|culture|other",
      "date": "YYYY-MM-DD",
      "time": "HH:MM",
      "address": "都道府県市区町村...",
      "notes": "見どころ・おすすめポイント・注意事項"
    }
  ]
}`;
}

function extractJson(text: string): string {
  const blockMatch = text.match(/```json\s*([\s\S]*?)```/i);
  if (blockMatch?.[1]) return blockMatch[1].trim();
  const objectMatch = text.match(/\{[\s\S]*\}/);
  if (objectMatch?.[0]) return objectMatch[0].trim();
  return text.trim();
}

function createFallbackPlan(basicInfo: BasicInfo): GeneratedPlan {
  const dates = getDateRange(basicInfo.startDate, basicInfo.endDate);
  const spots: Array<Omit<TouristSpot, 'id'>> = dates.flatMap((date, i) => [
    {
      name: `${basicInfo.destination} 観光スポット ${i + 1}`,
      category: 'sightseeing' as SpotCategory,
      date,
      time: '10:00',
      address: '',
      notes: 'AIのクォータ超過のため簡易プランです。スポット名を手動で修正してください。',
    },
    {
      name: `${basicInfo.destination} 地元グルメ（昼）`,
      category: 'food' as SpotCategory,
      date,
      time: '12:30',
      address: '',
      notes: '地元の名物料理をお楽しみください。',
    },
  ]);

  return { transportations: [], accommodations: [], spots };
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function requestPlanFromModel(
  genAI: GoogleGenerativeAI,
  modelName: string,
  basicInfo: BasicInfo,
): Promise<GeneratedPlan> {
  const model = genAI.getGenerativeModel({ model: modelName });
  const result = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: buildPrompt(basicInfo) }] }],
    generationConfig: { responseMimeType: 'application/json' },
  });
  const responseText = result.response.text();
  const jsonText = extractJson(responseText);
  const parsed = JSON.parse(jsonText) as unknown;
  return normalizePlan(parsed, basicInfo);
}

export async function generateItineraryDraft(
  itinerary: TravelItinerary,
): Promise<Pick<TravelItinerary, 'transportations' | 'accommodations' | 'spots'>> {
  const apiKey =
    localStorage.getItem('gemini_api_key') ||
    (import.meta.env.VITE_GEMINI_API_KEY as string | undefined) ||
    '';
  if (!apiKey) {
    throw new Error(
      'Gemini APIキーが設定されていません。管理者にお問い合わせください。',
    );
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  let normalized: GeneratedPlan;

  try {
    normalized = await requestPlanFromModel(genAI, 'gemini-2.5-flash', itinerary.basicInfo);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes('[429') || message.toLowerCase().includes('quota')) {
      normalized = createFallbackPlan(itinerary.basicInfo);
    } else if (message.includes('[503') || message.includes('currently experienc')) {
      try {
        await sleep(1500);
        normalized = await requestPlanFromModel(genAI, 'gemini-2.5-flash', itinerary.basicInfo);
      } catch {
        try {
          normalized = await requestPlanFromModel(genAI, 'gemini-2.0-flash', itinerary.basicInfo);
        } catch {
          normalized = createFallbackPlan(itinerary.basicInfo);
        }
      }
    } else {
      throw new Error(`Google AIでの生成に失敗しました: ${message.slice(0, 200)}`);
    }
  }

  return {
    transportations: normalized.transportations.map((item) => ({ id: genId(), ...item })),
    accommodations: normalized.accommodations.map((item) => ({ id: genId(), ...item })),
    spots: normalized.spots.map((item) => ({ id: genId(), ...item })),
  };
}
