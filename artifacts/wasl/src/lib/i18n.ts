export type AppLanguage = "en" | "fr" | "ar" | "fa";

const copy: Record<string, Record<AppLanguage, string>> = {
  Home: { en: "Home", fr: "Accueil", ar: "الرئيسية", fa: "خانه" },
  Calendar: { en: "Calendar", fr: "Calendrier", ar: "التقويم", fa: "تقویم" },
  Schedule: { en: "Schedule", fr: "Programme", ar: "الجدول", fa: "برنامه" },
  Tasks: { en: "Tasks", fr: "Tâches", ar: "المهام", fa: "کارها" },
  Feed: { en: "Feed", fr: "Activité", ar: "النشاط", fa: "فعالیت" },
  Chat: { en: "Chat", fr: "Discussion", ar: "المحادثة", fa: "گفتگو" },
  Alerts: { en: "Alerts", fr: "Alertes", ar: "التنبيهات", fa: "هشدارها" },
  Documents: { en: "Documents", fr: "Documents", ar: "المستندات", fa: "اسناد" },
  "Talk to Wasl": { en: "Talk to Wasl", fr: "Parler à Wasl", ar: "تحدث مع وصل", fa: "با وصل صحبت کنید" },
  "Prayer time in": { en: "in", fr: "dans", ar: "بعد", fa: "در" },
  thing: { en: "thing", fr: "tâche", ar: "مورد", fa: "مورد" },
  things: { en: "things", fr: "tâches", ar: "أمور", fa: "مورد" },
  "Type your message...": { en: "Type your message...", fr: "Écrivez votre message...", ar: "اكتب رسالتك...", fa: "پیام خود را بنویسید..." },
  "Proposed Task": { en: "Proposed Task", fr: "Tâche proposée", ar: "المهمة المقترحة", fa: "کار پیشنهادی" },
  Confirm: { en: "Confirm", fr: "Confirmer", ar: "تأكيد", fa: "تأیید" },
  Today: { en: "Today", fr: "Aujourd’hui", ar: "اليوم", fa: "امروز" },
  Tomorrow: { en: "Tomorrow", fr: "Demain", ar: "غدًا", fa: "فردا" },
  "What Matters to Me": { en: "What Matters to Me", fr: "Ce qui compte pour moi", ar: "ما يهمني", fa: "آنچه برای من مهم است" },
  Identity: { en: "Identity", fr: "Identité", ar: "الهوية", fa: "هویت" },
  "Full name": { en: "Full name", fr: "Nom complet", ar: "الاسم الكامل", fa: "نام کامل" },
  Role: { en: "Role", fr: "Rôle", ar: "الدور", fa: "نقش" },
  "Preferred Name": { en: "Preferred Name", fr: "Prénom préféré", ar: "الاسم المفضل", fa: "نام مورد علاقه" },
  "Language Preference": { en: "Language Preference", fr: "Langue préférée", ar: "اللغة المفضلة", fa: "زبان ترجیحی" },
  "Greeting Style": { en: "Greeting Style", fr: "Style de salutation", ar: "أسلوب التحية", fa: "شیوه سلام" },
  "Dietary Requirements": { en: "Dietary Requirements", fr: "Préférences alimentaires", ar: "التفضيلات الغذائية", fa: "ترجیحات غذایی" },
  Notifications: { en: "Notifications", fr: "Notifications", ar: "الإشعارات", fa: "اعلان‌ها" },
  "Save My Preferences": { en: "Save My Preferences", fr: "Enregistrer mes préférences", ar: "حفظ تفضيلاتي", fa: "ذخیره ترجیحات من" },
  "Access Control": { en: "Access Control", fr: "Contrôle d’accès", ar: "التحكم بالوصول", fa: "کنترل دسترسی" },
  "Switch demo role": { en: "Switch demo role", fr: "Changer de rôle démo", ar: "تبديل الدور التجريبي", fa: "تغییر نقش نمایشی" },
  "View profile and language": { en: "View profile and language", fr: "Voir le profil et la langue", ar: "عرض الملف الشخصي واللغة", fa: "مشاهده پروفایل و زبان" },
  "Circle permissions": { en: "Circle permissions", fr: "Autorisations du cercle", ar: "صلاحيات الدائرة", fa: "مجوزهای حلقه" },
  "No tasks scheduled": { en: "No tasks scheduled", fr: "Aucune tâche planifiée", ar: "لا توجد مهام مجدولة", fa: "کاری برنامه‌ریزی نشده" },
  "Today's Plan": { en: "Today's Plan", fr: "Programme du jour", ar: "خطة اليوم", fa: "برنامه امروز" },
  "View All": { en: "View All", fr: "Tout voir", ar: "عرض الكل", fa: "مشاهده همه" },
  "Needs attention": { en: "Needs attention", fr: "À surveiller", ar: "يتطلب الانتباه", fa: "نیازمند توجه" },
  "Your day is clear.": { en: "Your day is clear.", fr: "Votre journée est libre.", ar: "يومك خالٍ.", fa: "برنامه امروز شما خالی است." },
  "Circle Activity": { en: "Circle Activity", fr: "Activité du cercle", ar: "نشاط الدائرة", fa: "فعالیت حلقه" },
  "Updates and messages from your care circle.": { en: "Updates and messages from your care circle.", fr: "Nouvelles et messages de votre cercle de soins.", ar: "تحديثات ورسائل من دائرة الرعاية.", fa: "به‌روزرسانی‌ها و پیام‌های حلقه مراقبت شما." },
  "FYI & Reminders": { en: "FYI & Reminders", fr: "Infos et rappels", ar: "معلومات وتذكيرات", fa: "اطلاعات و یادآوری‌ها" },
  "You're all caught up": { en: "You're all caught up", fr: "Vous êtes à jour", ar: "أنت على اطلاع كامل", fa: "همه چیز را دیده‌اید" },
  "Action items requiring your attention.": { en: "Action items requiring your attention.", fr: "Éléments nécessitant votre attention.", ar: "عناصر تتطلب انتباهك.", fa: "مواردی که به توجه شما نیاز دارند." },
  "No pending alerts.": { en: "No pending alerts.", fr: "Aucune alerte en attente.", ar: "لا توجد تنبيهات معلقة.", fa: "هشدار در انتظاری وجود ندارد." },
  "Important files shared with the circle.": { en: "Important files shared with the circle.", fr: "Fichiers importants partagés avec le cercle.", ar: "ملفات مهمة مشتركة مع الدائرة.", fa: "فایل‌های مهم به‌اشتراک‌گذاشته‌شده با حلقه." },
  "Upload important files to share with the circle.": { en: "Upload important files to share with the circle.", fr: "Téléversez des fichiers importants à partager.", ar: "ارفع ملفات مهمة لمشاركتها.", fa: "فایل‌های مهم را برای اشتراک‌گذاری بارگذاری کنید." },
  "No documents yet": { en: "No documents yet", fr: "Aucun document", ar: "لا توجد مستندات بعد", fa: "هنوز سندی وجود ندارد" },
  "My Care Circle": { en: "My Care Circle", fr: "Mon cercle de soins", ar: "دائرة رعايتي", fa: "حلقه مراقبت من" },
  "Manage what your circle members can see.": { en: "Manage what your circle members can see.", fr: "Gérez ce que les membres peuvent voir.", ar: "إدارة ما يمكن لأعضاء الدائرة رؤيته.", fa: "آنچه اعضای حلقه می‌توانند ببینند مدیریت کنید." },
  "Private permissions": { en: "Private permissions", fr: "Autorisations privées", ar: "صلاحيات خاصة", fa: "مجوزهای خصوصی" },
  "Only the Circle Lead and Amanah Partners can view these settings.": { en: "Only the Circle Lead and Amanah Partners can view these settings.", fr: "Seuls le responsable et les partenaires Amanah peuvent voir ces réglages.", ar: "يمكن لقائد الدائرة وشركاء الأمانة فقط عرض هذه الإعدادات.", fa: "فقط سرپرست حلقه و همکاران امانت می‌توانند این تنظیمات را ببینند." },
  "Your cultural, personal, and communication preferences.": { en: "Your cultural, personal, and communication preferences.", fr: "Vos préférences culturelles, personnelles et de communication.", ar: "تفضيلاتك الثقافية والشخصية وتفضيلات التواصل.", fa: "ترجیحات فرهنگی، شخصی و ارتباطی شما." },
  "The details entered when your Wasl profile was created": { en: "The details entered when your Wasl profile was created", fr: "Les informations saisies lors de la création du profil", ar: "التفاصيل المدخلة عند إنشاء ملف وصل", fa: "اطلاعات واردشده هنگام ایجاد پروفایل وصل" },
  "Modesty & Comfort": { en: "Modesty & Comfort", fr: "Pudeur et confort", ar: "الخصوصية والراحة", fa: "حریم و آسایش" },
  "Your preferences for personal care and visits": { en: "Your preferences for personal care and visits", fr: "Vos préférences pour les soins et les visites", ar: "تفضيلاتك للرعاية والزيارات", fa: "ترجیحات شما برای مراقبت و دیدارها" },
  "Prayer time reminders": { en: "Prayer time reminders", fr: "Rappels des prières", ar: "تذكيرات أوقات الصلاة", fa: "یادآوری اوقات نماز" },
  "Urgent alerts & changes": { en: "Urgent alerts & changes", fr: "Alertes urgentes et changements", ar: "التنبيهات والتغييرات العاجلة", fa: "هشدارها و تغییرات فوری" },
  "Welcome to Wasl": { en: "Welcome to Wasl", fr: "Bienvenue sur Wasl", ar: "مرحبًا بك في وصل", fa: "به وصل خوش آمدید" },
  "What is your role?": { en: "What is your role?", fr: "Quel est votre rôle ?", ar: "ما هو دورك؟", fa: "نقش شما چیست؟" },
  "Make Wasl yours": { en: "Make Wasl yours", fr: "Personnalisez Wasl", ar: "اجعل وصل مناسبًا لك", fa: "وصل را برای خودتان بسازید" },
  "Choose how your circle should address you.": { en: "Choose how your circle should address you.", fr: "Choisissez comment votre cercle doit vous appeler.", ar: "اختر كيف تخاطبك دائرتك.", fa: "انتخاب کنید حلقه شما را چگونه خطاب کند." },
};

const reverse = new Map<string, string>();
for (const [key, variants] of Object.entries(copy)) {
  reverse.set(key, key);
  Object.values(variants).forEach(value => reverse.set(value, key));
}

export function translate(value: string, language: AppLanguage): string {
  const key = reverse.get(value.trim());
  return key ? copy[key]?.[language] ?? value : value;
}

export function formatTodayPlan(count: number, language: AppLanguage): string {
  const quantity = language === "fr"
    ? count === 1 ? copy.thing.fr : copy.things.fr
    : language === "ar"
      ? count === 1 ? copy.thing.ar : copy.things.ar
      : language === "fa"
        ? copy.thing.fa
        : count === 1 ? copy.thing.en : copy.things.en;

  if (language === "ar") return `لديك ${count} ${quantity} مخططة اليوم ←`;
  if (language === "fa") return `امروز ${count} ${quantity} دارید ←`;
  if (language === "fr") return `Vous avez ${count} ${quantity} aujourd’hui →`;
  return `You have ${count} ${quantity} planned today →`;
}
