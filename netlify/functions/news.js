
export async function handler(){

 const rss = await fetch("https://api.rss2json.com/v1/api.json?rss_url=https://www.coindesk.com/arc/outboundfeeds/rss/")
 const data = await rss.json()

 const items = data.items.slice(0,7).map(n=>({
   headline:n.title,
   source:"CoinDesk"
 }))

 return{
  statusCode:200,
  body:JSON.stringify(items)
 }

}
