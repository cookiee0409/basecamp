
function ymd(date) {
  return date.toISOString().slice(0, 10);
}

function startOfTodayUtc() {
  const d = new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function normalizeUnlockPayload(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.events)) return payload.events;
  return [];
}

function fallbackEvents() {
  const today = new Date();
  const add = (days, name, tag, type) => {
    const d = new Date(today);
    d.setDate(d.getDate() + days);
    return { date: d.toISOString(), name, tag, type };
  };
  return [
    add(1, "ARB Token Unlock", "TOKEN UNLOCK · 예시 일정", "unlock"),
    add(4, "APT Token Unlock", "TOKEN UNLOCK · 예시 일정", "unlock"),
    add(7, "OP Token Unlock", "TOKEN UNLOCK · 예시 일정", "unlock"),
    add(11, "SUI Token Unlock", "TOKEN UNLOCK · 예시 일정", "unlock"),
    add(15, "STRK Token Unlock", "TOKEN UNLOCK · 예시 일정", "unlock")
  ];
}

export async function handler() {
  const apiKey = process.env.TOKENOMIST_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 200,
      headers: { "content-type": "application/json; charset=utf-8" },
      body: JSON.stringify(fallbackEvents())
    };
  }

  try {
    const today = startOfTodayUtc();
    const end = new Date(today);
    end.setUTCDate(end.getUTCDate() + 30);

    const tokenListRes = await fetch("https://api.unlocks.app/v2/token/list", {
      headers: { "x-api-key": apiKey, "accept": "application/json" }
    });
    if (!tokenListRes.ok) throw new Error("token list failed");
    const tokenListJson = await tokenListRes.json();
    const tokenList = Array.isArray(tokenListJson?.data) ? tokenListJson.data : [];

    const wanted = ["ARB", "APT", "OP", "SUI", "STRK", "SEI", "IMX", "ONDO"];
    const selected = tokenList.filter(t => wanted.includes(String(t.symbol || "").toUpperCase())).slice(0, 8);

    const results = await Promise.all(selected.map(async token => {
      const url = `https://api.unlocks.app/v4/unlock/events?tokenId=${encodeURIComponent(token.id)}&start=${ymd(today)}&end=${ymd(end)}`;
      const res = await fetch(url, {
        headers: { "x-api-key": apiKey, "accept": "application/json" }
      });
      if (!res.ok) return [];
      const json = await res.json();
      const rows = normalizeUnlockPayload(json);
      return rows.map(row => ({
        date: row.unlockDate || row.date || row.timestamp,
        name: `${row.tokenSymbol || token.symbol} Token Unlock`,
        tag: "TOKEN UNLOCK · LIVE DATA",
        type: "unlock"
      }));
    }));

    const merged = results.flat()
      .filter(x => x.date)
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(0, 8);

    return {
      statusCode: 200,
      headers: { "content-type": "application/json; charset=utf-8" },
      body: JSON.stringify(merged.length ? merged : fallbackEvents())
    };
  } catch (err) {
    return {
      statusCode: 200,
      headers: { "content-type": "application/json; charset=utf-8" },
      body: JSON.stringify(fallbackEvents())
    };
  }
}
