import { useRouter } from 'next/router';

import { useEffect, useState, FC } from 'react';
import { BigNumber } from 'ethers';
import ProfilePage from '../AccountGroup/ProfileImage';
import SendMessage from '../Messages/SendMessage';
import DisplayMessage from '../Messages/DisplayMessages';

interface ChatRoomPageProps {
    groupId: string;
    groupOwner: string;
  }
  
  const GroupChatRoomPage: React.FC<ChatRoomPageProps> = ({ groupId,groupOwner }) => {
    return (
      <div style={{ padding: "20px", maxWidth: "600px", margin: "auto" }}>
        <ProfilePage ownerAddresse={groupOwner}  />

        <SendMessage Chat_Key={groupId} useCase={"sendGroupMessage"}  />
        <DisplayMessage useCase={"fetchGetGroupMessage"} messageId={groupId}         
                   /> 
      </div>
    );
  };
  
  export default GroupChatRoomPage;
  