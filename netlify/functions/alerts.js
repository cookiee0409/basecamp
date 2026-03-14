
const RSS2JSON = "https://api.rss2json.com/v1/api.json?rss_url=";
const FEEDS = [
  { name: "CoinDesk", url: "https://www.coindesk.com/arc/outboundfeeds/rss/" },
  { name: "Cointelegraph", url: "https://cointelegraph.com/rss" }
];

function stripHtml(input = "") {
  return input.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
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

function classify(item) {
  const s = `${item.title} ${stripHtml(item.description || "")}`.toLowerCase();

  if (/(hack|exploit|drain|breach|stolen|attack)/.test(s)) {
    return { level: "urgent", label: "🔴 보안 경보" };
  }
  if (/(sec|lawsuit|regulator|regulation|ban|compliance|court)/.test(s)) {
    return { level: "warn", label: "⚠️ 규제 이슈" };
  }
  if (/(etf|listing|binance|coinbase|approval|launch)/.test(s)) {
    return { level: "info", label: "📣 시장 이벤트" };
  }
  if (/(unlock|vesting|liquidation|outflow|inflow)/.test(s)) {
    return { level: "warn", label: "⏰ 수급 알림" };
  }
  return null;
}

function buildRawText(item) {
  const title = item.title.length > 84 ? item.title.slice(0, 84) + "..." : item.title;
  return `${title} · ${item.source}`;
}

function fallbackTranslate(text) {
  const t = text.toLowerCase();

  if (/(sec).*(etf)/.test(t)) return "SEC의 ETF 관련 결정이나 발언이 시장 심리에 영향을 줄 수 있습니다.";
  if (/(etf)/.test(t)) return "ETF 관련 뉴스로 비트코인과 시장 전반 심리에 영향을 줄 수 있습니다.";
  if (/(hack|exploit|breach|attack|stolen)/.test(t)) return "보안 사고 관련 뉴스로 단기 변동성과 리스크 점검이 필요합니다.";
  if (/(lawsuit|court|regulation|regulator|compliance|ban)/.test(t)) return "규제 이슈 관련 뉴스로 거래소와 토큰 전반 심리에 영향을 줄 수 있습니다.";
  if (/(listing|binance|coinbase|launch)/.test(t)) return "상장 또는 출시 관련 뉴스로 단기 수급 변화 가능성을 체크할 필요가 있습니다.";
  if (/(unlock|vesting|liquidation|outflow|inflow)/.test(t)) return "언락이나 수급 변화 관련 뉴스로 매도 압력과 변동성 확대 가능성을 점검할 필요가 있습니다.";
  return "시장 흐름에 영향을 줄 수 있는 주요 크립토 이벤트입니다.";
}

async function translateToKorean(text) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return fallbackTranslate(text);

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${key}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.2,
        messages: [
          {
            role: "system",
            content: "Translate crypto alert text into concise, natural Korean in one sentence. Do not add markdown or bullet points."
          },
          {
            role: "user",
            content: text
          }
        ]
      })
    });

    if (!res.ok) return fallbackTranslate(text);
    const data = await res.json();
    return data?.choices?.[0]?.message?.content?.trim() || fallbackTranslate(text);
  } catch (_) {
    return fallbackTranslate(text);
  }
}

export async function handler() {
  try {
    const responses = await Promise.all(
      FEEDS.map(async (feed) => {
        const res = await fetch(`${RSS2JSON}${encodeURIComponent(feed.url)}`);
        if (!res.ok) return [];
        const data = await res.json();
        return (data.items || []).slice(0, 10).map((item) => ({ ...item, source: feed.name }));
      })
    );

    const picked = responses.flat()
      .map((item) => ({ item, meta: classify(item) }))
      .filter((x) => x.meta)
      .sort((a, b) => new Date(b.item.pubDate) - new Date(a.item.pubDate))
      .slice(0, 6);

    const alerts = await Promise.all(
      picked.map(async ({ item, meta }) => ({
        level: meta.level,
        label: meta.label,
        text: `${await translateToKorean(buildRawText(item))} <strong>${relativeTime(item.pubDate)}</strong> · ${item.source}`,
        url: item.link || "#"
      }))
    );

    return {
      statusCode: 200,
      headers: { "content-type": "application/json; charset=utf-8" },
      body: JSON.stringify(
        alerts.length
          ? alerts
          : [{
              level: "info",
              label: "📋 안내",
              text: "현재 조건에 맞는 중요 알림이 없습니다.",
              url: "#"
            }]
      )
    };
  } catch (err) {
    return {
      statusCode: 200,
      headers: { "content-type": "application/json; charset=utf-8" },
      body: JSON.stringify([
        {
          level: "info",
          label: "📋 안내",
          text: "중요 알림 데이터를 불러오지 못했습니다.",
          url: "#"
        }
      ])
    };
  }
}
