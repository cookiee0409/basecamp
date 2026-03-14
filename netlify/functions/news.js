
export async function handler(){

try{

const r=await fetch("https://api.rss2json.com/v1/api.json?rss_url=https://www.coindesk.com/arc/outboundfeeds/rss/")
const j=await r.json()

const items=j.items.slice(0,7)

const news=items.map(i=>({
title:i.title,
summary:"크립토 시장 주요 뉴스 요약",
source:"CoinDesk",
url:i.link
}))

return{
statusCode:200,
body:JSON.stringify(news)
}

}catch{

return{
statusCode:200,
body:"[]"
}

}

}
