
function fallbackEvents() {
  const today = new Date();
  const add = (days, name, tag, type) => {
    const d = new Date(today);
    d.setDate(d.getDate() + days);
    return { date: d.toISOString(), name, tag, type };
  };
  return [
    add(1, "BTC ETF Related Event", "COINMARKETCAL · 예시 일정", "listing"),
    add(3, "Ethereum Upgrade Watch", "COINMARKETCAL · 예시 일정", "tge"),
    add(5, "Solana Ecosystem Event", "COINMARKETCAL · 예시 일정", "listing"),
    add(6, "Token Unlock Watch", "COINMARKETCAL · 예시 일정", "unlock"),
    add(7, "Exchange Listing Watch", "COINMARKETCAL · 예시 일정", "listing")
  ];
}

function normalizeType(title = "", categories = []) {
  const s = `${title} ${(categories || []).join(" ")}`.toLowerCase();
  if (/(listing|exchange)/.test(s)) return "listing";
  if (/(mainnet|launch|token generation|tge)/.test(s)) return "tge";
  return "unlock";
}

export async function handler() {
  const apiKey = process.env.COINMARKETCAL_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 200,
      headers: { "content-type":"application/json; charset=utf-8" },
      body: JSON.stringify(fallbackEvents())
    };
  }

  try {
    const url = "https://developers.coinmarketcal.com/v1/events";
    const params = new URLSearchParams({
      max: "10",
      page: "1"
    });

    const res = await fetch(`${url}?${params.toString()}`, {
      headers: {
        "x-api-key": apiKey,
        "accept": "application/json"
      }
    });
    if (!res.ok) throw new Error("coinmarketcal failed");
    const data = await res.json();
    const items = Array.isArray(data?.body) ? data.body : (Array.isArray(data) ? data : []);

    const mapped = items.slice(0, 8).map((item) => ({
      date: item.date_event || item.created_date || new Date().toISOString(),
      name: item.title || item.caption || "Crypto Event",
      tag: `COINMARKETCAL · ${(item.coin?.symbol || item.category || "EVENT")}`,
      type: normalizeType(item.title || "", Array.isArray(item.categories) ? item.categories.map(c => c.name || c) : [])
    }));

    return {
      statusCode: 200,
      headers: { "content-type":"application/json; charset=utf-8" },
      body: JSON.stringify(mapped.length ? mapped : fallbackEvents())
    };
  } catch (err) {
    return {
      statusCode: 200,
      headers: { "content-type":"application/json; charset=utf-8" },
      body: JSON.stringify(fallbackEvents())
    };
  }
}
