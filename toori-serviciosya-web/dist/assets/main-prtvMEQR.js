import"./main-CkMIK7XV.js";document.addEventListener("DOMContentLoaded",async()=>{const r=document.getElementById("categories-container"),l="5493512139046",d=async()=>{try{const o=["Jardinería","Servicio doméstico temporario","Limpieza corporativa","Refrigeración","Plomería / Gasista","Mantenimiento general","Electricidad"];if(r){r.innerHTML="",o.forEach(i=>{const a=document.createElement("div");a.className="card-premium text-center",a.style.padding="30px 20px";let e="bi-star";const n=i.toLowerCase();n.includes("limp")||n.includes("doméstico")?e="bi-house-heart":n.includes("plom")?e="bi-tools":n.includes("elec")?e="bi-plug-fill":n.includes("gas")?e="bi-fire":n.includes("refrigeración")?e="bi-snow":n.includes("jard")?e="bi-tree-fill":n.includes("mantenimiento")&&(e="bi-wrench-adjustable"),a.innerHTML=`
                        <div style="font-size: 2.5rem; color: var(--toori-blue); margin-bottom: 1rem;"><i class="bi ${e}"></i></div>
                        <h4>${i}</h4>
                        <p class="text-muted mb-3" style="font-size: 0.85rem;">Servicio Gestionado</p>
                        <button class="btn btn-primary dynamic-whatsapp-btn" data-category="${i}"
                            style="padding: 10px 20px; font-size: 0.9rem;">Iniciar gestión</button>
                    `,r.appendChild(a)});const t=document.createElement("div");t.className="card-premium text-center",t.style.padding="30px 20px",t.innerHTML=`
                    <div style="font-size: 2.5rem; color: var(--toori-purple); margin-bottom: 1rem;"><i class="bi bi-grid-fill"></i></div>
                    <h4>Ver todas</h4>
                    <p class="text-muted mb-3" style="font-size: 0.85rem;">Explorar más servicios</p>
                    <a href="/categorias.html" class="btn btn-secondary w-100"
                        style="padding: 10px 20px; font-size: 0.9rem;">Catálogo completo</a>
                `,r.appendChild(t),m()}}catch(o){console.error("Error loading categories:",o)}},m=()=>{document.querySelectorAll(".dynamic-whatsapp-btn, .whatsapp-btn").forEach(t=>{t.addEventListener("click",i=>{i.preventDefault();const a=t.dataset.category;let e="";try{const c=localStorage.getItem("sy_intent");c&&(e=JSON.parse(c).loc||"")}catch{}const n=`Hola! Quiero contratar un servicio.

Servicio: ${a}
Zona: ${e}
Descripción del problema: 

Vengo desde la web de Toori ServiciosYa.`,p=`https://wa.me/${l}?text=${encodeURIComponent(n)}`;window.open(p,"_blank")})})};await d();const s=document.getElementById("btn-ingresar");s==null||s.addEventListener("click",o=>{o.preventDefault(),alert("El sistema de login está en desarrollo. ¡Estamos trabajando para conectarte mejor!")}),document.querySelectorAll('a[href="#"], .btn-secondary').forEach(o=>{var t;(t=o.textContent)!=null&&t.includes("Agendar una demo")&&o.addEventListener("click",i=>{i.preventDefault();const e=`https://wa.me/${l}?text=${encodeURIComponent("¡Hola! Me gustaría agendar una demo de Toori ServiciosYa.")}`;window.open(e,"_blank")})})});
