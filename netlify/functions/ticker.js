
export async function handler(){

 const res = await fetch(
 "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana&vs_currencies=usd"
 )

 const data = await res.json()

 return{
  statusCode:200,
  body:JSON.stringify(data)
 }

}
