import { getLang } from "../i18n";
import ruMe from "./me.ru";

/* Тексты домашней страницы на экране ретро-компьютера (src/scene/portfolioScreen.ts)
   и выпадающего меню Work (src/ui/workMenu.ts). Только данные — правятся без кода.

   Источники фактов: cv-nikita-gorbachev-2026.md, блок About (Main page/EN/Hero screen.en.html),
   research/Approved/PRD.md, кейсы — Main cases/EN. Язык английский, как вся страница холма.
   v21 (правка Никиты): без локации, хэндла, опыта работы и плиток кейсов — кейсы живут в главе
   «Кейсы» и в меню Work; контакты — рабочие.
   v27: русский двойник — me.ru.ts; экран перерисовывается при смене языка (portfolioScreen.ts). */
const me = {
  windowTitle: "Nikita Gorbachev | Home Page",
  address: "http://www.nikita-gorbachev.com/about.htm",
  site: "Nikita's Home Page",
  tagline: "Product Designer",
  nav: ["About me", "Now", "Hobbies", "Contact"],
  /* заголовки разделов на самой странице (полоски-плашки) */
  sections: ["About me", "What I'm doing now", "Hobbies", "Contact"],
  photo: "ui/portrait.jpg",

  profile: [
    ["Name", "Nikita Gorbachev"],
    ["Occupation", "Product Designer"],
    ["Languages", "Russian — native, English — professional working proficiency"],
  ],

  hello:
    "Hi! I'm Nikita, a product designer. I make products for regular people, sometimes with AI inside. And yes, I build them in code myself.",

  now: [
    "I look at the whole product. A screen is just one piece. What's interesting is everything around it: why someone came, what stops them, and whether they'll come back tomorrow.",
    "Last stop: GRIF AI. Open to product design roles.",
  ],


  hobbies: [
    { icon: "cube", text: "3D in Blender and Unreal Engine. This hill is one of those builds." },
    { icon: "spark", text: "Working out what keeps a person interested, beyond where a button goes. Fine, that one is my actual job." },
  ],

  quote: "A designer without numbers is an illustrator.",

  contacts: [
    ["E-mail", "kloserock97@gmail.com"],
    ["Telegram", "@Gorbachev_Nikita_Designer"],
    ["LinkedIn", "nikita-gorbachev-productdesigner"],
  ],
};

export default me;

/** тексты экрана на текущем языке */
export function getMe(): typeof me {
  return getLang() === "ru" ? ruMe : me;
}
