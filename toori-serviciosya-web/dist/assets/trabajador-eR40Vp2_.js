import{s as d}from"./supabase-1haNsgbs.js";document.addEventListener("DOMContentLoaded",async()=>{var N;const B=document.getElementById("page-loader"),$=document.getElementById("app-header"),q=document.getElementById("main-content"),T=document.getElementById("bottom-nav"),A=document.getElementById("span-nombre"),v=document.getElementById("label-view-title"),_=document.getElementById("btn-logout"),h=document.getElementById("btn-refresh"),w=document.getElementById("jobs-container"),L=document.getElementById("empty-state"),n=document.getElementById("empty-message"),c=document.getElementById("nav-trabajos"),l=document.getElementById("nav-ofertas"),m=document.getElementById("nav-historial");let a="trabajos";const{data:{session:f},error:H}=await d.auth.getSession();if(!f||H){window.location.href="/login.html";return}const{data:o,error:W}=await d.from("sy_perfiles").select("rol, nombre, foto_url, oficios").eq("id",f.user.id).single(),E=((o==null?void 0:o.rol)||"").toLowerCase(),S=E==="prestador"||E==="worker"||E==="trabajador";if(W||!S&&E!=="admin"){alert("Acceso denegado: este panel es exclusivo para trabajadores."),window.location.href="/perfil.html";return}let k=!1;if(o!=null&&o.oficios&&(Array.isArray(o.oficios)?k=o.oficios.length>0:typeof o.oficios=="string"&&o.oficios.trim()!==""&&(k=!0)),S&&!k){alert("Configuración incompleta: Por favor completa tu postulacion de servicios para acceder a este panel de trabajador."),window.location.href="/registro-verifi.html";return}B&&B.classList.add("d-none"),$&&$.classList.remove("d-none"),q&&q.classList.remove("d-none"),T&&T.classList.remove("d-none");const s=f.user.user_metadata,R=(s==null?void 0:s.full_name)||(s==null?void 0:s.nombre)||(s==null?void 0:s.name)||((N=f.user.email)==null?void 0:N.split("@")[0])||"Trabajador",D=((o==null?void 0:o.nombre)||R).split(" ")[0];A&&(A.textContent=D);let u=o==null?void 0:o.foto_url;if(u&&!u.startsWith("http")&&!u.startsWith("data:")){const{data:e}=d.storage.from("avatars").getPublicUrl(u);u=(e==null?void 0:e.publicUrl)||u}const V=u||(s==null?void 0:s.avatar_url)||(s==null?void 0:s.picture)||`https://ui-avatars.com/api/?name=${encodeURIComponent(D)}&background=3b82f6&color=fff`,C=document.getElementById("worker-avatar");C&&(C.src=V,C.style.display="block");async function p(){var M;if(!w||!L||!v)return;w.querySelectorAll(".job-card").forEach(r=>r.remove()),L.classList.add("d-none"),w.innerHTML+='<div id="loading-spinner" class="text-center py-5"><div class="spinner-border text-info" role="status"></div></div>';try{let r=d.from("sy_pedidos").select(`
                id, categoria, zona, descripcion, estado, created_at,
                cliente_id,
                sy_perfiles!cliente_id(nombre, telefono)
            `);a==="trabajos"?(v.textContent="Mis Trabajos Activos",n&&(n.textContent="No tienes trabajos asignados actualmente."),r=r.eq("prestador_id",f.user.id).eq("estado","en_proceso")):a==="historial"?(v.textContent="Historial de Servicios",n&&(n.textContent="Aún no has completado servicios en Toori."),r=r.eq("prestador_id",f.user.id).eq("estado","completado")):a==="ofertas"&&(v.textContent="Explorar Ofertas",n&&(n.textContent="No hay nuevas solicitudes en tu zona por ahora."),r=r.is("prestador_id",null).eq("estado","pendiente"));const{data:j,error:U}=await r.order("created_at",{ascending:!1});if((M=document.getElementById("loading-spinner"))==null||M.remove(),U)throw U;if(!j||j.length===0){if(L.classList.remove("d-none"),a==="trabajos"){const{count:t}=await d.from("sy_pedidos").select("*",{count:"exact",head:!0}).is("prestador_id",null).eq("estado","pendiente");t&&t>0&&n&&(n.innerHTML=`No tienes trabajos asignados, pero hay <strong>${t} solicitudes nuevas</strong> esperando en la pestaña <span class="text-info fw-bold">Explorar</span>.`)}return}j.forEach(t=>{const i=Array.isArray(t.sy_perfiles)?t.sy_perfiles[0]:t.sy_perfiles,F=t.id.split("-")[0].toUpperCase(),g=document.createElement("div");g.className="job-card";let I="";a==="trabajos"?I=`
                        <button class="btn btn-success w-100 fw-bold btn-terminar mt-3" data-id="${t.id}" style="padding: 12px; border-radius: 12px;">
                            <i class="bi bi-check-circle me-2"></i> Marcar como Terminado
                        </button>
                    `:a==="ofertas"&&(I=`
                        <button class="btn btn-info text-white w-100 fw-bold btn-tomar mt-3" data-id="${t.id}" style="padding: 12px; border-radius: 12px;">
                            <i class="bi bi-hand-thumbs-up me-2"></i> Tomar este Pedido
                        </button>
                    `),g.innerHTML=`
                    <div class="job-card-header">
                        <div>
                            <h6 class="fw-bold m-0 text-dark">${t.categoria}</h6>
                            <small class="text-muted">Ticket #T-${F}</small>
                        </div>
                        <span class="badge-estado bg-${t.estado}">${t.estado.replace("_"," ")}</span>
                    </div>
                    
                    <div class="job-detail-item">
                        <i class="bi bi-geo-alt-fill"></i>
                        <div>
                            <strong class="d-block text-dark">Zona / Dirección</strong>
                            <span class="text-muted">${t.zona}</span>
                        </div>
                    </div>

                    <div class="job-detail-item">
                        <i class="bi bi-person-fill"></i>
                        <div>
                            <strong class="d-block text-dark">Cliente</strong>
                            <span class="text-muted">${(i==null?void 0:i.nombre)||"Solicitud Web"}</span>
                        </div>
                    </div>

                    ${t.descripcion?`
                    <div class="p-3 w-100 rounded bg-light border text-muted small mt-2">
                        <strong>Descripción:</strong><br>${t.descripcion}
                    </div>`:""}

                    ${I}
                `;const P=g.querySelector(".btn-terminar");P&&P.addEventListener("click",async()=>{if(confirm("¿Confirmas que terminaste este trabajo?")){const{error:y}=await d.from("sy_pedidos").update({estado:"completado"}).eq("id",t.id);if(y)alert("Error: "+y.message);else{if(i!=null&&i.telefono){const O=`Hola ${i.nombre}, ¡ya terminé el servicio de ${t.categoria}! ✅ 

¿Podrías calificarme? 👉 ${window.location.origin}/cliente/index.html`;window.open(`https://wa.me/${i.telefono.replace(/\D/g,"")}?text=${encodeURIComponent(O)}`,"_blank")}p()}}});const z=g.querySelector(".btn-tomar");z&&z.addEventListener("click",async()=>{if(confirm("¿Quieres tomar este pedido? Se te asignará como el profesional a cargo.")){const{error:y}=await d.from("sy_pedidos").update({prestador_id:f.user.id,estado:"en_proceso"}).eq("id",t.id);y?alert("Error: "+y.message):(alert("¡Pedido asignado! Ahora aparece en tu lista de 'Trabajos'."),a="trabajos",x(),p())}}),w.appendChild(g)})}catch(r){console.error(r),alert("Error: "+r.message)}}function x(){[c,l,m].forEach(e=>e==null?void 0:e.classList.remove("active")),a==="trabajos"&&(c==null||c.classList.add("active")),a==="ofertas"&&(l==null||l.classList.add("active")),a==="historial"&&(m==null||m.classList.add("active"))}c==null||c.addEventListener("click",e=>{e.preventDefault(),a="trabajos",x(),p()}),l==null||l.addEventListener("click",e=>{e.preventDefault(),a="ofertas",x(),p()}),m==null||m.addEventListener("click",e=>{e.preventDefault(),a="historial",x(),p()}),h==null||h.addEventListener("click",()=>{const e=h.querySelector("i");e&&e.classList.add("btn-refresh-spin"),p().finally(()=>{e&&e.classList.remove("btn-refresh-spin")})}),_==null||_.addEventListener("click",async e=>{e.preventDefault(),await d.auth.signOut(),window.location.href="/login.html"});const b=document.getElementById("nav-btn-panel");b&&(b.style.display="block",b.setAttribute("href","#"),b.textContent="Dashboard",b.classList.add("active")),p()});
