export function buildWhatsAppUrl(category?: string, message?: string): string {
  const number = import.meta.env.VITE_WHATSAPP_NUMBER || '5491122334455'; // Placeholder default
  
  let finalMessage = message;
  
  if (!finalMessage) {
    if (category) {
      finalMessage = `¡Hola! Necesito un servicio de ${category} a través de Toori ServiciosYa.`;
    } else {
      finalMessage = `¡Hola! Me gustaría pedir un servicio a través de Toori ServiciosYa.`;
    }
  }
  
  const encodedMessage = encodeURIComponent(finalMessage);
  return `https://wa.me/${number}?text=${encodedMessage}`;
}
