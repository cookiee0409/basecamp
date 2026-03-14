
const RSS2JSON = "https://api.rss2json.com/v1/api.json?rss_url=";
const FEEDS = [
  { name: "CoinDesk", url: "https://www.coindesk.com/arc/outboundfeeds/rss/" },
  { name: "Cointelegraph", url: "https://cointelegraph.com/rss" }
];
function stripHtml(input = "") { return input.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim(); }
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
  if (/(hack|exploit|drain|breach|stolen|attack)/.test(s)) return { level:"urgent", label:"🔴 보안 경보" };
  if (/(sec|lawsuit|regulator|regulation|ban|compliance|court)/.test(s)) return { level:"warn", label:"⚠️ 규제 이슈" };
  if (/(etf|listing|binance|coinbase|approval|launch)/.test(s)) return { level:"info", label:"📣 시장 이벤트" };
  if (/(unlock|vesting|liquidation|outflow|inflow)/.test(s)) return { level:"warn", label:"⏰ 수급 알림" };
  return null;
}
function buildText(item) {
  const title = item.title.length > 84 ? item.title.slice(0, 84) + "..." : item.title;
  return `${title} <strong>${relativeTime(item.pubDate)}</strong> · ${item.source}`;
}
export async function handler() {
  try {
    const responses = await Promise.all(FEEDS.map(async (feed) => {
      const res = await fetch(`${RSS2JSON}${encodeURIComponent(feed.url)}`);
      const data = await res.json();
      return (data.items || []).slice(0, 10).map((item) => ({ ...item, source: feed.name }));
    }));
    const alerts = responses.flat()
      .map((item) => ({ item, meta: classify(item) }))
      .filter((x) => x.meta)
      .sort((a,b) => new Date(b.item.pubDate) - new Date(a.item.pubDate))
      .slice(0, 6)
      .map(({ item, meta }) => ({ level: meta.level, label: meta.label, text: buildText(item), url: item.link || "#" }));
    return {
      statusCode: 200,
      headers: { "content-type":"application/json; charset=utf-8" },
      body: JSON.stringify(alerts.length ? alerts : [{ level:"info", label:"📋 안내", text:"현재 조건에 맞는 중요 알림이 없습니다.", url:"#"}])
    };
  } catch (err) {
    return {
      statusCode: 200,
      headers: { "content-type":"application/json; charset=utf-8" },
      body: JSON.stringify([{ level:"info", label:"📋 안내", text:"중요 알림 데이터를 불러오지 못했습니다.", url:"#"}])
    };
  }
}
