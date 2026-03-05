import{s as v}from"./supabase-1haNsgbs.js";document.addEventListener("DOMContentLoaded",async()=>{var S;const h=document.querySelector(".nav-menu");if(!h)return;const k=Array.from(h.querySelectorAll(".nav-link")).find(e=>{var i;return((i=e.textContent)==null?void 0:i.trim())==="Ingresá"});await v.auth.refreshSession();const{data:{session:m}}=await v.auth.getSession();if(m){k&&k.remove();try{const{data:e}=await v.from("sy_perfiles").select("nombre, foto_url, rol, oficios").eq("id",m.user.id).single(),i=m.user.user_metadata,C=(i==null?void 0:i.full_name)||(i==null?void 0:i.nombre)||(i==null?void 0:i.name)||((S=m.user.email)==null?void 0:S.split("@")[0])||"Mi Perfil",p=((e==null?void 0:e.nombre)||C).split(" ")[0];let l=e==null?void 0:e.foto_url;if(l&&!l.startsWith("http")&&!l.startsWith("data:")){const{data:s}=v.storage.from("avatars").getPublicUrl(l);l=(s==null?void 0:s.publicUrl)||l}let b=l||(i==null?void 0:i.avatar_url)||(i==null?void 0:i.picture);(!b||b.trim()==="")&&(b=`https://ui-avatars.com/api/?name=${encodeURIComponent(p)}&background=3ba8e0&color=fff`);const w=((e==null?void 0:e.rol)||(i==null?void 0:i.role)||(e?"cliente":"none")).toLowerCase();let g=w;(w==="worker"||w==="trabajador")&&(g="prestador");let L=!1;e!=null&&e.oficios&&(Array.isArray(e.oficios)?L=e.oficios.length>0:typeof e.oficios=="string"&&e.oficios.trim()!==""&&(L=!0));const n=window.location.pathname.includes("/admin/")||window.location.pathname.includes("/trabajador/")||window.location.pathname.includes("/cliente/")?"../":"./";let c=n,f="Mi Panel",u="bi-grid-fill";g==="admin"?(c=n+"admin/index.html",f="Panel Admin"):g==="prestador"?L?c=n+"trabajador/index.html":(c=n+"registro-verifi.html",f="Completar Postulación",u="bi-card-checklist"):g==="cliente"?(c=n+"cliente/index.html",f="Mi Panel",u="bi-person-badge"):(c=n+"perfil.html",f="Completar Perfil",u="bi-person-plus-fill");const q=`
                <div class="nav-profile" id="profile-trigger">
                    <img src="${b}" alt="${p}">
                    <span class="user-name d-none d-md-inline">${p}</span>
                    <i class="bi bi-chevron-down small"></i>
                    
                    <div class="profile-dropdown" id="profile-dropdown">
                        <div class="px-3 py-2 border-bottom mb-2 d-md-none">
                            <small class="text-muted d-block">Conectado como</small>
                            <span class="fw-bold">${p}</span>
                        </div>
                        <a href="${c}" class="dropdown-item">
                            <i class="bi ${u}"></i> ${f}
                        </a>
                        <a href="${n}perfil.html" class="dropdown-item">
                            <i class="bi bi-gear-fill"></i> Mi Configuración
                        </a>
                        <div class="dropdown-divider"></div>
                        <a href="#" class="dropdown-item logout" id="btn-navbar-logout">
                            <i class="bi bi-box-arrow-right"></i> Cerrar Sesión
                        </a>
                    </div>
                </div>
            `;h.insertAdjacentHTML("beforeend",q);const y=document.getElementById("profile-trigger"),d=document.getElementById("profile-dropdown");y==null||y.addEventListener("click",s=>{s.target.closest(".dropdown-item")||(s.stopPropagation(),d==null||d.classList.toggle("show"))}),document.addEventListener("click",()=>{d==null||d.classList.remove("show")});const o=document.getElementById("mobile-menu-btn"),t=document.getElementById("nav-menu");o==null||o.addEventListener("click",s=>{var r,a;s.stopPropagation(),t==null||t.classList.toggle("active"),(r=o.querySelector("i"))==null||r.classList.toggle("bi-list"),(a=o.querySelector("i"))==null||a.classList.toggle("bi-x")}),document.addEventListener("click",s=>{var a,x;const r=s.target;!(t!=null&&t.contains(r))&&!(o!=null&&o.contains(r))&&(t==null||t.classList.remove("active"),(a=o==null?void 0:o.querySelector("i"))==null||a.classList.add("bi-list"),(x=o==null?void 0:o.querySelector("i"))==null||x.classList.remove("bi-x"))}),t==null||t.querySelectorAll(".nav-link, .dropdown-item").forEach(s=>{s.addEventListener("click",()=>{var r,a;t.classList.remove("active"),(r=o==null?void 0:o.querySelector("i"))==null||r.classList.add("bi-list"),(a=o==null?void 0:o.querySelector("i"))==null||a.classList.remove("bi-x")})})}catch(e){console.error("Error loading navbar profile:",e)}}});
