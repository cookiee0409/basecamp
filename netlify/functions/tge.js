
export async function handler(){

 const projects=[
  {name:"Monad",funding:"$244M",vc:"Paradigm",fdv:"~$3B"},
  {name:"Berachain",funding:"$142M",vc:"Polychain",fdv:"~$1.5B"},
  {name:"MegaETH",funding:"$60M",vc:"Dragonfly",fdv:"~$1B"}
 ]

 return{
  statusCode:200,
  body:JSON.stringify(projects)
 }

}
