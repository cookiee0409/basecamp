
async function loadNews(){

 const res = await fetch('/.netlify/functions/news')
 const items = await res.json()

 const el = document.getElementById('news')

 el.innerHTML = items.map(n=>`
   <div class="card">
     <strong>${n.headline}</strong><br>
     <small>${n.source}</small>
   </div>
 `).join('')
}
