const menuToggle=document.querySelector("#menuToggle"),nav=document.querySelector("#nav");
menuToggle?.addEventListener("click",()=>{const open=nav.classList.toggle("open");menuToggle.setAttribute("aria-expanded",String(open));});
nav?.querySelectorAll("a").forEach(a=>a.addEventListener("click",()=>{nav.classList.remove("open");menuToggle?.setAttribute("aria-expanded","false");}));
const observer=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add("is-visible");observer.unobserve(e.target);}}),{threshold:.12});
document.querySelectorAll(".reveal").forEach(el=>observer.observe(el));
const form=document.querySelector("#bookingForm"),dateInput=form?.elements.date,serviceSelect=document.querySelector("#bookingService"),timeInput=document.querySelector("#bookingTime"),feedback=document.querySelector("#formFeedback");
const calendarDialog=document.querySelector("#bookingCalendarDialog"),calendarDays=document.querySelector("#calendarDays"),calendarMonthLabel=document.querySelector("#calendarMonthLabel"),calendarTimes=document.querySelector("#calendarTimes"),calendarTimeGrid=document.querySelector("#calendarTimeGrid"),selectionLabel=document.querySelector("#bookingSelection"),selectionHint=document.querySelector("#bookingSelectionHint"),timeSummary=document.querySelector("#bookingTimeSummary"),timeOptions=document.querySelector("#bookingTimeOptions");
const today=new Date(),localToday=new Date(today.getTime()-today.getTimezoneOffset()*60000).toISOString().slice(0,10),todayDate=new Date(localToday+"T12:00:00");
let calendarMonth=new Date(todayDate.getFullYear(),todayDate.getMonth(),1),availabilityCache=new Map(),selectedDate=null,selectedTime=null,calendarRequest=0;
const phoneInput=form?.elements.phone;phoneInput?.addEventListener("input",()=>{let d=phoneInput.value.replace(/\\D/g,"").slice(0,11);if(d.length>10)d=d.replace(/(\\d{2})(\\d{5})(\\d{4})/,"($1) $2-$3");else if(d.length>6)d=d.replace(/(\\d{2})(\\d{4})(\\d{0,4})/,"($1) $2-$3");else if(d.length>2)d=d.replace(/(\\d{2})(\\d+)/,"($1) $2");phoneInput.value=d;});
async function loadServices(){try{const r=await fetch("/api/services"),d=await r.json();if(!r.ok)throw Error(d.error);serviceSelect.innerHTML='<option value="">Selecione um serviço</option>'+d.services.map(s=>'<option value="'+s.id+'">'+s.name+' · '+s.duration_minutes+' min · '+(s.price_cents/100).toLocaleString("pt-BR",{style:"currency",currency:"BRL"})+'</option>').join();if(!d.services.length)serviceSelect.innerHTML='<option value="">Agendamento temporariamente indisponível</option>';}catch{serviceSelect.innerHTML='<option value="">Não foi possível carregar os serviços</option>';}}
function dateKey(date){return date.getFullYear()+"-"+String(date.getMonth()+1).padStart(2,"0")+"-"+String(date.getDate()).padStart(2,"0");}
function monthName(date){return date.toLocaleDateString("pt-BR",{month:"long",year:"numeric"});}
async function getDaySlots(key){const cacheKey=serviceSelect.value+"|"+key;if(availabilityCache.has(cacheKey))return availabilityCache.get(cacheKey);const q=new URLSearchParams({date:key,serviceId:serviceSelect.value});const r=await fetch("/api/availability?"+q);const d=await r.json();if(!r.ok)throw Error(d.error||"Falha ao consultar agenda");availabilityCache.set(cacheKey,d.slots||[]);return d.slots||[];}
async function renderCalendar(){const request=++calendarRequest;calendarMonthLabel.textContent=monthName(calendarMonth);calendarDays.innerHTML='<p class="calendar-loading">Consultando horários disponíveis...</p>';calendarTimes.hidden=true;calendarTimes.classList.remove("is-visible");if(!serviceSelect.value){calendarDays.innerHTML='<p class="calendar-loading">Selecione um serviço antes de escolher a data.</p>';return;}const year=calendarMonth.getFullYear(),month=calendarMonth.getMonth(),first=new Date(year,month,1),count=new Date(year,month+1,0).getDate(),cells=[];for(let i=0;i<first.getDay();i++)cells.push('<span class="calendar-empty"></span>');for(let day=1;day<=count;day++){const date=new Date(year,month,day),key=dateKey(date),past=key<localToday;cells.push('<button type="button" class="calendar-day '+(past?'is-past':'is-loading')+'" data-date="'+key+'" '+(past?'disabled':'')+'><span>'+day+'</span><i class="day-status"></i></button>');}calendarDays.innerHTML=cells.join();const dates=Array.from(calendarDays.querySelectorAll("[data-date]")).filter(el=>!el.disabled);for(let i=0;i<dates.length;i+=6){await Promise.all(dates.slice(i,i+6).map(async el=>{try{const slots=await getDaySlots(el.dataset.date);if(request!==calendarRequest)return;el.classList.remove("is-loading");if(!slots.length){el.classList.add("is-unavailable");el.disabled=true;el.querySelector(".day-status").textContent="×";}else{el.classList.add("is-available");el.querySelector(".day-status").textContent="";}}catch{if(request===calendarRequest){el.classList.remove("is-loading");el.classList.add("is-unavailable");el.disabled=true;el.querySelector(".day-status").textContent="×";}}}));}if(request===calendarRequest){const available=calendarDays.querySelectorAll(".is-available").length;if(!available)calendarDays.insertAdjacentHTML("beforeend",'<p class="calendar-loading calendar-no-dates">Não há horários disponíveis neste mês.</p>');}}
async function selectCalendarDate(key){selectedDate=key;selectedTime=null;dateInput.value=key;timeInput.value="";selectionLabel.textContent=new Date(key+"T12:00:00").toLocaleDateString("pt-BR",{weekday:"long",day:"2-digit",month:"long"});selectionHint.textContent="Agora escolha um horário disponível";calendarDays.querySelectorAll(".calendar-day").forEach(el=>el.classList.toggle("is-selected",el.dataset.date===key));calendarTimes.hidden=false;calendarTimes.classList.add("is-visible");calendarSelectedDate.textContent=new Date(key+"T12:00:00").toLocaleDateString("pt-BR",{weekday:"long",day:"2-digit",month:"long"});calendarTimeGrid.innerHTML='<p class="calendar-loading">Carregando horários...</p>';try{const slots=await getDaySlots(key);calendarTimeGrid.innerHTML=slots.length?slots.map(t=>'<button type="button" class="calendar-time" data-time="'+t+'">'+t+'</button>').join():'<p class="calendar-loading">Este dia não possui horários disponíveis.</p>';}catch{calendarTimeGrid.innerHTML='<p class="calendar-loading">Não foi possível consultar os horários.</p>';}}
const calendarSelectedDate=document.querySelector("#calendarSelectedDate");
document.querySelector("#openBookingCalendar")?.addEventListener("click",()=>{if(!serviceSelect.value){feedback.textContent="Selecione um serviço primeiro.";serviceSelect.focus();return;}if(selectedDate){const d=new Date(selectedDate+"T12:00:00");calendarMonth=new Date(d.getFullYear(),d.getMonth(),1);}renderCalendar();calendarDialog.showModal();});
document.querySelector("#closeBookingCalendar")?.addEventListener("click",()=>calendarDialog.close());
calendarDialog?.addEventListener("click",e=>{if(e.target===calendarDialog)calendarDialog.close();});
document.querySelector("#calendarPrev")?.addEventListener("click",()=>{const prev=new Date(calendarMonth.getFullYear(),calendarMonth.getMonth()-1,1);if(prev>=new Date(todayDate.getFullYear(),todayDate.getMonth(),1)){calendarMonth=prev;renderCalendar();}});
document.querySelector("#calendarNext")?.addEventListener("click",()=>{calendarMonth=new Date(calendarMonth.getFullYear(),calendarMonth.getMonth()+1,1);renderCalendar();});
calendarDays?.addEventListener("click",e=>{const day=e.target.closest(".calendar-day.is-available");if(day)selectCalendarDate(day.dataset.date);});
calendarTimeGrid?.addEventListener("click",e=>{const option=e.target.closest(".calendar-time");if(!option)return;selectedTime=option.dataset.time;timeInput.value=selectedTime;calendarTimeGrid.querySelectorAll(".calendar-time").forEach(el=>el.classList.toggle("is-selected",el===option));selectionLabel.textContent=new Date(selectedDate+"T12:00:00").toLocaleDateString("pt-BR",{day:"2-digit",month:"long"})+" · "+selectedTime;selectionHint.textContent="Data e horário selecionados";timeSummary.hidden=false;timeOptions.innerHTML='<span class="selected-time-chip">'+selectedTime+'</span>';calendarDialog.close();});
serviceSelect?.addEventListener("change",()=>{availabilityCache.clear();selectedDate=null;selectedTime=null;dateInput.value="";timeInput.value="";selectionLabel.textContent="Escolha um dia e horário";selectionHint.textContent="Toque para abrir o calendário";timeSummary.hidden=true;if(calendarDialog?.open)renderCalendar();});
form?.addEventListener("submit",async e=>{e.preventDefault();if(!form.reportValidity())return;if(!dateInput.value||!timeInput.value){feedback.textContent="Escolha uma data e um horário disponíveis.";return;}const data=new FormData(form);const button=form.querySelector('button[type="submit"]');button.disabled=true;feedback.textContent="Confirmando sua reserva...";try{const r=await fetch("/api/bookings",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name:data.get("name"),phone:data.get("phone"),service_id:data.get("service_id"),date:data.get("date"),time:data.get("time")})}),d=await r.json();if(!r.ok)throw Error(d.error||"Não foi possível reservar.");const when=new Date(d.appointment.starts_at).toLocaleString("pt-BR",{dateStyle:"full",timeStyle:"short"});feedback.textContent="Agendamento confirmado! "+d.appointment.service_name+" · "+when+". Seu horário está reservado.";form.reset();selectedDate=null;selectedTime=null;availabilityCache.clear();selectionLabel.textContent="Escolha um dia e horário";selectionHint.textContent="Toque para abrir o calendário";timeSummary.hidden=true;timeOptions.innerHTML="";}catch(err){feedback.textContent=err.message;availabilityCache.clear();if(selectedDate&&calendarDialog?.open)selectCalendarDate(selectedDate);}finally{button.disabled=false;}});
loadServices();

/* Video gallery lightbox */
const videoDialog=document.querySelector("#videoDialog");
const galleryPlayer=document.querySelector("#galleryPlayer");
const closeVideoButton=videoDialog?.querySelector(".video-dialog-close");
document.querySelectorAll(".video-card[data-video]").forEach(card=>{
  card.addEventListener("click",()=>{
    if(!videoDialog||!galleryPlayer)return;
    galleryPlayer.src=card.dataset.video;
    videoDialog.showModal();
    galleryPlayer.play().catch(()=>{});
  });
});
function closeGalleryVideo(){
  if(!videoDialog||!galleryPlayer)return;
  galleryPlayer.pause();
  galleryPlayer.removeAttribute("src");
  galleryPlayer.load();
  if(videoDialog.open)videoDialog.close();
}
closeVideoButton?.addEventListener("click",closeGalleryVideo);
videoDialog?.addEventListener("click",event=>{
  if(event.target===videoDialog)closeGalleryVideo();
});
videoDialog?.addEventListener("close",()=>{
  if(!galleryPlayer)return;
  galleryPlayer.pause();
  galleryPlayer.removeAttribute("src");
  galleryPlayer.load();
});

/* A small pair of scissors glides across the page as the visitor scrolls. */
const scrollScissors=document.querySelector(".scroll-scissors");
let scissorsFrame=0;
function moveScrollScissors(){
  if(!scrollScissors||window.matchMedia("(prefers-reduced-motion: reduce)").matches)return;
  cancelAnimationFrame(scissorsFrame);
  scissorsFrame=requestAnimationFrame(()=>{
    const range=Math.max(1,document.documentElement.scrollHeight-window.innerHeight);
    const progress=window.scrollY/range;
    const cycle=(progress*4.2)%1;
    const x=-75+cycle*(window.innerWidth+150);
    const y=Math.sin(cycle*Math.PI*2)*34;
    const visible=cycle>.04&&cycle<.96;
    scrollScissors.style.opacity=visible?".82":"0";
    scrollScissors.style.transform="translate3d("+x+"px,"+y+"px,0) rotate("+(cycle*360-30)+"deg)";
  });
}
window.addEventListener("scroll",moveScrollScissors,{passive:true});
window.addEventListener("resize",moveScrollScissors);
moveScrollScissors();

if("serviceWorker" in navigator)window.addEventListener("load",()=>navigator.serviceWorker.register("/sw.js").catch(error=>console.warn("PWA indisponível",error)));
