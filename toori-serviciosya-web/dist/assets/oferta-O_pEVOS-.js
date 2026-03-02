import{s}from"./supabase-BjQwphcd.js";document.addEventListener("DOMContentLoaded",async()=>{const l=document.getElementById("oferta-detalle-container");if(!l)return;const o=new URLSearchParams(window.location.search).get("id");if(!o){l.innerHTML='<div class="alert alert-warning">No se especificó un ID de oferta.</div>';return}try{const{data:r,error:p}=await s.from("nuevaOferta").select("*").eq("id",o).single();if(p||!r)throw p||new Error("Oferta no encontrada");const{data:d,error:w}=await s.from("presupuestos").select("*").eq("oferta_id",o).order("monto",{ascending:!0}),f=(d||[]).map(e=>`
            <li class="list-group-item d-flex justify-content-between align-items-center">
                <span>$${e.monto} - ${e.descripcion||"Sin nota"} 
                    ${e.matriculado?'<span class="badge bg-info ms-2">Matriculado</span>':""}
                </span>
                <span class="badge ${e.estado==="seleccionado"?"bg-success":"bg-secondary"} rounded-pill">${e.estado}</span>
            </li>
        `).join("");l.innerHTML=`
            <div class="card shadow" style="border-radius: 12px; border:none;">
                <div class="card-body p-5">
                    <h2 class="mb-4">Detalle de la Oferta #${r.id}</h2>
                    <div class="mb-4">
                        <span class="badge bg-warning text-dark mb-2">${r.estado}</span>
                        <p class="lead">${r.descripcion||"Sin descripción detallada."}</p>
                        <p class="text-muted"><i class="bi bi-telephone"></i> Teléfono cliente: ${r.cliente_telefono}</p>
                    </div>

                    <hr class="my-4">

                    <div class="row">
                        <div class="col-md-6">
                            <h4 class="mb-3">Enviar Presupuesto</h4>
                            <form id="presupuesto-form">
                                <div class="mb-3">
                                    <label class="form-label">Monto ($)</label>
                                    <input type="number" id="form-monto" class="form-control" required>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Mensaje / Descripción</label>
                                    <textarea id="form-desc" class="form-control" rows="3" required></textarea>
                                </div>
                                <button type="submit" id="btn-enviar" class="btn btn-primary w-100" style="background-color: #00bfa6; border:none;">
                                    Enviar Presupuesto
                                </button>
                                <div id="form-alert" class="mt-3 d-none alert" role="alert"></div>
                            </form>
                        </div>
                        <div class="col-md-6 mt-4 mt-md-0">
                            <h4 class="mb-3">Presupuestos Enviados <span class="badge bg-secondary">${(d==null?void 0:d.length)||0}</span></h4>
                            <ul class="list-group mb-3">
                                ${f||'<li class="list-group-item text-muted">Aún no hay presupuestos. Sé el primero.</li>'}
                            </ul>
                            
                            <!-- ADMIN TOP 3 Selection Button -->
                            <button id="btn-top3" class="btn btn-outline-dark btn-sm w-100 mt-2">
                                <i class="bi bi-magic"></i> Seleccionar TOP 3 Automáticamente (Modo Admin)
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;const c=document.getElementById("presupuesto-form");c==null||c.addEventListener("submit",async e=>{e.preventDefault();const n=document.getElementById("btn-enviar"),a=document.getElementById("form-alert");if(a){n.disabled=!0,n.innerHTML='<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Enviando...';try{const t=document.getElementById("form-monto").value,i=document.getElementById("form-desc").value,{data:u}=await s.from("workers").select("user_id").limit(1),v=u&&u.length>0?u[0].user_id:null,{error:b}=await s.from("presupuestos").insert([{oferta_id:parseInt(o),worker_user_id:v,monto:parseFloat(t),descripcion:i,estado:"enviado"}]);if(b)throw b;a.className="mt-3 alert alert-success",a.innerText="¡Presupuesto enviado exitosamente!",setTimeout(()=>window.location.reload(),1500)}catch(t){console.error(t),a.className="mt-3 alert alert-danger",a.innerText="Error: "+t.message,n.disabled=!1,n.innerHTML="Enviar Presupuesto"}}});const m=document.getElementById("btn-top3");m==null||m.addEventListener("click",async()=>{try{const{data:e}=await s.from("presupuestos").select("id, monto, matriculado").eq("oferta_id",o);if(!e||e.length===0)return;const a=e.sort((t,i)=>t.matriculado&&!i.matriculado?-1:!t.matriculado&&i.matriculado?1:(t.monto||0)-(i.monto||0)).slice(0,3).map(t=>t.id);a.length>0&&(await s.from("presupuestos").update({estado:"seleccionado"}).in("id",a),alert("¡Top 3 seleccionado!"),window.location.reload())}catch(e){console.error("Error top 3:",e),alert("Error seleccionando Top 3")}})}catch(r){console.error("Error cargando detalle:",r),l.innerHTML=`
            <div class="alert alert-danger" role="alert">
                Error al cargar el detalle: ${r.message}
            </div>
        `}});
