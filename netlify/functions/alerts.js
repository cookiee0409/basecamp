
export async function handler(){

 const alerts=[
  {label:"시장",text:"비트코인 변동성 확대"},
  {label:"토큰 언락",text:"ARB Unlock 예정"},
  {label:"에어드랍",text:"EigenLayer 클레임 진행 중"}
 ]

 return{
  statusCode:200,
  body:JSON.stringify(alerts)
 }

}
