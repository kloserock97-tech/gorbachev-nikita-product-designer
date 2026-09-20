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
  tagline: "Senior/Lead Product Designer",
  nav: ["About me", "Now", "Hobbies", "Contact"],
  /* заголовки разделов на самой странице (полоски-плашки) */
  sections: ["About me", "What I'm doing now", "Hobbies", "Contact"],
  photo: "ui/portrait.jpg",

  profile: [
    ["Name", "Nikita Gorbachev"],
    ["Occupation", "Senior/Lead Product Designer"],
    ["Languages", "English (C1), Russian"],
  ],

  hello:
    "Hi there! I'm Nikita, a Senior/Lead Product Designer. I make complex services feel simple: public ones used by millions of people and internal tools that tens of thousands of employees open every morning. I also lead a team of designers.",

  now: [
    "I design products, often with AI inside. I look at the whole product, and a single screen is only one part of it. I cover the whole path: research, product structure, launch, numbers and growth.",
    "Last role: Head of Product Design at Grif AI. I joined as the first designer and set up all the design work from scratch. I'm open to product design roles and ready to relocate or work remotely.",
  ],


  hobbies: [
    { icon: "game", text: "Game design. I have a game out on Steam." },
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
