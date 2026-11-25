const WHATSAPP_NUMBER = ""; // Adicione o número com DDI + DDD, somente números, quando estiver definido.
const menuToggle = document.querySelector("#menuToggle");
const nav = document.querySelector("#nav");
menuToggle?.addEventListener("click", () => {
  const open = nav.classList.toggle("open");
  menuToggle.setAttribute("aria-expanded", String(open));
});
nav?.querySelectorAll("a").forEach(link => link.addEventListener("click", () => {
  nav.classList.remove("open");
  menuToggle?.setAttribute("aria-expanded", "false");
}));

const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add("is-visible");
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });
document.querySelectorAll(".reveal").forEach(el => observer.observe(el));

const dateInput = document.querySelector('input[name="date"]');
if (dateInput) {
  const today = new Date();
  const localToday = new Date(today.getTime() - today.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  dateInput.min = localToday;
}

const phoneInput = document.querySelector('input[name="phone"]');
phoneInput?.addEventListener("input", () => {
  let digits = phoneInput.value.replace(/\\D/g, "").slice(0, 11);
  if (digits.length > 10) digits = digits.replace(/(\\d{2})(\\d{5})(\\d{4})/, "($1) $2-$3");
  else if (digits.length > 6) digits = digits.replace(/(\\d{2})(\\d{4})(\\d{0,4})/, "($1) $2-$3");
  else if (digits.length > 2) digits = digits.replace(/(\\d{2})(\\d+)/, "($1) $2");
  phoneInput.value = digits;
});

document.querySelector("#bookingForm")?.addEventListener("submit", event => {
  event.preventDefault();
  const form = event.currentTarget;
  if (!form.reportValidity()) return;
  const data = new FormData(form);
  const date = new Date(data.get("date") + "T12:00:00");
  const dateLabel = date.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" });
  const message = [
    "Olá! Gostaria de solicitar um horário na SR Luiz Barbearia.",
    "",
    "Nome: " + data.get("name"),
    "Telefone: " + data.get("phone"),
    "Serviço: " + data.get("service"),
    "Data: " + dateLabel,
    "Horário desejado: " + data.get("time"),
    "",
    "Aguardo a confirmação. Obrigado!"
  ].join("\\n");
  const feedback = document.querySelector("#formFeedback");
  if (WHATSAPP_NUMBER) {
    window.open("https://wa.me/" + WHATSAPP_NUMBER + "?text=" + encodeURIComponent(message), "_blank", "noopener,noreferrer");
    feedback.textContent = "Sua solicitação foi preparada. Envie a mensagem pelo WhatsApp para confirmar o horário.";
  } else {
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(message).then(() => {
        feedback.textContent = "Resumo copiado! O WhatsApp oficial da barbearia será conectado assim que o número for configurado.";
      }).catch(() => {
        feedback.textContent = "Preencha os dados e aguarde a configuração do WhatsApp oficial para enviar sua solicitação.";
      });
    } else {
      feedback.textContent = "Solicitação preenchida. O WhatsApp oficial será conectado assim que o número for configurado.";
    }
  }
});