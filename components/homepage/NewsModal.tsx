import React from 'react';
import { Text, Image, Button, Card } from '@mantine/core';
import { Article } from './newsData'; // Import the Article type
import styles from './NewsModal.module.css';

interface NewsModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  image: string;
  articles: Article[];
}

const NewsModal: React.FC<NewsModalProps> = ({ isOpen, onClose, title, description, image, articles }) => {
  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalWrapper} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalContent}>
          <Image src={image} alt={title} className={styles.modalImage} />
          <div className={styles.modalText}>
            <Text className={styles.modalTitle}>{title}</Text>
            <Text className={styles.modalDescription}>{description}</Text>
            <div className={styles.articleContainer}>
              {articles.map((article) => (
                <Card key={article.id} className={styles.articleCard}>
                  <Text className={styles.articleTitle}>{article.title}</Text>
                  <Text className={styles.articleDate}>{article.date}</Text>
                  <Text className={styles.articleContent}>{article.content}</Text>
                </Card>
              ))}
            </div>
            <Button variant="outline" color="blue" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewsModal;
