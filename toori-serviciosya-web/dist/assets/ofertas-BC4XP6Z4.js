import{s as o}from"./supabase-1haNsgbs.js";/* empty css             */import"./navbar-Dr5c-Pai.js";document.addEventListener("DOMContentLoaded",async()=>{const t=document.getElementById("ofertas-container"),r=document.getElementById("loading-ofertas");if(!(!t||!r))try{const{data:e,error:a}=await o.from("nuevaOferta").select("*").eq("estado","pendiente").order("id",{ascending:!1});if(a)throw a;if(r.style.display="none",!e||e.length===0){t.innerHTML=`
                <div class="col-12 text-center mt-5">
                    <h4>No hay ofertas pendientes en este momento.</h4>
                    <p class="text-muted">Vuelve más tarde para ver nuevas oportunidades.</p>
                </div>
            `;return}let i="";e.forEach(n=>{i+=`
                <div class="card-premium" style="display: flex; flex-direction: column; justify-content: space-between;">
                    <div>
                        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 12px;">
                            <span style="background: var(--toori-blue); color: white; padding: 4px 12px; border-radius: 50px; font-size: 0.75rem;">En gestión</span>
                            <span style="font-size: 0.8rem; color: var(--text-muted);">#${n.id}</span>
                        </div>
                        <h3 style="font-size: 1.25rem; margin-bottom: 8px; font-family: var(--font-body); font-weight: 600;">
                            ${n.descripcion||"Sin descripción"}
                        </h3>
                        <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 20px;">
                            <i class="bi bi-geo-alt"></i> Zona de servicio • <i class="bi bi-phone ms-2"></i> ${n.cliente_telefono||"Gestión activa"}
                        </p>
                    </div>
                    <a href="oferta.html?id=${n.id}" class="btn btn-primary w-100" style="padding: 10px; font-size: 0.9rem;">
                        Gestionar pedido
                    </a>
                </div>
            `}),t.innerHTML=i}catch(e){console.error("Error cargando ofertas:",e),r.style.display="none",t.innerHTML=`
            <div class="col-12 text-center mt-5">
                <div class="alert alert-danger" role="alert">
                    Error al cargar las ofertas: ${e.message}
                </div>
            </div>
        `}});
