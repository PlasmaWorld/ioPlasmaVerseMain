import React from 'react';
import { Card, Image, Text, Button } from '@mantine/core';
import styles from './NewsCard.module.css'; // Ensure you have the correct path for your styles

type NewsItem = {
    image: string;
    title: string;
    description: string;
    button: string;
};

interface NewsCardProps {
    newsItem: NewsItem;
    onViewArticle: (item: NewsItem) => void;
}

function NewsCard({ newsItem, onViewArticle }: NewsCardProps) {
    return (
        <Card 
            shadow="md" 
            className={`rounded-lg overflow-hidden h-full ${styles.newsCard}`} 
            style={{ backgroundColor: 'rgba(24, 24, 24, 0.8)' }} // Set background color to match the dark theme
        > 
            <Image
                src={newsItem.image}
                alt={newsItem.title}
                height={200}
                fit="cover"
                className="object-cover w-full h-48"
            />
            <div className="p-4 h-48 flex flex-col justify-between">
                <div>
                    <Text size="lg" weight={700} mt={0} mb={2} color="black">
                        {newsItem.title}
                    </Text>
                    <Text size="sm" mt={0} mb={4} color="black">
                        {newsItem.description}
                    </Text>
                </div>
                <Button
                     variant="outline"

                    color="blue"
                    onClick={() => onViewArticle(newsItem)}
                    className="w-full"
                >
                    {newsItem.button}
                </Button>
            </div>
        </Card>
    );
}

export default NewsCard;
