import { NextResponse } from 'next/server';
import fetch from 'node-fetch';

const botToken = process.env.TELEGRAM_BOT_TOKEN;
const chatId = process.env.TELEGRAM_GROUP_CHAT_ID;

export async function POST(request: Request) {
  try {
    const requestBody = await request.json();
    console.log('Incoming request:', requestBody);
    const {  buyer, seller, price,collection, tokenId, marketplace, imageUrl } = requestBody;

    // Construct the message
    const message = `🎉 New Sale Detected!\nBuyer: ${buyer}\nSeller: ${seller}\nPrice: ${price} \nCollection: ${collection}\nToken ID: ${tokenId}\nMarketplace: ${marketplace}`;

    // Send the message to the Telegram group
    const url = `https://api.telegram.org/bot${botToken}/sendPhoto`; // Use sendPhoto for images
    const params = {
      chat_id: chatId,
      caption: message,
      photo: imageUrl, 
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    const data = await response.json();

    if (!data.ok) {
      return NextResponse.json({ error: data.description }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Message sent successfully!' }, { status: 200 });
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json({ error: 'Error sending message' }, { status: 500 });
  }
}
