import{s as a}from"./supabase-1haNsgbs.js";document.addEventListener("DOMContentLoaded",async()=>{var h,w;const b=document.querySelector(".nav-menu");if(!b)return;const v=Array.from(b.querySelectorAll(".nav-link")).find(e=>{var o;return((o=e.textContent)==null?void 0:o.trim())==="Ingresá"});await a.auth.refreshSession();const{data:{session:l}}=await a.auth.getSession();if(l){v&&v.remove();try{const{data:e}=await a.from("sy_perfiles").select("nombre, foto_url, rol, oficios").eq("id",l.user.id).single(),o=l.user.user_metadata,y=(o==null?void 0:o.full_name)||(o==null?void 0:o.nombre)||(o==null?void 0:o.name)||((h=l.user.email)==null?void 0:h.split("@")[0])||"Mi Perfil",d=((e==null?void 0:e.nombre)||y).split(" ")[0];let t=e==null?void 0:e.foto_url;if(t&&!t.startsWith("http")&&!t.startsWith("data:")){const{data:i}=a.storage.from("avatars").getPublicUrl(t);t=(i==null?void 0:i.publicUrl)||t}let c=t||(o==null?void 0:o.avatar_url)||(o==null?void 0:o.picture);(!c||c.trim()==="")&&(c=`https://ui-avatars.com/api/?name=${encodeURIComponent(d)}&background=3ba8e0&color=fff`);const p=((e==null?void 0:e.rol)||(o==null?void 0:o.role)||(e?"cliente":"none")).toLowerCase();let f=p;(p==="worker"||p==="trabajador")&&(f="prestador");let u=!1;e!=null&&e.oficios&&(Array.isArray(e.oficios)?u=e.oficios.length>0:typeof e.oficios=="string"&&e.oficios.trim()!==""&&(u=!0));let r="/",s="Mi Panel",m="bi-grid-fill";f==="admin"?(r="/admin/index.html",s="Panel Admin"):f==="prestador"?u?r="/trabajador/index.html":(r="/registro-verifi.html",s="Completar Postulación",m="bi-card-checklist"):f==="cliente"?(r="/cliente/index.html",s="Mi Panel",m="bi-person-badge"):(r="/perfil.html",s="Completar Perfil",m="bi-person-plus-fill");const L=`
                <div class="nav-profile" id="profile-trigger">
                    <img src="${c}" alt="${d}">
                    <span class="user-name d-none d-md-inline">${d}</span>
                    <i class="bi bi-chevron-down small"></i>
                    
                    <div class="profile-dropdown" id="profile-dropdown">
                        <div class="px-3 py-2 border-bottom mb-2 d-md-none">
                            <small class="text-muted d-block">Conectado como</small>
                            <span class="fw-bold">${d}</span>
                        </div>
                        <a href="${r}" class="dropdown-item">
                            <i class="bi ${m}"></i> ${s}
                        </a>
                        <a href="/perfil.html" class="dropdown-item">
                            <i class="bi bi-gear-fill"></i> Mi Configuración
                        </a>
                        <div class="dropdown-divider"></div>
                        <a href="#" class="dropdown-item logout" id="btn-navbar-logout">
                            <i class="bi bi-box-arrow-right"></i> Cerrar Sesión
                        </a>
                    </div>
                </div>
            `;b.insertAdjacentHTML("beforeend",L);const g=document.getElementById("profile-trigger"),n=document.getElementById("profile-dropdown");g==null||g.addEventListener("click",i=>{i.target.closest(".dropdown-item")||(i.stopPropagation(),n==null||n.classList.toggle("show"))}),document.addEventListener("click",()=>{n==null||n.classList.remove("show")}),(w=document.getElementById("btn-navbar-logout"))==null||w.addEventListener("click",async i=>{i.preventDefault(),await a.auth.signOut(),window.location.href="/"})}catch(e){console.error("Error loading navbar profile:",e)}}});
