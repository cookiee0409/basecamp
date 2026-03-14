
const ids = ["bitcoin","ethereum","solana","binancecoin","avalanche-2","sui","polkadot","matic-network"].join(",");
export async function handler() {
  try {
    const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`, { headers: { "accept":"application/json" } });
    const data = await res.json();
    return { statusCode: 200, headers: { "content-type":"application/json; charset=utf-8" }, body: JSON.stringify(data) };
  } catch (err) {
    return { statusCode: 200, headers: { "content-type":"application/json; charset=utf-8" }, body: JSON.stringify({}) };
  }
}
