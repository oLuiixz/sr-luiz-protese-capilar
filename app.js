const menuToggle=document.querySelector("#menuToggle"),nav=document.querySelector("#nav");
menuToggle?.addEventListener("click",()=>{const open=nav.classList.toggle("open");menuToggle.setAttribute("aria-expanded",String(open));});
nav?.querySelectorAll("a").forEach(a=>a.addEventListener("click",()=>{nav.classList.remove("open");menuToggle?.setAttribute("aria-expanded","false");}));
const observer=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add("is-visible");observer.unobserve(e.target);}}),{threshold:.12});
document.querySelectorAll(".reveal").forEach(el=>observer.observe(el));
const form=document.querySelector("#bookingForm"),dateInput=form?.elements.date,serviceSelect=document.querySelector("#bookingService"),timeSelect=document.querySelector("#bookingTime"),feedback=document.querySelector("#formFeedback");
const today=new Date(),localToday=new Date(today.getTime()-today.getTimezoneOffset()*60000).toISOString().slice(0,10);if(dateInput)dateInput.min=localToday;
const phoneInput=form?.elements.phone;phoneInput?.addEventListener("input",()=>{let d=phoneInput.value.replace(/\D/g,"").slice(0,11);if(d.length>10)d=d.replace(/(\d{2})(\d{5})(\d{4})/,"($1) $2-$3");else if(d.length>6)d=d.replace(/(\d{2})(\d{4})(\d{0,4})/,"($1) $2-$3");else if(d.length>2)d=d.replace(/(\d{2})(\d+)/,"($1) $2");phoneInput.value=d;});
async function loadServices(){try{const r=await fetch("/api/services"),d=await r.json();if(!r.ok)throw Error(d.error);serviceSelect.innerHTML='<option value="">Selecione um serviço</option>'+d.services.map(s=>'<option value="'+s.id+'">'+s.name+' · '+s.duration_minutes+' min · '+(s.price_cents/100).toLocaleString("pt-BR",{style:"currency",currency:"BRL"})+'</option>').join();if(!d.services.length)serviceSelect.innerHTML='<option value="">Agendamento temporariamente indisponível</option>';}catch{serviceSelect.innerHTML='<option value="">Não foi possível carregar os serviços</option>';}}
async function loadSlots(){timeSelect.disabled=true;timeSelect.innerHTML='<option value="">Buscando horários...</option>';if(!dateInput.value||!serviceSelect.value){timeSelect.innerHTML='<option value="">Selecione serviço e data</option>';return;}try{const q=new URLSearchParams({date:dateInput.value,serviceId:serviceSelect.value}),r=await fetch("/api/availability?"+q),d=await r.json();if(!r.ok)throw Error(d.error);timeSelect.innerHTML='<option value="">Selecione um horário</option>'+d.slots.map(t=>'<option value="'+t+'">'+t+'</option>').join();if(!d.slots.length)timeSelect.innerHTML='<option value="">Sem horários disponíveis</option>';timeSelect.disabled=!d.slots.length;}catch{timeSelect.innerHTML='<option value="">Erro ao consultar horários</option>';}}
serviceSelect?.addEventListener("change",loadSlots);dateInput?.addEventListener("change",loadSlots);
form?.addEventListener("submit",async e=>{e.preventDefault();if(!form.reportValidity())return;const data=new FormData(form);const button=form.querySelector('button[type="submit"]');button.disabled=true;feedback.textContent="Confirmando sua reserva...";try{const r=await fetch("/api/bookings",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name:data.get("name"),phone:data.get("phone"),service_id:data.get("service_id"),date:data.get("date"),time:data.get("time")})}),d=await r.json();if(!r.ok)throw Error(d.error||"Não foi possível reservar.");const when=new Date(d.appointment.starts_at).toLocaleString("pt-BR",{dateStyle:"full",timeStyle:"short"});feedback.textContent="Agendamento confirmado! "+d.appointment.service_name+" · "+when+". Seu horário está reservado.";form.reset();dateInput.min=localToday;timeSelect.innerHTML='<option value="">Selecione serviço e data</option>';timeSelect.disabled=true;}catch(err){feedback.textContent=err.message;await loadSlots();}finally{button.disabled=false;}});
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
