export interface CategorySeed {
  slug: string;
  name_en: string;
  name_bn: string;
  level: number;
  icon_url?: string;
  parent_slug?: string;
}

export const CATEGORIES_SEED: CategorySeed[] = [
  // Level 1: Academic
  { slug: 'academic', name_en: 'Academic & Textbooks', name_bn: 'একাডেমিক ও পাঠ্যবই', level: 1, icon_url: 'GraduationCap' },
  { slug: 'school', name_en: 'School (Class 6-10)', name_bn: 'স্কুল (ষষ্ঠ-দশম)', level: 2, parent_slug: 'academic' },
  { slug: 'ssc-board-books', name_en: 'SSC & Board Books', name_bn: 'এসএসসি ও বোর্ড বই', level: 3, parent_slug: 'school' },
  { slug: 'college', name_en: 'College & HSC', name_bn: 'কলেজ ও এইচএসসি', level: 2, parent_slug: 'academic' },
  { slug: 'hsc-science', name_en: 'HSC Science', name_bn: 'এইচএসসি বিজ্ঞান', level: 3, parent_slug: 'college' },
  { slug: 'hsc-commerce-arts', name_en: 'HSC Commerce & Arts', name_bn: 'এইচএসসি বাণিজ্য ও মানবিক', level: 3, parent_slug: 'college' },
  { slug: 'university', name_en: 'University & Higher Studies', name_bn: 'বিশ্ববিদ্যালয় ও উচ্চশিক্ষা', level: 2, parent_slug: 'academic' },
  { slug: 'engineering-cse', name_en: 'Engineering & CSE', name_bn: 'প্রকৌশল ও সিএসই', level: 3, parent_slug: 'university' },
  { slug: 'medical-dental', name_en: 'Medical & Healthcare', name_bn: 'মেডিকেল ও স্বাস্থ্যবিজ্ঞান', level: 3, parent_slug: 'university' },
  { slug: 'bba-economics', name_en: 'BBA & Economics', name_bn: 'ব্যবসায় ও অর্থনীতি', level: 3, parent_slug: 'university' },
  { slug: 'admission-job', name_en: 'Admission & Job Preparation', name_bn: 'ভর্তি ও চাকরির প্রস্তুতি', level: 2, parent_slug: 'academic' },
  { slug: 'bcs-prep', name_en: 'BCS & Bank Jobs', name_bn: 'বিসিএস ও ব্যাংক জব', level: 3, parent_slug: 'admission-job' },
  { slug: 'varsity-admission', name_en: 'University Admission (GST/BUET)', name_bn: 'বিশ্ববিদ্যালয় ভর্তি প্রস্তুতি', level: 3, parent_slug: 'admission-job' },

  // Level 1: Literature
  { slug: 'literature', name_en: 'Literature & Fiction', name_bn: 'সাহিত্য ও কথাসাহিত্য', level: 1, icon_url: 'BookOpen' },
  { slug: 'fiction', name_en: 'Fiction & Novels', name_bn: 'উপন্যাস ও কথাসাহিত্য', level: 2, parent_slug: 'literature' },
  { slug: 'thriller-mystery', name_en: 'Thriller & Mystery', name_bn: 'থ্রিলার ও রহস্য', level: 3, parent_slug: 'fiction' },
  { slug: 'detective', name_en: 'Detective (Goenda)', name_bn: 'গোয়েন্দা কাহিনী', level: 3, parent_slug: 'fiction' },
  { slug: 'sci-fi', name_en: 'Science Fiction', name_bn: 'সায়েন্স ফিকশন', level: 3, parent_slug: 'fiction' },
  { slug: 'non-fiction', name_en: 'Non-Fiction & Essays', name_bn: 'প্রবন্ধ ও ইতিহাস', level: 2, parent_slug: 'literature' },
  { slug: 'biography', name_en: 'Biography & Memoirs', name_bn: 'জীবনী ও স্মৃতিকথা', level: 3, parent_slug: 'non-fiction' },
  { slug: 'history-politics', name_en: 'History & Politics', name_bn: 'ইতিহাস ও রাজনীতি', level: 3, parent_slug: 'non-fiction' },
  { slug: 'self-help', name_en: 'Self-Help & Motivation', name_bn: 'আত্মউন্নয়ন ও প্রেরণা', level: 3, parent_slug: 'non-fiction' },
  { slug: 'poetry', name_en: 'Poetry', name_bn: 'কবিতা', level: 2, parent_slug: 'literature' },
  { slug: 'bangla-poetry', name_en: 'Bangla Kobita', name_bn: 'বাংলা কবিতা', level: 3, parent_slug: 'poetry' },

  // Level 1: Religion
  { slug: 'religion', name_en: 'Religion & Spirituality', name_bn: 'ধর্ম ও আত্মশুদ্ধি', level: 1, icon_url: 'Compass' },
  { slug: 'islamic-books', name_en: 'Islamic Literature', name_bn: 'ইসলামিক বই', level: 2, parent_slug: 'religion' },
  { slug: 'comparative-religion', name_en: 'Philosophy & Spirituality', name_bn: 'দর্শন ও আধ্যাত্মিকতা', level: 2, parent_slug: 'religion' },

  // Level 1: Children
  { slug: 'children-teens', name_en: 'Children & Comics', name_bn: 'শিশু-কিশোর ও কমিকস', level: 1, icon_url: 'Sparkles' },
  { slug: 'comics', name_en: 'Comics & Graphic Novels', name_bn: 'কমিকস ও রম্য', level: 2, parent_slug: 'children-teens' },
  { slug: 'fairy-tales', name_en: 'Adventure & Stories', name_bn: 'কিশোর ক্লাসিক ও গল্প', level: 2, parent_slug: 'children-teens' },

  // Level 1: Rare & Vintage
  { slug: 'rare-vintage', name_en: 'Rare & Vintage Books', name_bn: 'দুর্লভ ও সংগ্রাহক সংস্করণ', level: 1, icon_url: 'Award' },
  { slug: 'first-editions', name_en: 'First Editions & Signed', name_bn: 'প্রথম সংস্করণ ও স্বাক্ষরিত', level: 2, parent_slug: 'rare-vintage' },
  { slug: 'old-periodicals', name_en: 'Old Periodicals & Journals', name_bn: 'বিচিত্রা, দেশ ও পুরনো সাময়িকী', level: 2, parent_slug: 'rare-vintage' },
];

export const AUTHORS_SEED = [
  { name_en: 'Humayun Ahmed', name_bn: 'হুমায়ূন আহমেদ', aliases: ['Humayun Ahmed', 'হুমায়ূন আহমেদ', 'হুমায়ুন', 'হুমাযুন', 'হিমু'] },
  { name_en: 'Rabindranath Tagore', name_bn: 'রবীন্দ্রনাথ ঠাকুর', aliases: ['Rabindranath Tagore', 'রবীন্দ্রনাথ ঠাকুর', 'রবি ঠাকুর', 'ভানুসিংহ'] },
  { name_en: 'Kazi Nazrul Islam', name_bn: 'কাজী নজরুল ইসলাম', aliases: ['Kazi Nazrul Islam', 'নজরুল ইসলাম', 'বিদ্রোহী কবি'] },
  { name_en: 'Muhammed Zafar Iqbal', name_bn: 'মুহম্মদ জাফর ইকবাল', aliases: ['Muhammed Zafar Iqbal', 'জাফর ইকবাল', 'MZI'] },
  { name_en: 'Satyajit Ray', name_bn: 'সত্যজিৎ রায়', aliases: ['Satyajit Ray', 'সত্যজিৎ রায়', 'ফেলুদা'] },
  { name_en: 'Sarat Chandra Chattopadhyay', name_bn: 'শরৎচন্দ্র চট্টোপাধ্যায়', aliases: ['Sarat Chandra', 'শরৎচন্দ্র'] },
  { name_en: 'Bibhutibhushan Bandyopadhyay', name_bn: 'বিভূতিভূষণ বন্দ্যোপাধ্যায়', aliases: ['Bibhutibhushan', 'বিভূতিভূষণ'] },
  { name_en: 'Sunil Gangopadhyay', name_bn: 'সুনীল গঙ্গোপাধ্যায়', aliases: ['Sunil Gangopadhyay', 'নীললোহিত'] },
  { name_en: 'Shirshendu Mukhopadhyay', name_bn: 'শীর্ষেন্দু মুখোপাধ্যায়', aliases: ['Shirshendu Mukhopadhyay', 'শীর্ষেন্দু'] },
  { name_en: 'Syed Mujtaba Ali', name_bn: 'সৈয়দ মুজতবা আলী', aliases: ['Syed Mujtaba Ali', 'মুজতবা আলী'] },
  { name_en: 'Akhtaruzzaman Elias', name_bn: 'আখতারুজ্জামান ইলিয়াস', aliases: ['Akhtaruzzaman Elias'] },
  { name_en: 'Hasan Azizul Huq', name_bn: 'হাসান আজিজুল হক', aliases: ['Hasan Azizul Huq'] },
  { name_en: 'Shamsur Rahman', name_bn: 'শামসুর রাহমান', aliases: ['Shamsur Rahman'] },
  { name_en: 'Al Mahmud', name_bn: 'আল মাহমুদ', aliases: ['Al Mahmud'] },
  { name_en: 'Jibanananda Das', name_bn: 'জীবনানন্দ দাশ', aliases: ['Jibanananda Das', 'রুপসী বাংলা'] },
  { name_en: 'Sukanta Bhattacharya', name_bn: 'সুকান্ত ভট্টাচার্য', aliases: ['Sukanta Bhattacharya'] },
  { name_en: 'Rokeya Sakhawat Hossain', name_bn: 'রোকেয়া সাখাওয়াত হোসেন', aliases: ['Begum Rokeya', 'বেগম রোকেয়া'] },
  { name_en: 'Michael Madhusudan Dutt', name_bn: 'মাইকেল মধুসূদন দত্ত', aliases: ['Michael Madhusudan Dutt'] },
  { name_en: 'Manik Bandopadhyay', name_bn: 'মানিক বন্দ্যোপাধ্যায়', aliases: ['Manik Bandopadhyay'] },
  { name_en: 'Tarasankar Bandyopadhyay', name_bn: 'তারাশঙ্কর বন্দ্যোপাধ্যায়', aliases: ['Tarasankar'] },
  { name_en: 'Qazi Anwar Hussain', name_bn: 'কাজী আনোয়ার হোসেন', aliases: ['Qazi Anwar Hussain', 'মাসুদ রানা'] },
  { name_en: 'Imdadul Haq Milan', name_bn: 'ইমদাদুল হক মিলন', aliases: ['Imdadul Haq Milan'] },
  { name_en: 'Anisul Hoque', name_bn: 'আনিসুল হক', aliases: ['Anisul Hoque'] },
  { name_en: 'Selina Hossain', name_bn: 'সেলিনা হোসেন', aliases: ['Selina Hossain'] },
  { name_en: 'Humayun Azad', name_bn: 'হুমায়ুন আজাদ', aliases: ['Humayun Azad'] },
  { name_en: 'George Orwell', name_bn: 'জর্জ অরওয়েল', aliases: ['George Orwell'] },
  { name_en: 'Gabriel García Márquez', name_bn: 'গাব্রিয়েল গার্সিয়া মার্কেস', aliases: ['Gabriel Garcia Marquez'] },
  { name_en: 'Fyodor Dostoevsky', name_bn: 'ফিওদর দস্তয়েভস্কি', aliases: ['Dostoevsky'] },
  { name_en: 'Haruki Murakami', name_bn: 'হারুকি মুরাকামি', aliases: ['Murakami'] },
  { name_en: 'Dr. Shahjahan Tapan', name_bn: 'ড. শাহজাহান তপন', aliases: ['Shahjahan Tapan', 'তপন স্যার Physics'] },
];

export const PUBLISHERS_SEED = [
  { name_en: 'Ananya', name_bn: 'অনন্যা' },
  { name_en: 'Batighar', name_bn: 'বাতিঘর' },
  { name_en: 'Prothoma Prokashon', name_bn: 'প্রথমা প্রকাশন' },
  { name_en: 'Sheba Prokashoni', name_bn: 'সেবা প্রকাশনী' },
  { name_en: 'Somoy Prokashon', name_bn: 'সময় প্রকাশন' },
  { name_en: 'Kakoli Prokashoni', name_bn: 'কাকলী প্রকাশনী' },
  { name_en: 'Agamee Prakashani', name_bn: 'আগামী প্রকাশনী' },
  { name_en: 'Mawla Brothers', name_bn: 'মাওলা ব্রাদার্স' },
  { name_en: 'Anyaprokash', name_bn: 'অন্যপ্রকাশ' },
  { name_en: 'University Press Limited (UPL)', name_bn: 'ইউপিএল' },
];

export const SHOPS_SEED = [
  {
    name: 'Nilkhet Boi Ghar',
    slug: 'nilkhet-boi-ghar',
    address: 'Shop 14, Islamia Market, Nilkhet, Dhaka-1205',
    contact_phone: '+8801811223344',
    is_verified: true,
    subscription_plan: 'pro' as const,
    logo_url: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=120&q=80',
  },
  {
    name: 'Aziz Super Market Rare Books',
    slug: 'aziz-rare-books',
    address: '2nd Floor, Aziz Super Market, Shahbagh, Dhaka',
    contact_phone: '+8801911223344',
    is_verified: true,
    subscription_plan: 'premium' as const,
    logo_url: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=120&q=80',
  },
  {
    name: 'Bangla Bazar Book Traders',
    slug: 'bangla-bazar-traders',
    address: '42 Pari Das Road, Bangla Bazar, Dhaka-1100',
    contact_phone: '+8801711223344',
    is_verified: true,
    subscription_plan: 'basic' as const,
    logo_url: 'https://images.unsplash.com/photo-1507842229458-77292215c2cf?w=120&q=80',
  },
];

