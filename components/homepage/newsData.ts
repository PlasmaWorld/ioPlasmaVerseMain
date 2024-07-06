export interface NewsItem {
  id: number;
  title: string;
  description: string;
  image: string;
  button: string;
}

export interface Article {
  id: number;
  newsSectionId: number; // Add this property to associate articles with news sections
  title: string;
  content: string;
  date: string;
}

export const newsItems: NewsItem[] = [
  {
    id: 1,
    title: 'PlasmaVerse News Highlights',
    description: 'Stay updated with the latest news and developments from the PlasmaVerse developments.',
    image: '/plasma_world_news_image.png',
    button: 'Read Articles'
  },
  {
    id: 2,
    title: 'Upcoming Launches',
    description: 'Watch out and don\'t miss the upcoming launch',
    image: '/NftRocket.png',
    button: 'Read Articles'
  },
  {
    id: 3,
    title: 'List & Launch with us',
    description: 'Everything in one place, contact us for more information.',
    image: '/ContactUs.png',
    button: 'Contact us'
  },
];

export const articles: Article[] = [
  {
    id: 1,
    newsSectionId: 1, // Associate with "PlasmaVerse News Highlights"
    title: 'Breaking News: PlasmaVerse Reaches New Milestone',
    content: 'PlasmaVerse has reached a new milestone today We officical Started the 1 Month Testphase',
    date: '2024-04-28',
  },

    
  
  {
    id: 3,
    newsSectionId: 2, // Associate with "Upcoming Launches"
    title: 'New Launch: PlasmaRocket',
    content: `Get ready for the launch of PlasmaWorld NFT on ioPlasmaVerse! The Plasma World Foundation officially launched on April 28, 2024, with the release of ioPlasmaVerse for the community. This foundation will be entirely managed by NFT holders.

    The foundation was established with the goal of connecting people worldwide and building a comprehensive ecosystem through networking. It aims to support projects in the Web3 sector, provide affordable living solutions, and promote open-source development for agriculture, energy, and transportation.`,   
    date: '2024-05-12',
  },
  {
    id: 4,
    newsSectionId: 2, // Associate with "Upcoming Launches"
    title: 'Countdown to the PlasmaVerse Launch Event',
    content: 'The countdown to the PlasmaLaunch event has begun... PlasmaVerse Have Started the 1 Month Testphase and each tester will recieve a Free NFT from the First NFT Launch ',
    date: '2024-04-28',
  },
];
