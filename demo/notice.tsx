import { useI18n } from "@/components/language-provider";

export const demoCopy = {
  ka: {
    title: "დიზაინის დემო",
    banner: "დაათვალიერე მენიუ და მოსინჯე კალათა. შეკვეთები და გადახდა გამორთულია.",
    form: "ეს შეკვეთის ფორმის სანახავი ვერსიაა. საკონტაქტო ველები და გაგზავნა გამორთულია.",
    submit: "გაგზავნა გამორთულია · დიზაინის დემო",
    unavailable: "დიზაინის დემოში შეკვეთა არ იგზავნება და თანხა არ ჩამოგეჭრება.",
  },
  en: {
    title: "Design demo",
    banner: "Explore the menu and try the basket. Orders and payments are disabled.",
    form: "This is a preview of the checkout form. Contact fields and order submission are disabled.",
    submit: "Submission disabled · design demo",
    unavailable: "This design demo cannot send orders or take payments.",
  },
  ru: {
    title: "Демо дизайна",
    banner: "Посмотрите меню и попробуйте корзину. Заказы и платежи отключены.",
    form: "Это просмотр формы заказа. Контактные поля и отправка заказа отключены.",
    submit: "Отправка отключена · демо дизайна",
    unavailable: "В демо дизайна нельзя отправить заказ или совершить оплату.",
  },
};

export function DemoNotice({ compact = false }: { compact?: boolean }) {
  const { locale } = useI18n();
  const text = demoCopy[locale];
  return <div className={compact ? "notice demo-checkout-note" : "demo-banner design-demo-banner"} role="note"><strong>{text.title}</strong><span>{compact ? text.form : text.banner}</span></div>;
}
