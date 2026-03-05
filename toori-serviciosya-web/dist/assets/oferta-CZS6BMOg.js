import{s as a}from"./supabase-1haNsgbs.js";/* empty css             */document.addEventListener("DOMContentLoaded",async()=>{const d=document.getElementById("oferta-detalle-container");if(!d)return;const i=new URLSearchParams(window.location.search).get("id");if(!i){d.innerHTML='<div class="alert alert-warning">No se especificó un ID de oferta.</div>';return}try{const{data:o,error:u}=await a.from("nuevaOferta").select("*").eq("id",i).single();if(u||!o)throw u||new Error("Oferta no encontrada");const{data:l,error:b}=await a.from("presupuestos").select("*").eq("oferta_id",i).order("monto",{ascending:!0}),g=(l||[]).map(e=>`
            <li style="padding: 20px; border-bottom: 1px solid #f0f0f0; display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <div style="font-weight: 700; font-size: 1.25rem; color: var(--toori-blue); margin-bottom: 4px;">$${e.monto}</div>
                    <div style="font-size: 0.9rem; color: var(--text-main); font-weight: 500;">${e.descripcion||"Sin nota adicional"}</div>
                    ${e.matriculado?'<span style="font-size: 0.7rem; background: #e3f2fd; color: #1976d2; padding: 2px 8px; border-radius: 4px; margin-top: 8px; display: inline-block;">Matriculado</span>':""}
                </div>
                <span style="background: ${e.estado==="seleccionado"?"var(--toori-green)":"var(--toori-gray)"}; color: white; padding: 4px 12px; border-radius: 50px; font-size: 0.75rem;">${e.estado}</span>
            </li>
        `).join("");d.innerHTML=`
            <div class="detail-grid">
                <!-- Left: Offer Detail -->
                <div>
                    <div class="card-premium" style="margin-bottom: 32px; padding: 40px;">
                        <span style="background: var(--toori-blue); color: white; padding: 4px 12px; border-radius: 50px; font-size: 0.75rem; margin-bottom: 1rem; display: inline-block;">Gestión Activa</span>
                        <h2 style="margin-bottom: 1.5rem; font-size: 2rem;">Pedido #${o.id}</h2>
                        <p style="font-size: 1.25rem; margin-bottom: 2rem; color: var(--text-main); line-height: 1.6;">${o.descripcion||"Detalle del requerimiento en análisis."}</p>
                        <div style="padding-top: 2rem; border-top: 1px solid #eee;">
                            <p class="text-muted" style="font-size: 0.9rem;"><i class="bi bi-shield-check"></i> Gestión con Respaldo Toori • ID: <span style="font-weight: 600; color: var(--toori-dark);">${o.id}</span></p>
                        </div>
                    </div>

                    <div class="card-premium" style="padding: 40px;">
                        <h4 style="margin-bottom: 2rem; font-family: var(--font-body); font-weight: 700;">Propuestas de Profesionales (${(l==null?void 0:l.length)||0})</h4>
                        <ul style="list-style: none; padding: 0;">
                            ${g||'<li class="text-muted">Aún no hay presupuestos. ¡Sé el primero!</li>'}
                        </ul>
                        
                        <button id="btn-top3" class="btn btn-secondary w-100 mt-4" style="font-size: 0.9rem; padding: 12px;">
                            <i class="bi bi-magic"></i> Seleccionar TOP 3 Automáticamente
                        </button>
                    </div>
                </div>

                <!-- Right: Sticky Form -->
                <div style="position: sticky; top: 120px; align-self: start;">
                    <div class="card-premium" style="padding: 40px; background: white;">
                        <h4 style="margin-bottom: 1.5rem; font-family: var(--font-body); font-weight: 700;">Postularme a este pedido</h4>
                        <p class="text-muted mb-4" style="font-size: 0.9rem;">Tu propuesta será analizada por nuestro equipo de gestión antes de ser presentada al cliente.</p>
                        <form id="presupuesto-form">
                            <div class="form-group">
                                <label for="form-monto">Tu presupuesto estimado ($)</label>
                                <input type="number" id="form-monto" class="form-control" placeholder="Ej: 5000" required>
                                <p style="font-size: 0.75rem; color: var(--text-muted); mt-1">Sujeto a validación técnica.</p>
                            </div>
                            <div class="form-group">
                                <label for="form-desc">Nota para el seleccionador</label>
                                <textarea id="form-desc" class="form-control" rows="5" placeholder="Detallá tu experiencia y por qué sos ideal para este trabajo..." required></textarea>
                            </div>
                            <button type="submit" id="btn-enviar" class="btn btn-primary w-100" style="padding: 16px;">
                                Enviar para revisión
                            </button>
                            <div id="form-alert" class="mt-4" style="display: none; padding: 16px; border-radius: 12px; font-size: 0.9rem; text-align: center;"></div>
                        </form>
                    </div>
                </div>
            </div>
        `;const c=document.getElementById("presupuesto-form");c==null||c.addEventListener("submit",async e=>{e.preventDefault();const n=document.getElementById("btn-enviar"),r=document.getElementById("form-alert");if(r){n.disabled=!0,n.innerHTML='<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Enviando...';try{const t=document.getElementById("form-monto").value,s=document.getElementById("form-desc").value,{data:p}=await a.from("workers").select("user_id").limit(1),v=p&&p.length>0?p[0].user_id:null,{error:f}=await a.from("presupuestos").insert([{oferta_id:parseInt(i),worker_user_id:v,monto:parseFloat(t),descripcion:s,estado:"enviado"}]);if(f)throw f;r.className="mt-3 alert alert-success",r.innerText="¡Presupuesto enviado exitosamente!",setTimeout(()=>window.location.reload(),1500)}catch(t){console.error(t),r.className="mt-3 alert alert-danger",r.innerText="Error: "+t.message,n.disabled=!1,n.innerHTML="Enviar Presupuesto"}}});const m=document.getElementById("btn-top3");m==null||m.addEventListener("click",async()=>{try{const{data:e}=await a.from("presupuestos").select("id, monto, matriculado").eq("oferta_id",i);if(!e||e.length===0)return;const r=e.sort((t,s)=>t.matriculado&&!s.matriculado?-1:!t.matriculado&&s.matriculado?1:(t.monto||0)-(s.monto||0)).slice(0,3).map(t=>t.id);r.length>0&&(await a.from("presupuestos").update({estado:"seleccionado"}).in("id",r),alert("¡Top 3 seleccionado!"),window.location.reload())}catch(e){console.error("Error top 3:",e),alert("Error seleccionando Top 3")}})}catch(o){console.error("Error cargando detalle:",o),d.innerHTML=`
            <div class="alert alert-danger" role="alert">
                Error al cargar el detalle: ${o.message}
            </div>
        `}});
