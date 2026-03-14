
async function loadAlerts(){

 const res = await fetch('/.netlify/functions/alerts')
 const alerts = await res.json()

 const el = document.getElementById('alerts')

 el.innerHTML = alerts.map(a=>`
  <div class="card">
    <strong>${a.label}</strong><br>
    ${a.text}
  </div>
 `).join('')
}
