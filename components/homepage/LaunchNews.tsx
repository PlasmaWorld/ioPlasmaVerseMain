import React, { useState } from 'react';
import { Text, Avatar, Group, Button } from '@mantine/core';
import NewsCard from './NewsCard';
import ContactUs from './ContactUs';
import NewsModal from './NewsModal';
import { newsItems, articles } from './newsData'; // Import the news items and articles
import styles from './NewsSection2.module.css';
import Modal from './M/Modal';

type NewsItem = {
  id: number;
  title: string;
  description: string;
  image: string;
  button: string;
};

function NewsSection2() {
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState<boolean>(false);
  const [selectedNewsItem, setSelectedNewsItem] = useState<NewsItem | null>(null);

  const openModal = (newsItem: NewsItem) => {
    setSelectedNewsItem(newsItem);
    if (newsItem.button === 'Contact us') {
      setIsContactModalOpen(true);
    } else {
      setIsModalOpen(true);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setIsContactModalOpen(false);
  };

  const getArticlesForNewsItem = (newsSectionId: number) => {
    return articles.filter(article => article.newsSectionId === newsSectionId);
  };

  return (
    <div className='max-w-7xl mx-auto mt-36'>
      <div>
        <h2 className='text-sky-500 text-2xl font-semibold text-center pt-20 pb-10'>Latest News</h2>
        <div className="flex gap-10 overflow-x-auto">
          {newsItems.map((newsItem) => (
            <div key={newsItem.id} style={{ flex: '1 0 0', minWidth: '300px', maxWidth: '400px' }}>
              <NewsCard
                newsItem={newsItem}
                onViewArticle={() => openModal(newsItem)}
              />
            </div>
          ))}
        </div>
      </div>

      {selectedNewsItem && !isContactModalOpen && (
        <NewsModal
          isOpen={isModalOpen}
          onClose={closeModal}
          title={selectedNewsItem.title}
          description={selectedNewsItem.description}
          image={selectedNewsItem.image}
          articles={getArticlesForNewsItem(selectedNewsItem.id)}
        />
      )}

      {isContactModalOpen && (
        <Modal isOpen={isContactModalOpen} onClose={closeModal}>
          <ContactUs onClose={closeModal} />
        </Modal>
      )}
    </div>
  );
}

export default NewsSection2;
