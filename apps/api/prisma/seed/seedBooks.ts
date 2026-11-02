export interface SeedBookItem {
  title_en: string;
  title_bn: string;
  author_index: number; // index into AUTHORS_SEED
  publisher_index: number; // index into PUBLISHERS_SEED
  category_slugs: string[];
  description: string;
  condition: 'new' | 'like_new' | 'good' | 'acceptable';
  language: 'bn' | 'en';
  price: number;
  original_price?: number;
  edition?: string;
  publication_year?: number;
  is_rare?: boolean;
  is_featured?: boolean;
  stock_count: number;
  weight_bucket: 'under_300g' | 'between_300g_1kg' | 'over_1kg';
  images: string[];
}

const SAMPLE_COVERS = [
  'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=600&q=80',
  'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600&q=80',
  'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=600&q=80',
  'https://images.unsplash.com/photo-1495640388908-05fa85288e61?w=600&q=80',
  'https://images.unsplash.com/photo-1532012164546-f432f2e3777f?w=600&q=80',
  'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=600&q=80',
  'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=600&q=80',
  'https://images.unsplash.com/photo-1524578271613-d550eacf6090?w=600&q=80',
  'https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=600&q=80',
  'https://images.unsplash.com/photo-1476275466078-4007374efbbe?w=600&q=80',
  'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=600&q=80',
  'https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?w=600&q=80',
  'https://images.unsplash.com/photo-1491841550275-ad7854e35ca6?w=600&q=80',
  'https://images.unsplash.com/photo-1519682337058-a94d519337bc?w=600&q=80',
  'https://images.unsplash.com/photo-1463320726281-696a485928c7?w=600&q=80',
];

const BACK_COVER = 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&q=80';
const SPINE_PAGE = 'https://images.unsplash.com/photo-1510172951991-856a654063f9?w=600&q=80';
const DETAIL_PAGE = 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=600&q=80';

export function generate160Books(): SeedBookItem[] {
  const titles = [
    // 1-25: Humayun Ahmed Classics & Himu / Misir Ali
    { en: 'Debi', bn: 'দেবী', auth: 0, cat: ['fiction', 'thriller-mystery'], p: 180, op: 280, y: 1985, cond: 'good' },
    { en: 'Nishithini', bn: 'নিশীথিনী', auth: 0, cat: ['fiction', 'thriller-mystery'], p: 190, op: 300, y: 1988, cond: 'like_new' },
    { en: 'Daruchini Dwip', bn: 'দারুচিনি দ্বীপ', auth: 0, cat: ['fiction'], p: 220, op: 350, y: 1991, cond: 'good' },
    { en: 'Amar Ache Jol', bn: 'আমার আছে জল', auth: 0, cat: ['fiction'], p: 170, op: 260, y: 1997, cond: 'acceptable' },
    { en: 'Shonkhonil Karagar', bn: 'শঙ্খনীল কারাগার', auth: 0, cat: ['fiction'], p: 200, op: 320, y: 1973, cond: 'like_new' },
    { en: 'Jochna O Jononir Golpo', bn: 'জোছনা ও জননীর গল্প', auth: 0, cat: ['fiction', 'history-politics'], p: 550, op: 850, y: 2004, cond: 'like_new', w: 'over_1kg' },
    { en: 'Kothao Keu Nei', bn: 'কোথাও কেউ নেই', auth: 0, cat: ['fiction'], p: 240, op: 380, y: 1990, cond: 'good' },
    { en: 'Mayurakshi', bn: 'ময়ূরাক্ষী', auth: 0, cat: ['fiction'], p: 160, op: 250, y: 1990, cond: 'like_new' },
    { en: 'Himur Hate Koekti Nilpodmo', bn: 'হিমুর হাতে কয়েকটি নীলপদ্ম', auth: 0, cat: ['fiction'], p: 180, op: 280, y: 1992, cond: 'good' },
    { en: 'Himu Remanded', bn: 'হিমু রিমান্ডে', auth: 0, cat: ['fiction'], p: 170, op: 260, y: 2008, cond: 'like_new' },
    { en: 'Misir Ali Somogro 1', bn: 'মিসির আলি সমগ্র ১', auth: 0, cat: ['fiction', 'thriller-mystery', 'detective'], p: 480, op: 750, y: 2002, cond: 'good', w: 'between_300g_1kg' },
    { en: 'Misir Ali Somogro 2', bn: 'মিসির আলি সমগ্র ২', auth: 0, cat: ['fiction', 'thriller-mystery', 'detective'], p: 490, op: 750, y: 2004, cond: 'like_new', w: 'between_300g_1kg' },
    { en: 'Nondito Noroke', bn: 'নন্দিত নরকে', auth: 0, cat: ['fiction'], p: 190, op: 290, y: 1972, cond: 'good' },
    { en: 'Brihonnola', bn: 'বৃহন্নলা', auth: 0, cat: ['fiction', 'thriller-mystery'], p: 180, op: 270, y: 1989, cond: 'acceptable' },
    { en: 'Opekkha', bn: 'অপেক্ষা', auth: 0, cat: ['fiction'], p: 250, op: 400, y: 1997, cond: 'like_new' },
    { en: 'Moddho-onho', bn: 'মধ্যাহ্ন', auth: 0, cat: ['fiction', 'history-politics'], p: 600, op: 950, y: 2007, cond: 'like_new', w: 'over_1kg' },
    { en: 'Badol Diner Prothom Kodom Phool', bn: 'বাদল দিনের প্রথম কদম ফুল', auth: 0, cat: ['fiction'], p: 210, op: 320, y: 1994, cond: 'good' },
    { en: 'Ayomoy', bn: 'অয়োময়', auth: 0, cat: ['fiction'], p: 260, op: 420, y: 1989, cond: 'good' },
    { en: 'Bohubrihi', bn: 'বহুব্রীহি', auth: 0, cat: ['fiction'], p: 230, op: 360, y: 1988, cond: 'like_new' },
    { en: 'Chokh', bn: 'চোখ', auth: 0, cat: ['fiction', 'thriller-mystery'], p: 170, op: 250, y: 1986, cond: 'good' },
    { en: 'Aaj Himur Biye', bn: 'আজ হিমুর বিয়ে', auth: 0, cat: ['fiction'], p: 190, op: 300, y: 2007, cond: 'new' },
    { en: 'Shonkhonil Karagar (Special Print)', bn: 'শঙ্খনীল কারাগার (বিশেষ সংস্করণ)', auth: 0, cat: ['fiction'], p: 220, op: 350, y: 2012, cond: 'like_new' },
    { en: 'Lilaboti', bn: 'লীলাবতী', auth: 0, cat: ['fiction'], p: 320, op: 500, y: 2005, cond: 'good' },
    { en: 'Kathpencil', bn: 'কাঠপেন্সিল', auth: 0, cat: ['non-fiction', 'biography'], p: 240, op: 380, y: 2010, cond: 'like_new' },
    { en: 'Rongpencil', bn: 'রংপেন্সিল', auth: 0, cat: ['non-fiction', 'biography'], p: 250, op: 390, y: 2011, cond: 'good' },

    // 26-45: Muhammed Zafar Iqbal Sci-Fi & Teens
    { en: 'Dipu Number Two', bn: 'দীপু নাম্বার টু', auth: 3, cat: ['fairy-tales', 'fiction'], p: 180, op: 280, y: 1984, cond: 'good' },
    { en: 'Amar Bondhu Rashed', bn: 'আমার বন্ধু রাশেদ', auth: 3, cat: ['fairy-tales', 'history-politics'], p: 190, op: 300, y: 1997, cond: 'like_new' },
    { en: 'Tukunjil', bn: 'টুকুনজিল', auth: 3, cat: ['sci-fi', 'fairy-tales'], p: 160, op: 250, y: 1993, cond: 'good' },
    { en: 'Ikaras', bn: 'ইকারাস', auth: 3, cat: ['sci-fi'], p: 170, op: 260, y: 1995, cond: 'like_new' },
    { en: 'Ruhan Ruhan', bn: 'রুহান রুহান', auth: 3, cat: ['sci-fi'], p: 175, op: 270, y: 2001, cond: 'good' },
    { en: 'Jalshikari', bn: 'জলশিকারী', auth: 3, cat: ['sci-fi'], p: 165, op: 250, y: 2003, cond: 'acceptable' },
    { en: 'Shanto Shanto Dhol', bn: 'শান্ত শান্ত ধল', auth: 3, cat: ['fairy-tales'], p: 180, op: 280, y: 2006, cond: 'like_new' },
    { en: 'Nitu O Tar Bondhura', bn: 'নিতু ও তার বন্ধুরা', auth: 3, cat: ['fairy-tales'], p: 150, op: 230, y: 1999, cond: 'good' },
    { en: 'Biggan O Gonit Samogro', bn: 'গণিত এবং অন্যান্য', auth: 3, cat: ['non-fiction', 'self-help'], p: 250, op: 400, y: 2012, cond: 'like_new' },
    { en: 'Koptronik Shukh Dukkho', bn: 'কপোট্রনিক সুখ দুঃখ', auth: 3, cat: ['sci-fi'], p: 190, op: 290, y: 1976, cond: 'good' },
    { en: 'Mohakashe Mohashontrash', bn: 'মহাকাশে মহাত্রাস', auth: 3, cat: ['sci-fi'], p: 160, op: 240, y: 1990, cond: 'acceptable' },
    { en: 'Mayabi Ek Romoni', bn: 'মায়াবী এক রমণী', auth: 3, cat: ['sci-fi'], p: 180, op: 270, y: 2004, cond: 'good' },
    { en: 'Project Nebyula', bn: 'প্রজেক্ট নেবুলা', auth: 3, cat: ['sci-fi'], p: 170, op: 260, y: 2000, cond: 'like_new' },
    { en: 'Obonil', bn: 'অবনীল', auth: 3, cat: ['sci-fi'], p: 165, op: 250, y: 2004, cond: 'good' },
    { en: 'Kabil Kohkafi', bn: 'কাবিল কোহকাফী', auth: 3, cat: ['fairy-tales'], p: 190, op: 300, y: 2007, cond: 'like_new' },

    // 46-65: Satyajit Ray & Detectives & Thrillers
    { en: 'Feluda Somogro Vol 1', bn: 'ফেলুদা সমগ্র ১ম খণ্ড', auth: 4, cat: ['detective', 'fiction'], p: 580, op: 900, y: 2015, cond: 'like_new', w: 'over_1kg' },
    { en: 'Feluda Somogro Vol 2', bn: 'ফেলুদা সমগ্র ২য় খণ্ড', auth: 4, cat: ['detective', 'fiction'], p: 590, op: 900, y: 2016, cond: 'like_new', w: 'over_1kg' },
    { en: 'Professor Shonku Somogro', bn: 'প্রফেসর শঙ্কু সমগ্র', auth: 4, cat: ['sci-fi', 'fiction'], p: 520, op: 850, y: 2014, cond: 'good', w: 'over_1kg' },
    { en: 'Tarini Khuror Kirti', bn: 'তারিণী খুড়োর কীর্তি', auth: 4, cat: ['fiction', 'fairy-tales'], p: 220, op: 340, y: 2008, cond: 'like_new' },
    { en: 'Shonku Ekai Eksho', bn: 'শঙ্কু একাই একশো', auth: 4, cat: ['sci-fi'], p: 190, op: 300, y: 2002, cond: 'good' },
    { en: 'Sonar Kella (Novel)', bn: 'সোনার কেল্লা', auth: 4, cat: ['detective'], p: 180, op: 280, y: 1971, cond: 'good' },
    { en: 'Joy Baba Felunath', bn: 'জয় বাবা ফেলুনাথ', auth: 4, cat: ['detective'], p: 190, op: 290, y: 1975, cond: 'like_new' },
    { en: 'Bombaier Bombete', bn: 'বোম্বাইয়ের বোম্বেটে', auth: 4, cat: ['detective'], p: 175, op: 270, y: 1976, cond: 'good' },
    { en: 'Masud Rana: Dhongsopahar', bn: 'মাসুদ রানা: ধ্বংসপাহাড়', auth: 20, cat: ['thriller-mystery'], p: 110, op: 160, y: 1966, cond: 'acceptable' },
    { en: 'Masud Rana: Bharatnatyam', bn: 'মাসুদ রানা: ভরতনাট্যম', auth: 20, cat: ['thriller-mystery'], p: 120, op: 180, y: 1970, cond: 'good' },
    { en: 'Masud Rana: Swarno Mrigo', bn: 'মাসুদ রানা: স্বর্ণমৃগ', auth: 20, cat: ['thriller-mystery'], p: 130, op: 190, y: 1973, cond: 'like_new' },

    // 66-90: Bengali Classics (Rabindranath, Nazrul, Sarat Chandra, Bibhutibhushan, Jibanananda)
    { en: 'Gitanjali', bn: 'গীতাঞ্জলি', auth: 1, cat: ['bangla-poetry', 'poetry'], p: 200, op: 320, y: 1910, cond: 'like_new' },
    { en: 'Shesher Kobita', bn: 'শেষের কবিতা', auth: 1, cat: ['fiction', 'literature'], p: 190, op: 280, y: 1929, cond: 'like_new' },
    { en: 'Gora', bn: 'গোরা', auth: 1, cat: ['fiction', 'literature'], p: 350, op: 550, y: 1910, cond: 'good', w: 'between_300g_1kg' },
    { en: 'Chokher Bali', bn: 'চোখের বালি', auth: 1, cat: ['fiction'], p: 240, op: 380, y: 1903, cond: 'good' },
    { en: 'Golpoguchchho Complete', bn: 'গল্পগুচ্ছ সমগ্র', auth: 1, cat: ['fiction', 'literature'], p: 550, op: 850, y: 2012, cond: 'like_new', w: 'over_1kg' },
    { en: 'Noukadubi', bn: 'নৌকাডুবি', auth: 1, cat: ['fiction'], p: 260, op: 400, y: 1906, cond: 'good' },
    { en: 'Sanchita', bn: 'সঞ্চিতা', auth: 2, cat: ['bangla-poetry', 'poetry'], p: 280, op: 450, y: 1928, cond: 'like_new' },
    { en: 'Agnibeena', bn: 'অগ্নিবীণা', auth: 2, cat: ['bangla-poetry', 'poetry'], p: 220, op: 350, y: 1922, cond: 'good' },
    { en: 'Bisher Bashi', bn: 'বিষের বাঁশী', auth: 2, cat: ['bangla-poetry'], p: 210, op: 330, y: 1924, cond: 'like_new' },
    { en: 'Devdas', bn: 'দেবদাস', auth: 5, cat: ['fiction'], p: 160, op: 250, y: 1917, cond: 'good' },
    { en: 'Pather Dabi', bn: 'পথের দাবী', auth: 5, cat: ['fiction', 'history-politics'], p: 250, op: 400, y: 1926, cond: 'good' },
    { en: 'Charitraheen', bn: 'চরিত্রহীন', auth: 5, cat: ['fiction'], p: 290, op: 460, y: 1914, cond: 'acceptable' },
    { en: 'Srikanta Complete', bn: 'শ্রীকান্ত (চার খণ্ড একত্রে)', auth: 5, cat: ['fiction'], p: 480, op: 750, y: 2010, cond: 'like_new', w: 'over_1kg' },
    { en: 'Pather Panchali', bn: 'পথের পাঁচালী', auth: 6, cat: ['fiction', 'literature'], p: 270, op: 420, y: 1929, cond: 'like_new' },
    { en: 'Aparajito', bn: 'অপরাজিত', auth: 6, cat: ['fiction'], p: 290, op: 460, y: 1932, cond: 'good' },
    { en: 'Aranyak', bn: 'আরণ্যক', auth: 6, cat: ['fiction', 'literature'], p: 240, op: 380, y: 1939, cond: 'like_new' },
    { en: 'Chander Pahar', bn: 'চাঁদের পাহাড়', auth: 6, cat: ['fairy-tales', 'fiction'], p: 190, op: 290, y: 1937, cond: 'good' },
    { en: 'Ruposhi Bangla', bn: 'রূপসী বাংলা', auth: 14, cat: ['bangla-poetry'], p: 200, op: 320, y: 1957, cond: 'like_new' },
    { en: 'Banalata Sen', bn: 'বনলতা সেন', auth: 14, cat: ['bangla-poetry'], p: 180, op: 280, y: 1942, cond: 'good' },
    { en: 'Chhadmabeshi', bn: 'ছদ্মবেশী', auth: 9, cat: ['fiction'], p: 210, op: 320, y: 1968, cond: 'good' },
    { en: 'Drishtipat', bn: 'দৃষ্টিপাত', auth: 9, cat: ['fiction', 'non-fiction'], p: 240, op: 360, y: 1952, cond: 'like_new' },
    { en: 'Khoabnama', bn: 'খোয়াবনামা', auth: 10, cat: ['fiction', 'literature'], p: 350, op: 550, y: 1996, cond: 'like_new', w: 'between_300g_1kg' },
    { en: 'Chilekothar Sepai', bn: 'চিলেকোঠার সেপাই', auth: 10, cat: ['fiction', 'history-politics'], p: 380, op: 580, y: 1986, cond: 'good', w: 'between_300g_1kg' },
    { en: 'Agunpakhi', bn: 'আগুনপাখি', auth: 11, cat: ['fiction'], p: 280, op: 450, y: 2006, cond: 'like_new' },
    { en: 'Ekattorer Dinguli', bn: 'একাত্তরের দিনগুলি (জাহানারা ইমাম)', auth: 22, cat: ['history-politics', 'biography'], p: 290, op: 450, y: 1986, cond: 'like_new' },

    // 91-120: Academic, HSC, Engineering, BCS & Admission
    { en: 'HSC Physics 1st Paper - Tapan', bn: 'পদার্থবিজ্ঞান ১ম পত্র - ড. শাহজাহান তপন', auth: 29, cat: ['hsc-science'], p: 320, op: 550, y: 2023, cond: 'good', w: 'between_300g_1kg' },
    { en: 'HSC Physics 2nd Paper - Tapan', bn: 'পদার্থবিজ্ঞান ২য় পত্র - ড. শাহজাহান তপন', auth: 29, cat: ['hsc-science'], p: 340, op: 560, y: 2023, cond: 'good', w: 'between_300g_1kg' },
    { en: 'HSC Chemistry 1st Paper - Hazari & Nag', bn: 'রসায়ন ১ম পত্র - হাজারী ও নাগ', auth: 29, cat: ['hsc-science'], p: 350, op: 580, y: 2022, cond: 'acceptable', w: 'between_300g_1kg' },
    { en: 'HSC Chemistry 2nd Paper - Hazari & Nag', bn: 'রসায়ন ২য় পত্র - হাজারী ও নাগ', auth: 29, cat: ['hsc-science'], p: 360, op: 590, y: 2022, cond: 'good', w: 'between_300g_1kg' },
    { en: 'HSC Higher Math 1st Paper - SU Ahmed', bn: 'উচ্চতর গণিত ১ম পত্র - এস ইউ আহাম্মদ', auth: 29, cat: ['hsc-science'], p: 310, op: 520, y: 2023, cond: 'good', w: 'between_300g_1kg' },
    { en: 'HSC Higher Math 2nd Paper - SU Ahmed', bn: 'উচ্চতর গণিত ২য় পত্র - এস ইউ আহাম্মদ', auth: 29, cat: ['hsc-science'], p: 320, op: 530, y: 2023, cond: 'like_new', w: 'between_300g_1kg' },
    { en: 'SSC General Science Guide', bn: 'এসএসসি সাধারণ বিজ্ঞান লেকচার গাইড', auth: 29, cat: ['ssc-board-books'], p: 220, op: 400, y: 2023, cond: 'good' },
    { en: 'SSC English Grammar & Composition', bn: 'এসএসসি ইংলিশ গ্রামার অ্যান্ড কম্পোজিশন', auth: 29, cat: ['ssc-board-books'], p: 200, op: 360, y: 2022, cond: 'like_new' },
    { en: 'BUET Engineering Question Bank (15 Years)', bn: 'বুয়েট ইঞ্জিনিয়ারিং ভর্তি প্রশ্নব্যাংক (১৫ বছরের সমাধান)', auth: 29, cat: ['varsity-admission', 'engineering-cse'], p: 450, op: 750, y: 2023, cond: 'like_new', w: 'over_1kg' },
    { en: 'Medical Admission Biology Booster', bn: 'মেডিকেল জীববিজ্ঞান পূর্ণাঙ্গ সহায়িকা', auth: 29, cat: ['varsity-admission', 'medical-dental'], p: 390, op: 650, y: 2023, cond: 'good', w: 'between_300g_1kg' },
    { en: 'BCS MP3 Bangladesh Affairs', bn: 'এমপিথ্রি বাংলাদেশ বিষয়াবলী (বিসিএস প্রস্তুতি)', auth: 22, cat: ['bcs-prep', 'history-politics'], p: 420, op: 700, y: 2023, cond: 'good', w: 'over_1kg' },
    { en: 'BCS MP3 International Affairs', bn: 'এমপিথ্রি আন্তর্জাতিক বিষয়াবলী', auth: 22, cat: ['bcs-prep'], p: 380, op: 650, y: 2023, cond: 'like_new', w: 'between_300g_1kg' },
    { en: 'George BCS English Literature & Grammar', bn: 'জর্জ বিসিএস ইংলিশ লিটারেচার ও গ্রামার', auth: 22, cat: ['bcs-prep'], p: 350, op: 600, y: 2023, cond: 'like_new', w: 'between_300g_1kg' },
    { en: 'Professors Bank Job Recruitment Guide', bn: 'প্রফেসর’স ব্যাংক জব নিয়োগ গাইড', auth: 22, cat: ['bcs-prep', 'bba-economics'], p: 490, op: 800, y: 2023, cond: 'good', w: 'over_1kg' },
    { en: 'Data Structures and Algorithms in C++', bn: 'ডাটা স্ট্রাকচার ও অ্যালগরিদম পরিচিতি', auth: 3, cat: ['engineering-cse'], p: 320, op: 550, y: 2021, cond: 'like_new', w: 'between_300g_1kg' },
    { en: 'Database Management Systems - Ramakrishnan', bn: 'ডাটাবেস ম্যানেজমেন্ট সিস্টেম্স', auth: 25, cat: ['engineering-cse'], p: 450, op: 850, y: 2018, cond: 'good', w: 'over_1kg' },
    { en: 'Guyton and Hall Medical Physiology (South Asia Edition)', bn: 'গাইটন অ্যান্ড হল মেডিকেল ফিজিওলজি', auth: 25, cat: ['medical-dental'], p: 850, op: 1600, y: 2020, cond: 'good', w: 'over_1kg' },
    { en: 'Kotler Marketing Management', bn: 'মার্কেটিং ম্যানেজমেন্ট - ফিলিপ কোটলার', auth: 25, cat: ['bba-economics'], p: 550, op: 1100, y: 2019, cond: 'good', w: 'over_1kg' },

    // 121-140: World Literature & Translations
    { en: 'Nineteen Eighty-Four (1984)', bn: '১৯৮৪ (জর্জ অরওয়েল)', auth: 25, cat: ['fiction', 'history-politics'], p: 260, op: 420, y: 1949, cond: 'like_new' },
    { en: 'Animal Farm', bn: 'অ্যানিমেল ফার্ম', auth: 25, cat: ['fiction'], p: 180, op: 280, y: 1945, cond: 'like_new' },
    { en: 'One Hundred Years of Solitude', bn: 'নিঃসঙ্গতার একশ বছর (মার্কেস)', auth: 26, cat: ['fiction', 'literature'], p: 380, op: 600, y: 1967, cond: 'like_new', w: 'between_300g_1kg' },
    { en: 'Love in the Time of Cholera', bn: 'কলেরার দিনগুলিতে প্রেম', auth: 26, cat: ['fiction'], p: 320, op: 520, y: 1985, cond: 'good' },
    { en: 'Crime and Punishment', bn: 'অপরাধ ও শাস্তি (দস্তয়েভস্কি)', auth: 27, cat: ['fiction', 'literature'], p: 450, op: 750, y: 1866, cond: 'like_new', w: 'over_1kg' },
    { en: 'The Brothers Karamazov', bn: 'কারামাজভ ভাইয়েরা', auth: 27, cat: ['fiction', 'literature'], p: 580, op: 950, y: 1880, cond: 'good', w: 'over_1kg' },
    { en: 'Norwegian Wood', bn: 'নরওয়েজিয়ান উড (মুরাকামি)', auth: 28, cat: ['fiction'], p: 300, op: 480, y: 1987, cond: 'like_new' },
    { en: 'Kafka on the Shore', bn: 'কাফকা অন দ্য শোর', auth: 28, cat: ['fiction'], p: 340, op: 540, y: 2002, cond: 'good' },
    { en: 'The Alchemist (Bangla Translation)', bn: 'দ্য অ্যালকেমিস্ট (বাংলা অনুবাদ)', auth: 25, cat: ['fiction', 'self-help'], p: 190, op: 300, y: 1988, cond: 'like_new' },
    { en: 'Atomic Habits (Bangla)', bn: 'অ্যাটমিক হ্যাবিটস', auth: 25, cat: ['self-help'], p: 280, op: 450, y: 2021, cond: 'new' },

    // 141-160: Rare, Vintage, First Editions & Collectibles
    { en: 'Bichitra Magazine (1978 Eid Special)', bn: 'সাপ্তাহিক বিচিত্রা (১৯৭৮ ঈদ সংখ্যা - দুর্লভ)', auth: 22, cat: ['old-periodicals', 'rare-vintage'], p: 1200, op: 2500, y: 1978, cond: 'acceptable', rare: true, feat: true },
    { en: 'Desh Magazine Satyajit Ray Issue 1985', bn: 'দেশ পত্রিকা: সত্যজিৎ রায় বিশেষ সংখ্যা (১৯৮৫)', auth: 4, cat: ['old-periodicals', 'rare-vintage'], p: 1500, op: 3000, y: 1985, cond: 'good', rare: true, feat: true },
    { en: 'Shonkhonil Karagar First Edition (1973)', bn: 'শঙ্খনীল কারাগার (১৯৭৩ প্রথম সংস্করণ - খাঁটি কপি)', auth: 0, cat: ['first-editions', 'rare-vintage'], p: 3500, op: 6000, y: 1973, cond: 'good', rare: true, feat: true },
    { en: 'Gitanjali 1913 Nobel Commemorative Hardcover', bn: 'গীতাঞ্জলি (১৯১৩ নোবেল স্মারক বাঁধাই সংস্করণ)', auth: 1, cat: ['first-editions', 'rare-vintage'], p: 4500, op: 8000, y: 1913, cond: 'good', rare: true, feat: true },
    { en: 'Nondito Noroke 1st Print 1972 Khan Brothers', bn: 'নন্দিত নরকে (খান ব্রাদার্স ১৯৭২ ১ম মুদ্রণ)', auth: 0, cat: ['first-editions', 'rare-vintage'], p: 2800, op: 5000, y: 1972, cond: 'acceptable', rare: true },
    { en: 'Sheba Western Kuasha Vol 1 (1969)', bn: 'কুয়াশা ১ - কাজী আনোয়ার হোসেন (১৯৬৯ সেবা প্রকাশনী)', auth: 20, cat: ['rare-vintage', 'thriller-mystery'], p: 950, op: 2000, y: 1969, cond: 'acceptable', rare: true },
    { en: 'Masud Rana: Agnipath 1st Edition', bn: 'মাসুদ রানা: অগ্নিপথ (দুর্লভ প্রথম সংস্করণ)', auth: 20, cat: ['rare-vintage', 'thriller-mystery'], p: 850, op: 1800, y: 1971, cond: 'acceptable', rare: true },
    { en: 'Bangla Sahityer Itihas (Dr. Sukumar Sen)', bn: 'বাঙ্গালা সাহিত্যের ইতিহাস (৪ খণ্ড দুর্লভ সংস্করণ)', auth: 22, cat: ['rare-vintage', 'history-politics'], p: 3200, op: 6000, y: 1963, cond: 'good', rare: true, w: 'over_1kg' },
    { en: 'Begum Magazine 1960 Women’s Rights Issue', bn: 'বেগম পত্রিকা (১৯৬০ সংখ্যা - নুরজাহান বেগম সম্পাদিত)', auth: 16, cat: ['old-periodicals', 'rare-vintage'], p: 1800, op: 4000, y: 1960, cond: 'acceptable', rare: true },
    { en: 'Pather Panchali Signed Copy reprint 1950s', bn: 'পথের পাঁচালী (১৯৫০ দশকের সুবর্ণ রেখা সংস্করণ)', auth: 6, cat: ['first-editions', 'rare-vintage'], p: 2600, op: 5000, y: 1954, cond: 'good', rare: true },
    { en: 'Sanchita 1935 Classic D.M. Library Edition', bn: 'সঞ্চিতা (১৯৩৫ ডি এম লাইব্রেরী বাঁধাই)', auth: 2, cat: ['first-editions', 'rare-vintage'], p: 2400, op: 4500, y: 1935, cond: 'acceptable', rare: true },
    { en: 'Agnibeena Centenary Edition with Manuscript Facsimile', bn: 'অগ্নিবীণা শতবর্ষ স্মারক প্রতিলিপিসহ সংস্করণ', auth: 2, cat: ['rare-vintage'], p: 1600, op: 3000, y: 2022, cond: 'like_new', rare: true },
    { en: 'Dhaka Pachas Bachhar Agey - Hridoynath Majumdar', bn: 'ঢাকার পঞ্চাশ বছর আগের চিত্র (হৃদয়নাথ মজুমদার - ১৯২৪)', auth: 22, cat: ['rare-vintage', 'history-politics'], p: 2100, op: 4000, y: 1924, cond: 'good', rare: true },
    { en: 'Smritikatha - Abanindranath Tagore (Collector)', bn: 'ঘরোয়া ও জোড়াসাঁকোর ধারে (অবনীন্দ্রনাথ ঠাকুর)', auth: 1, cat: ['rare-vintage', 'biography'], p: 1750, op: 3500, y: 1944, cond: 'good', rare: true },
    { en: 'Lalshalu (Syed Waliullah 1948 Rare Print)', bn: 'লালসালু (সৈয়দ ওয়ালীউল্লাহ্ ১৯৪৮ কথাবিতান মুদ্রণ)', auth: 22, cat: ['first-editions', 'rare-vintage'], p: 2900, op: 5500, y: 1948, cond: 'good', rare: true },

    // 146-170: Additional popular fiction, comics, academic, and poetry
    { en: 'Himu Mama', bn: 'হিমু মামা', auth: 0, cat: ['fiction'], p: 170, op: 260, y: 2004, cond: 'good' },
    { en: 'Moyurakkhi O Himur Nil Podmo', bn: 'ময়ূরাক্ষী ও হিমুর নীলপদ্ম সংকলন', auth: 0, cat: ['fiction'], p: 320, op: 500, y: 2010, cond: 'like_new' },
    { en: 'Misir Alir Amimangshito Rohoshyo', bn: 'মিসির আলির অমীমাংসিত রহস্য', auth: 0, cat: ['fiction', 'thriller-mystery'], p: 210, op: 320, y: 1996, cond: 'good' },
    { en: 'Voy', bn: 'ভয়', auth: 0, cat: ['fiction', 'thriller-mystery'], p: 180, op: 270, y: 1991, cond: 'like_new' },
    { en: 'Epitaph', bn: 'এপিটাফ', auth: 0, cat: ['fiction'], p: 190, op: 290, y: 1998, cond: 'good' },
    { en: 'Deyal', bn: 'দেয়াল', auth: 0, cat: ['fiction', 'history-politics'], p: 350, op: 550, y: 2013, cond: 'like_new' },
    { en: 'Chhaya Shongi', bn: 'ছায়াসঙ্গী', auth: 0, cat: ['fiction', 'thriller-mystery'], p: 180, op: 280, y: 1993, cond: 'good' },
    { en: 'Bohubrihi Special Illustrated', bn: 'বহুব্রীহি চিত্রিত সংস্করণ', auth: 0, cat: ['fiction'], p: 280, op: 420, y: 2005, cond: 'like_new' },
    { en: 'Ami Topu', bn: 'আমি তপু', auth: 3, cat: ['fairy-tales', 'fiction'], p: 200, op: 300, y: 2005, cond: 'like_new' },
    { en: 'Bratachari Shonku', bn: 'ব্রহ্মচারী শঙ্কু', auth: 4, cat: ['sci-fi'], p: 180, op: 280, y: 1982, cond: 'good' },
    { en: 'Gorosthane Sabdhan', bn: 'গোরস্থানে সাবধান', auth: 4, cat: ['detective'], p: 190, op: 290, y: 1977, cond: 'like_new' },
    { en: 'Tintorettor Jishu', bn: 'টিনটোরেটোর যীশু', auth: 4, cat: ['detective'], p: 190, op: 290, y: 1983, cond: 'good' },
    { en: 'Kailashey Kelenkari', bn: 'কৈলাসে কেলেঙ্কারী', auth: 4, cat: ['detective'], p: 185, op: 280, y: 1974, cond: 'like_new' },
    { en: 'Badshahi Angti', bn: 'বাদশাহী আংটি', auth: 4, cat: ['detective'], p: 195, op: 300, y: 1969, cond: 'good' },
    { en: 'Aro Ekjon Feluda', bn: 'আরো একজন ফেলুদা', auth: 4, cat: ['detective'], p: 220, op: 340, y: 1993, cond: 'like_new' },
    { en: 'Basic Ali Comics Vol 1', bn: 'বেসিক আলী কমিকস খণ্ড ১ (শাহরিয়ার)', auth: 22, cat: ['comics', 'children-teens'], p: 250, op: 400, y: 2012, cond: 'good' },
    { en: 'Basic Ali Comics Vol 2', bn: 'বেসিক আলী কমিকস খণ্ড ২', auth: 22, cat: ['comics', 'children-teens'], p: 250, op: 400, y: 2013, cond: 'like_new' },
    { en: 'Chacha Chaudhury & Sabu Bangla', bn: 'চাচা চৌধুরী ও সাবু (রঙিন ক্লাসিক কমিকস)', auth: 22, cat: ['comics'], p: 150, op: 250, y: 2008, cond: 'good' },
    { en: 'Nonte Phonte Somogro (Narayan Debnath)', bn: 'নন্টে ফন্টে সমগ্র (নারায়ণ দেবনাথ)', auth: 22, cat: ['comics', 'children-teens'], p: 480, op: 750, y: 2015, cond: 'like_new', w: 'over_1kg' },
    { en: 'Bantul the Great Complete', bn: 'বাঁটুল দি গ্রেট সমগ্র (রঙিন)', auth: 22, cat: ['comics', 'children-teens'], p: 490, op: 800, y: 2016, cond: 'like_new', w: 'over_1kg' },
    { en: 'Hada Bhoda Samagra', bn: 'হাঁদা ভোঁদা সমগ্র', auth: 22, cat: ['comics', 'children-teens'], p: 450, op: 750, y: 2017, cond: 'good', w: 'between_300g_1kg' },
    { en: 'HSC Biology 1st Paper - Abul Hasan', bn: 'জীববিজ্ঞান ১ম পত্র (উদ্ভিদবিজ্ঞান) - ড. আবুল হাসান', auth: 29, cat: ['hsc-science'], p: 360, op: 580, y: 2023, cond: 'good', w: 'between_300g_1kg' },
    { en: 'HSC Biology 2nd Paper - Gazi Azmal', bn: 'জীববিজ্ঞান ২য় পত্র (প্রাণিবিজ্ঞান) - গাজী আজমল', auth: 29, cat: ['hsc-science'], p: 370, op: 590, y: 2023, cond: 'like_new', w: 'between_300g_1kg' },
    { en: 'HSC Accounting 1st & 2nd Paper Guide', bn: 'হিসাববিজ্ঞান ১ম ও ২য় পত্র পূর্ণাঙ্গ গাইড', auth: 29, cat: ['hsc-commerce-arts'], p: 320, op: 520, y: 2022, cond: 'good', w: 'between_300g_1kg' },
    { en: 'HSC Economics 1st Paper', bn: 'এইচএসসি অর্থনীতি ১ম পত্র', auth: 29, cat: ['hsc-commerce-arts'], p: 260, op: 420, y: 2023, cond: 'like_new' },
    { en: 'IELTS Cambridge Academic 17 with Audio', bn: 'ক্যামব্রিজ আইইএলটিএস ১৭ একাডেমিক টেস্ট', auth: 25, cat: ['varsity-admission'], p: 280, op: 500, y: 2022, cond: 'like_new' },
    { en: 'IELTS Cambridge Academic 18 with Keys', bn: 'ক্যামব্রিজ আইইএলটিএস ১৮ প্র্যাকটিস টেস্ট', auth: 25, cat: ['varsity-admission'], p: 300, op: 520, y: 2023, cond: 'new' },
    { en: 'GRE Big Book (27 Full Tests)', bn: 'জিআরই বিগ বুক (সম্পূর্ণ টেস্ট সমাধানসহ)', auth: 25, cat: ['varsity-admission'], p: 580, op: 950, y: 2020, cond: 'good', w: 'over_1kg' },
    { en: 'Al-Quranul Karim Bangla Translation and Tafsir', bn: 'পবিত্র কুরআনুল কারীম (বাংলা অনুবাদ ও সংক্ষিপ্ত তাফসীর)', auth: 22, cat: ['islamic-books', 'religion'], p: 650, op: 1100, y: 2020, cond: 'like_new', w: 'over_1kg' },
    { en: 'Riyadus Saliheen Bangla (Full Set)', bn: 'রিয়াদুস সালেহীন (বাংলা পূর্ণাঙ্গ সংস্করণ)', auth: 22, cat: ['islamic-books', 'religion'], p: 750, op: 1300, y: 2019, cond: 'like_new', w: 'over_1kg' },
    { en: 'Ar-Raheeq Al-Makhtum (The Sealed Nectar)', bn: 'আর-রাহীকুল মাখতূম (সীরাতুন্নবী)', auth: 22, cat: ['islamic-books', 'religion', 'biography'], p: 380, op: 600, y: 2018, cond: 'like_new', w: 'between_300g_1kg' },
    { en: 'Bela Phurabar Agey - Arif Azad', bn: 'বেলা ফুরাবার আগে - আরিফ আজাদ', auth: 22, cat: ['islamic-books', 'self-help'], p: 220, op: 350, y: 2020, cond: 'new' },
    { en: 'Paradoxical Sajid 1 - Arif Azad', bn: 'প্যারাডক্সিক্যাল সাজিদ ১ - আরিফ আজাদ', auth: 22, cat: ['islamic-books', 'comparative-religion'], p: 240, op: 380, y: 2017, cond: 'like_new' },
    { en: 'Paradoxical Sajid 2 - Arif Azad', bn: 'প্যারাডক্সিক্যাল সাজিদ ২ - আরিফ আজাদ', auth: 22, cat: ['islamic-books', 'comparative-religion'], p: 260, op: 400, y: 2019, cond: 'like_new' },
    { en: 'Songshoptok - Shahidullah Kaiser', bn: 'সংশপ্তক - শহীদুল্লা কায়সার', auth: 22, cat: ['fiction', 'history-politics'], p: 340, op: 550, y: 1965, cond: 'good', w: 'between_300g_1kg' },
    { en: 'Sareng Bou - Shahidullah Kaiser', bn: 'সারেং বউ - শহীদুল্লা কায়সার', auth: 22, cat: ['fiction'], p: 220, op: 360, y: 1962, cond: 'good' },
    { en: 'Hajar Bachhor Dhore - Zahir Raihan', bn: 'হাজার বছর ধরে - জহির রায়হান', auth: 22, cat: ['fiction'], p: 180, op: 280, y: 1964, cond: 'like_new' },
    { en: 'Borof Gola Nodi - Zahir Raihan', bn: 'বরফ গলা নদী - জহির রায়হান', auth: 22, cat: ['fiction'], p: 170, op: 260, y: 1969, cond: 'good' },
    { en: 'Aarek Phalgun - Zahir Raihan', bn: 'আরেক ফাল্গুন - জহির রায়হান', auth: 22, cat: ['fiction', 'history-politics'], p: 175, op: 270, y: 1969, cond: 'like_new' },
    { en: 'Padma Nadir Majhi - Manik Bandopadhyay', bn: 'পদ্মা নদীর মাঝি - মানিক বন্দ্যোপাধ্যায়', auth: 18, cat: ['fiction', 'literature'], p: 190, op: 300, y: 1936, cond: 'good' },
    { en: 'Putul Nacher Itikatha - Manik Bandopadhyay', bn: 'পুতুলনাচের ইতিকথা - মানিক বন্দ্যোপাধ্যায়', auth: 18, cat: ['fiction', 'literature'], p: 230, op: 360, y: 1936, cond: 'like_new' },
    { en: 'Hansuli Banker Upakatha - Tarasankar Bandyopadhyay', bn: 'হাঁসুলী বাঁকের উপকথা - তারাশঙ্কর বন্দ্যোপাধ্যায়', auth: 19, cat: ['fiction', 'literature'], p: 350, op: 550, y: 1947, cond: 'good', w: 'between_300g_1kg' },
    { en: 'Ganadevata - Tarasankar Bandyopadhyay', bn: 'গণদেবতা - তারাশঙ্কর বন্দ্যোপাধ্যায়', auth: 19, cat: ['fiction', 'literature'], p: 380, op: 600, y: 1942, cond: 'like_new', w: 'between_300g_1kg' },
    { en: 'Pratham Alo (Vol 1 & 2) - Sunil Gangopadhyay', bn: 'প্রথম আলো (অখণ্ড সংস্করণ) - সুনীল গঙ্গোপাধ্যায়', auth: 7, cat: ['fiction', 'history-politics'], p: 680, op: 1100, y: 1996, cond: 'like_new', w: 'over_1kg' },
    { en: 'Shei Shomoy (Vol 1 & 2) - Sunil Gangopadhyay', bn: 'সেই সময় (অখণ্ড সংস্করণ) - সুনীল গঙ্গোপাধ্যায়', auth: 7, cat: ['fiction', 'history-politics'], p: 690, op: 1100, y: 1982, cond: 'like_new', w: 'over_1kg' },
    { en: 'Purba Paschim - Sunil Gangopadhyay', bn: 'পূর্ব পশ্চিম (অখণ্ড সংস্করণ) - সুনীল গঙ্গোপাধ্যায়', auth: 7, cat: ['fiction', 'history-politics'], p: 720, op: 1200, y: 1989, cond: 'good', w: 'over_1kg' },
    { en: 'Kakababu Samagra Vol 1 - Sunil Gangopadhyay', bn: 'কাকাবাবু সমগ্র ১ম খণ্ড - সুনীল গঙ্গোপাধ্যায়', auth: 7, cat: ['detective', 'fairy-tales'], p: 480, op: 750, y: 2011, cond: 'like_new', w: 'over_1kg' },
    { en: 'Goyenda Baradacharan - Shirshendu Mukhopadhyay', bn: 'গোয়েন্দা বরদাচরণ ও অদ্ভুতুড়ে সিরিজ', auth: 8, cat: ['detective', 'fairy-tales'], p: 250, op: 400, y: 2005, cond: 'good' },
    { en: 'Manojder Adbhut Bari - Shirshendu Mukhopadhyay', bn: 'মনোজদের অদ্ভুত বাড়ি - শীর্ষেন্দু মুখোপাধ্যায়', auth: 8, cat: ['fairy-tales'], p: 190, op: 300, y: 1978, cond: 'like_new' },
    { en: 'Goshai Baganer Bhoot - Shirshendu Mukhopadhyay', bn: 'গোঁসাইবাগানের ভূত - শীর্ষেন্দু মুখোপাধ্যায়', auth: 8, cat: ['fairy-tales'], p: 180, op: 280, y: 1979, cond: 'good' },
    { en: 'Deshe Bideshe - Syed Mujtaba Ali', bn: 'দেশে বিদেশে - সৈয়দ মুজতবা আলী', auth: 9, cat: ['non-fiction', 'biography'], p: 260, op: 420, y: 1949, cond: 'like_new' },
    { en: 'Chachakahini - Syed Mujtaba Ali', bn: 'চাচাকাহিনী - সৈয়দ মুজতবা আলী', auth: 9, cat: ['fiction', 'literature'], p: 210, op: 340, y: 1952, cond: 'good' },
    { en: 'Panchatantra - Syed Mujtaba Ali', bn: 'পঞ্চতন্ত্র - সৈয়দ মুজতবা আলী', auth: 9, cat: ['non-fiction'], p: 240, op: 380, y: 1952, cond: 'like_new' },
    { en: 'Matir Jahaj - Hasan Azizul Huq', bn: 'মাটির জাহাজ - হাসান আজিজুল হক', auth: 11, cat: ['fiction'], p: 220, op: 350, y: 1977, cond: 'good' },
    { en: 'Jeebon O Rajnoitik Bastobota - Shahidul Zahir', bn: 'জীবন ও রাজনৈতিক বাস্তবতা - শহীদুল জহির', auth: 22, cat: ['fiction', 'literature'], p: 200, op: 320, y: 1988, cond: 'like_new' },
    { en: 'She Shey Raat - Shahidul Zahir', bn: 'সে রাতে পূর্ণিমা ছিল - শহীদুল জহির', auth: 22, cat: ['fiction'], p: 190, op: 300, y: 1995, cond: 'good' },
    { en: 'Nari - Humayun Azad', bn: 'নারী - হুমায়ুন আজাদ', auth: 24, cat: ['non-fiction', 'history-politics'], p: 320, op: 500, y: 1992, cond: 'like_new' },
    { en: 'Koto Nodi Shorobor - Humayun Azad', bn: 'কত নদী সরোবর বা বাংলা ভাষার জীবনী - হুমায়ুন আজাদ', auth: 24, cat: ['non-fiction', 'literature'], p: 250, op: 400, y: 1987, cond: 'good' },
    { en: 'Chhobir Deshe Kobitar Deshe - Sunil Gangopadhyay', bn: 'ছবির দেশে কবিতার দেশে - সুনীল গঙ্গোপাধ্যায়', auth: 7, cat: ['non-fiction', 'biography'], p: 240, op: 380, y: 1977, cond: 'like_new' },
    { en: 'Kopalkundala - Bankim Chandra Chattopadhyay', bn: 'কপালকুণ্ডলা - বঙ্কিমচন্দ্র চট্টোপাধ্যায়', auth: 22, cat: ['fiction', 'literature'], p: 180, op: 280, y: 1866, cond: 'good' },
    { en: 'Anandamath - Bankim Chandra Chattopadhyay', bn: 'আনন্দমঠ - বঙ্কিমচন্দ্র চট্টোপাধ্যায়', auth: 22, cat: ['fiction', 'history-politics'], p: 200, op: 320, y: 1882, cond: 'like_new' },
    { en: 'Bishbriksha - Bankim Chandra Chattopadhyay', bn: 'বিষবৃক্ষ - বঙ্কিমচন্দ্র চট্টোপাধ্যায়', auth: 22, cat: ['fiction'], p: 190, op: 300, y: 1873, cond: 'good' },
    { en: 'Rajsingha - Bankim Chandra Chattopadhyay', bn: 'রাজসিংহ - বঙ্কিমচন্দ্র চট্টোপাধ্যায়', auth: 22, cat: ['fiction', 'history-politics'], p: 220, op: 350, y: 1882, cond: 'like_new' },
    { en: 'Meghnad Badh Kavya - Michael Madhusudan Dutt', bn: 'মেঘনাদবধ কাব্য - মাইকেল মধুসূদন দত্ত', auth: 17, cat: ['bangla-poetry', 'poetry'], p: 280, op: 450, y: 1861, cond: 'like_new' },
    { en: 'Sultana’s Dream - Rokeya Sakhawat Hossain', bn: 'সুলতানার স্বপ্ন ও পদ্মরাগ - বেগম রোকেয়া', auth: 16, cat: ['sci-fi', 'fiction'], p: 180, op: 280, y: 1905, cond: 'new' },
    { en: 'Abar Ashibo Phire - Jibanananda Das Somogro', bn: 'আবার আসিব ফিরে (জীবনানন্দ দাশ সমগ্র কবিতা)', auth: 14, cat: ['bangla-poetry', 'poetry'], p: 450, op: 750, y: 2012, cond: 'like_new', w: 'over_1kg' },
    { en: 'Chharpatra - Sukanta Bhattacharya', bn: 'ছাড়পত্র - সুকান্ত ভট্টাচার্য', auth: 15, cat: ['bangla-poetry', 'poetry'], p: 170, op: 260, y: 1947, cond: 'good' },
    { en: 'Roudro Korotite - Shamsur Rahman', bn: 'রৌদ্র করোটিতে - শামসুর রাহমান', auth: 12, cat: ['bangla-poetry'], p: 190, op: 300, y: 1963, cond: 'like_new' },
    { en: 'Nij Bashbhume - Shamsur Rahman', bn: 'নিজ বাসভূমে - শামসুর রাহমান', auth: 12, cat: ['bangla-poetry'], p: 200, op: 320, y: 1970, cond: 'good' },
    { en: 'Sonali Kabin - Al Mahmud', bn: 'সোনালী কাবিন - আল মাহমুদ', auth: 13, cat: ['bangla-poetry', 'poetry'], p: 220, op: 350, y: 1973, cond: 'like_new' },
    { en: 'Mayabi Porda Dule Utho - Al Mahmud', bn: 'মায়াবী পর্দা দুলে ওঠো - আল মাহমুদ', auth: 13, cat: ['bangla-poetry'], p: 190, op: 290, y: 1969, cond: 'good' },
    { en: 'Desh Magazine Special Sarodiyo Issue 1990', bn: 'দেশ পত্রিকা শারদীয় বিশেষ সংখ্যা (১৯৯০ - দুর্লভ)', auth: 7, cat: ['old-periodicals', 'rare-vintage'], p: 1400, op: 2800, y: 1990, cond: 'good', rare: true, feat: true },
    { en: 'Shochitra Shondhani 1975 Historic Issue', bn: 'সচিত্র সন্ধানী (১৯৭৫ সালের বিশেষ ঐতিহাসিক সংখ্যা)', auth: 22, cat: ['old-periodicals', 'rare-vintage'], p: 1650, op: 3200, y: 1975, cond: 'acceptable', rare: true, feat: true },
    { en: 'Bichitra 1972 Victory Edition', bn: 'সাপ্তাহিক বিচিত্রা (১৯৭২ প্রথম বিজয় বার্ষিকী সংখ্যা)', auth: 22, cat: ['old-periodicals', 'rare-vintage'], p: 2400, op: 5000, y: 1972, cond: 'good', rare: true, feat: true },
    { en: 'Rabindra Rachanabali Centenary Edition Vol 1', bn: 'রবীন্দ্র রচনাবলী শতবর্ষ সংস্করণ ১ম খণ্ড (রাজকীয় বাঁধাই)', auth: 1, cat: ['first-editions', 'rare-vintage'], p: 2800, op: 5500, y: 1961, cond: 'good', rare: true, w: 'over_1kg' },
    { en: 'Nazrul Rachanabali Bangla Academy 1st Print', bn: 'নজরুল রচনাবলী বাংলা একাডেমি ১ম মুদ্রণ খণ্ড ১', auth: 2, cat: ['first-editions', 'rare-vintage'], p: 2600, op: 5000, y: 1976, cond: 'good', rare: true, w: 'over_1kg' },

  ];

  return titles.map((t, idx) => {
    const coverUrl = SAMPLE_COVERS[idx % SAMPLE_COVERS.length];
    const images = [
      coverUrl,
      BACK_COVER,
      SPINE_PAGE,
      DETAIL_PAGE,
    ];

    let w: 'under_300g' | 'between_300g_1kg' | 'over_1kg' = 'under_300g';
    if ((t as any).w) {
      w = (t as any).w;
    } else if (t.p > 400) {
      w = 'between_300g_1kg';
    }

    return {
      title_en: t.en,
      title_bn: t.bn,
      author_index: t.auth,
      publisher_index: idx % 10,
      category_slugs: t.cat,
      description: `বইটির অবস্থা: ${t.cond === 'new' ? 'একদম নতুন' : t.cond === 'like_new' ? 'নতুনের মত অক্ষত' : t.cond === 'good' ? 'ভালো ও পড়ার উপযোগী' : 'চলনসই'}। সব পাতা নিখুঁত ও বাঁধানো শক্ত। নীলক্ষেত বা ঢাকার যেকোনো প্রান্ত থেকে ক্যাশ অন ডেলিভারিতে দ্রুত হাতে পাবেন।`,
      condition: t.cond as any,
      language: 'bn',
      price: t.p,
      original_price: t.op,
      edition: t.y ? `${t.y} সংস্করণ` : 'সাধারণ মুদ্রণ',
      publication_year: t.y,
      is_rare: !!(t as any).rare,
      is_featured: !!(t as any).feat,
      stock_count: 1,
      weight_bucket: w,
      images,
    };
  });
}
