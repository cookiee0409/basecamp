
const RSS2JSON = "https://api.rss2json.com/v1/api.json?rss_url=";
const COINDESK_RSS = "https://www.coindesk.com/arc/outboundfeeds/rss/";

function stripHtml(input = "") {
  return input.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function detectTag(title = "", text = "") {
  const s = `${title} ${text}`.toLowerCase();
  if (/(bitcoin|btc|etf)/.test(s)) return "BTC";
  if (/(ethereum|ether|eth)/.test(s)) return "ETH";
  if (/(solana|sol)/.test(s)) return "SOL";
  if (/(sec|regulation|lawsuit|regulator|compliance)/.test(s)) return "규제";
  if (/(defi|lending|dex|yield|staking)/.test(s)) return "DEFI";
  return "시장";
}

function relativeTime(dateString) {
  const then = new Date(dateString).getTime();
  const diffMin = Math.max(1, Math.floor((Date.now() - then) / 60000));
  if (diffMin < 60) return `${diffMin}분 전`;
  const hours = Math.floor(diffMin / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  return `${days}일 전`;
}

function fallbackSummary(title = "", desc = "") {
  const t = title.toLowerCase();
  if (/(etf)/.test(t)) return "ETF 관련 이슈가 시장 심리에 직접적인 영향을 주는 뉴스입니다.";
  if (/(hack|exploit|breach)/.test(t)) return "보안 사고 관련 뉴스로 단기 변동성과 리스크 점검이 필요합니다.";
  if (/(sec|lawsuit|regulator|regulation)/.test(t)) return "규제 이슈 관련 뉴스로 거래소·토큰 전반의 심리에 영향을 줄 수 있습니다.";
  if (/(bitcoin|btc)/.test(t)) return "비트코인 수급·가격 흐름에 영향을 줄 수 있는 핵심 뉴스입니다.";
  if (/(ethereum|eth)/.test(t)) return "이더리움 생태계 및 시장 심리와 연결되는 뉴스입니다.";
  if (/(solana|sol)/.test(t)) return "솔라나 생태계 활동과 알트코인 심리에 영향을 줄 수 있는 뉴스입니다.";
  return "오늘 시장 흐름을 파악하는 데 참고할 만한 주요 크립토 뉴스입니다.";
}

async function summarizeWithOpenAI(items) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;

  const promptItems = items.map((item, i) =>
    `${i + 1}. title: ${item.title}\nsummary: ${stripHtml(item.description || "")}\n`
  ).join("\n");

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${key}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0.3,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: "You are a crypto news editor. Return JSON only. Summarize each headline into a single concise Korean sentence. Keep the meaning faithful and do not invent facts."
        },
        {
          role: "user",
          content: `다음 뉴스 ${items.length}개를 각각 한국어 한 줄로 요약해 주세요. JSON 형식: {"summaries":["...", "..."]}\n\n${promptItems}`
        }
      ]
    })
  });

  if (!res.ok) return null;
  const data = await res.json();
  const raw = data?.choices?.[0]?.message?.content;
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed.summaries)) return parsed.summaries;
  } catch (_) {}
  return null;
}

export async function handler() {
  try {
    const res = await fetch(`${RSS2JSON}${encodeURIComponent(COINDESK_RSS)}`);
    if (!res.ok) throw new Error("rss fetch failed");
    const data = await res.json();
    const items = Array.isArray(data.items) ? data.items.slice(0, 7) : [];
    const aiSummaries = await summarizeWithOpenAI(items);

    const news = items.map((item, idx) => ({
      tag: detectTag(item.title, item.description),
      headline: aiSummaries?.[idx] || fallbackSummary(item.title, item.description),
      time: relativeTime(item.pubDate),
      source: "CoinDesk",
      url: item.link || "#"
    }));

    return {
      statusCode: 200,
      headers: { "content-type": "application/json; charset=utf-8" },
      body: JSON.stringify(news)
    };
  } catch (err) {
    return {
      statusCode: 200,
      headers: { "content-type": "application/json; charset=utf-8" },
      body: JSON.stringify([
        {
          tag: "시장",
          headline: "뉴스 데이터를 불러오지 못해 기본 안내 문구를 표시하고 있습니다.",
          time: "방금",
          source: "System",
          url: "#"
        }
      ])
    };
  }
}
