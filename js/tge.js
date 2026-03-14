
async function loadTGE(){

 const res = await fetch('/.netlify/functions/tge')
 const items = await res.json()

 const el = document.getElementById('tge')

 el.innerHTML = items.map(p=>`
  <div class="card">
   <strong>${p.name}</strong><br>
   Funding: ${p.funding}<br>
   VC: ${p.vc}<br>
   예상 FDV: ${p.fdv}
  </div>
 `).join('')

}
