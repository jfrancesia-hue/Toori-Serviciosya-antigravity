import{s as c}from"./supabase-1haNsgbs.js";/* empty css             */document.addEventListener("DOMContentLoaded",async()=>{var B;const y=document.getElementById("page-loader"),h=document.getElementById("app-header"),E=document.getElementById("main-content"),w=document.getElementById("bottom-nav"),_=document.getElementById("span-nombre"),L=document.getElementById("btn-logout"),I=document.getElementById("btn-refresh"),f=document.getElementById("pedidos-list"),u=document.getElementById("empty-state"),{data:{session:l},error:T}=await c.auth.getSession();if(!l||T){window.location.href="/login.html";return}const{data:s,error:M}=await c.from("sy_perfiles").select("rol, nombre").eq("id",l.user.id).single();if(M||(s==null?void 0:s.rol)!=="cliente"&&(s==null?void 0:s.rol)!=="admin"){alert("Configuración incompleta: Por favor completa tu perfil primero."),window.location.href="/perfil.html";return}y&&y.classList.add("d-none"),h&&h.classList.remove("d-none"),E&&E.classList.remove("d-none"),w&&w.classList.remove("d-none");const r=l.user.user_metadata,k=(r==null?void 0:r.full_name)||(r==null?void 0:r.nombre)||(r==null?void 0:r.name)||((B=l.user.email)==null?void 0:B.split("@")[0])||"Cliente",A=((s==null?void 0:s.nombre)||k).split(" ")[0];_&&(_.textContent=A);async function p(){var x;if(!(!f||!u)){f.innerHTML='<div id="loading-spinner" class="text-center py-4"><div class="spinner-border text-info" role="status"></div></div>',u.classList.add("d-none");try{const{data:o,error:C}=await c.from("sy_pedidos").select(`
                    id, categoria, descripcion, estado, created_at, prestador_id,
                    sy_perfiles!prestador_id(nombre, foto_url)
                `).eq("cliente_id",l.user.id).order("created_at",{ascending:!1});if((x=document.getElementById("loading-spinner"))==null||x.remove(),C)throw C;if(!o||o.length===0){u.classList.remove("d-none");return}let $=new Set;try{const e=o.map(a=>a.id),{data:t}=await c.from("sy_resenas").select("pedido_id").in("pedido_id",e);t&&t.forEach(a=>$.add(a.pedido_id))}catch(e){console.warn("Podes ignorar si falla traer reseñas: ",e)}const P=o.map(e=>{const t=Array.isArray(e.sy_perfiles)?e.sy_perfiles[0]:e.sy_perfiles,a=new Date(e.created_at).toLocaleDateString(),n=$.has(e.id);let d="";return e.estado==="completado"&&!n?d=`<button class="btn btn-warning btn-sm w-100 fw-bold mt-2 rounded-pill btn-calificar" data-pedido-id="${e.id}">
                        <i class="bi bi-star-fill me-1"></i> Calificar Servicio
                    </button>`:n&&(d=`<div class="text-success small fw-bold mt-2 text-center">
                        <i class="bi bi-check-circle-fill me-1"></i> Servicio Calificado
                    </div>`),`
                    <div class="pedido-card">
                        <div class="d-flex justify-content-between align-items-start mb-3">
                            <div>
                                <h6 class="fw-bold m-0">${e.categoria}</h6>
                                <small class="text-muted">${a}</small>
                            </div>
                            <span class="badge-estado bg-${e.estado}">${e.estado.replace("_"," ")}</span>
                        </div>
                        
                        <div class="p-2 bg-light rounded mb-3 small border">
                            <strong>Tu pedido:</strong> ${e.descripcion||"Sin descripción."}
                        </div>

                        ${t?`
                        <div class="d-flex align-items-center gap-2 mb-2 p-2 border-top">
                            <a href="/perfil-trabajador.html?id=${e.prestador_id}" class="text-decoration-none d-flex align-items-center gap-2">
                                <img src="${t.foto_url||`https://ui-avatars.com/api/?name=${t.nombre}`}" style="width:30px; height:30px; border-radius:50%; object-fit:cover;">
                                <div class="small">
                                    <span class="text-muted">Trabajador:</span> <strong class="text-primary">${t.nombre}</strong>
                                </div>
                            </a>
                        </div>`:""}

                        ${d}
                    </div>
                `}).join("");f.innerHTML=P;const j=document.getElementById("modalCalificar"),S=new window.bootstrap.Modal(j),g=document.getElementById("input-pedido-id"),b=document.getElementById("input-rating"),q=document.getElementById("star-selector"),v=document.querySelectorAll(".rating-star"),m=document.getElementById("form-calificar"),i=document.getElementById("rating-error");v.forEach(e=>{e.addEventListener("click",()=>{const t=e.getAttribute("data-value");b.value=t||"",v.forEach(a=>{const n=a.getAttribute("data-value");parseInt(n)<=parseInt(t)?a.classList.replace("bi-star","bi-star-fill"):a.classList.replace("bi-star-fill","bi-star")})})}),document.querySelectorAll(".btn-calificar").forEach(e=>{e.addEventListener("click",()=>{const t=e.dataset.pedidoId;g&&(g.value=t||""),m&&m.reset(),v.forEach(a=>a.classList.replace("bi-star-fill","bi-star")),i&&i.classList.add("d-none"),S.show()})}),m&&m.addEventListener("submit",async e=>{if(e.preventDefault(),!b.value){i&&(i.textContent="Por favor seleccioná una puntuación.",i.classList.remove("d-none"));return}const t=document.getElementById("btn-submit-rating"),a=t.innerHTML;t.disabled=!0,t.innerHTML='<span class="spinner-border spinner-border-sm"></span> Enviando...';try{const{data:n,error:d}=await c.rpc("fn_crear_resena_verificada",{p_pedido_id:g.value,p_rating:parseInt(b.value),p_comentario:document.getElementById("comment-text").value,p_canal:"web"});if(d)throw d;if(n&&!n.success)throw new Error(n.message);S.hide(),alert("¡Gracias por tu calificación!"),p()}catch(n){i&&(i.textContent=n.message||"Error al enviar la calificación.",i.classList.remove("d-none"))}finally{t.disabled=!1,t.innerHTML=a}})}catch(o){console.error(o),alert("Error cargando tus pedidos: "+o.message)}}}await p(),I&&I.addEventListener("click",()=>{p()}),L&&L.addEventListener("click",async()=>{await c.auth.signOut(),window.location.href="/login.html"})});
