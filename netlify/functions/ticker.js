
export async function handler(){

try{

const r=await fetch("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana&vs_currencies=usd")
const j=await r.json()

return{
statusCode:200,
body:JSON.stringify(j)
}

}catch{

return{
statusCode:200,
body:"{}"
}

}

}
