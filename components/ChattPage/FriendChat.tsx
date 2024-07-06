import { useRouter } from 'next/router';
import ProfilePage from '../AccountGroup/ProfileImage';
import SendMessage from '../Messages/SendMessage';
import DisplayMessage from '../Messages/DisplayMessages';

import { useEffect, useState, FC } from 'react';

interface ChatRoomPageProps {
    friend_key: string;
}

const ChatRoomPage: FC<ChatRoomPageProps> = ({ friend_key }) => {
    const [currentFriendKey, setCurrentFriendKey] = useState<string>(friend_key);
    const [friendName, setFriendName] = useState<string>("Unknown"); 

    useEffect(() => {
        setCurrentFriendKey(friend_key);
        fetchFriendName(friend_key).then(name => setFriendName(name));
    }, [friend_key]);

    const fetchFriendName = async (key: string) => {
        return "Friend's Name"; 
    };

    return (
        <div style={{ padding: "20px", maxWidth: "600px", margin: "auto" }}>
            <ProfilePage ownerAddresse={currentFriendKey}   />
            <SendMessage Chat_Key={currentFriendKey} useCase={"sendMessage"}/>
            <DisplayMessage useCase={"fetchGetGroupMessage"} messageId={currentFriendKey} />
        </div>
    );
};

export default ChatRoomPage;
