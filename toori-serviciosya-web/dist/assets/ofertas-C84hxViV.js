import{s as d}from"./supabase-BjQwphcd.js";document.addEventListener("DOMContentLoaded",async()=>{const t=document.getElementById("ofertas-container"),a=document.getElementById("loading-ofertas");if(!(!t||!a))try{const{data:e,error:r}=await d.from("nuevaOferta").select("*").eq("estado","pendiente").order("id",{ascending:!1});if(r)throw r;if(a.style.display="none",!e||e.length===0){t.innerHTML=`
                <div class="col-12 text-center mt-5">
                    <h4>No hay ofertas pendientes en este momento.</h4>
                    <p class="text-muted">Vuelve más tarde para ver nuevas oportunidades.</p>
                </div>
            `;return}let n="";e.forEach(s=>{n+=`
                <div class="col-md-6 col-lg-4 mb-4">
                    <div class="card h-100 shadow-sm" style="border-radius: 12px; border: 1px solid #e0e0e0;">
                        <div class="card-body d-flex flex-column">
                            <div class="d-flex justify-content-between align-items-center mb-2">
                                <span class="badge bg-success">Nueva Oferta</span>
                                <span class="text-muted small">ID: #${s.id}</span>
                            </div>
                            <h5 class="card-title mt-2 mb-3 text-truncate" style="max-height: 48px; overflow: hidden;">
                                ${s.descripcion||"Sin descripción"}
                            </h5>
                            <p class="card-text text-muted mb-4">
                                <i class="bi bi-telephone"></i> ${s.cliente_telefono||"No provisto"}
                            </p>
                            <div class="mt-auto">
                                <a href="oferta.html?id=${s.id}" class="btn btn-outline-primary w-100" style="border-color: #00bfa6; color: #00bfa6;">
                                    Ver Detalles y Enviar Presupuesto
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            `}),t.innerHTML=n}catch(e){console.error("Error cargando ofertas:",e),a.style.display="none",t.innerHTML=`
            <div class="col-12 text-center mt-5">
                <div class="alert alert-danger" role="alert">
                    Error al cargar las ofertas: ${e.message}
                </div>
            </div>
        `}});
