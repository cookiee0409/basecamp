
async function loadTicker(){

 const res = await fetch('/.netlify/functions/ticker')
 const data = await res.json()

 const el = document.getElementById('ticker')

 const tickers=[
  {name:'BTC',v:data.bitcoin.usd},
  {name:'ETH',v:data.ethereum.usd},
  {name:'SOL',v:data.solana.usd}
 ]

 el.innerHTML=tickers.map(t=>`
   <div>$${t.v} ${t.name}</div>
 `).join('')

}
